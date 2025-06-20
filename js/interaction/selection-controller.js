// js/interaction/SelectionController.js
/**
 * オブジェクトの選択とハイライトを管理するクラス
 */

export class SelectionController {
    constructor(scene, highlightLayer, errorHandler, app) {
        this.scene = scene;
        this.highlightLayer = highlightLayer;
        this.errorHandler = errorHandler;
        this.app = app;
        
        // 選択中のメッシュ
        this.selectedMesh = null;
        
        // 選択時のコールバック
        this.onSelectCallbacks = [];
        this.onDeselectCallbacks = [];
    }

    /**
     * メッシュを選択
     * @param {BABYLON.Mesh} mesh - 選択するメッシュ
     */
    selectMesh(mesh) {
        if (!mesh || mesh === this.selectedMesh) return;
        
        try {
            // 既存の選択を解除
            this.deselectAll();
            
            // 新しいメッシュを選択
            this.selectedMesh = mesh;
            
            // メッシュが破棄されていないことを確認
            if (!mesh.isDisposed()) {
                // 選択可能であることを確認
                mesh.isPickable = true;
                
                // 子メッシュも選択可能に
                if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                    const childMeshes = mesh.getChildMeshes();
                    childMeshes.forEach(childMesh => {
                        childMesh.isPickable = true;
                    });
                    console.log(`${mesh.name} has ${childMeshes.length} child meshes`);
                }
                
                // ハイライト効果を適用
                this.applyHighlight(mesh);
                
                // 選択時のフィードバック
                this.showSelectionFeedback(mesh);
                
                console.log("Mesh selected:", {
                    name: mesh.name,
                    isPickable: mesh.isPickable,
                    position: mesh.position,
                    childCount: mesh.getChildMeshes ? mesh.getChildMeshes().length : 0
                });
                
                // コールバックを実行
                this.onSelectCallbacks.forEach(callback => callback(mesh));
                
                // UIManagerに選択を通知
                const uiManager = this.app.getManager('ui');
                if (uiManager) {
                    uiManager.showSelectedAssetScaleUI(mesh);
                }
            }
            
        } catch (error) {
            this.errorHandler.showError("オブジェクトの選択に失敗しました: " + error.message);
        }
    }

    /**
     * 選択を解除
     */
    deselectAll() {
        if (!this.selectedMesh) return;
        
        try {
            // ハイライトを解除
            this.removeHighlight(this.selectedMesh);
            
            const previousMesh = this.selectedMesh;
            this.selectedMesh = null;
            
            // コールバックを実行
            this.onDeselectCallbacks.forEach(callback => callback(previousMesh));
            
            // UIManagerに選択解除を通知
            const uiManager = this.app.getManager('ui');
            if (uiManager) {
                uiManager.hideSelectedAssetScaleUI();
            }
            
            console.log("Selection cleared");
            
        } catch (error) {
            console.error("Failed to deselect:", error);
        }
    }

    /**
     * ハイライト効果を適用
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    applyHighlight(mesh) {
        if (!this.highlightLayer) return;
        
        try {
            // 白色のハイライト
            this.highlightLayer.addMesh(mesh, BABYLON.Color3.White());
            
            // 子メッシュもハイライト
            if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                mesh.getChildMeshes().forEach(childMesh => {
                    this.highlightLayer.addMesh(childMesh, BABYLON.Color3.White());
                });
            }
        } catch (error) {
            console.warn("Failed to apply highlight:", error);
        }
    }

    /**
     * ハイライトを解除
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    removeHighlight(mesh) {
        if (!this.highlightLayer || !mesh) return;
        
        try {
            this.highlightLayer.removeMesh(mesh);
            
            // 子メッシュのハイライトも解除
            if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                mesh.getChildMeshes().forEach(childMesh => {
                    this.highlightLayer.removeMesh(childMesh);
                });
            }
        } catch (error) {
            console.warn("Failed to remove highlight:", error);
        }
    }

    /**
     * 選択時のフィードバックを表示
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    showSelectionFeedback(mesh) {
        const originalScaling = mesh.scaling.clone();
        
        // 一時的に拡大
        mesh.scaling = new BABYLON.Vector3(
            originalScaling.x * 1.05,
            originalScaling.y * 1.05,
            originalScaling.z * 1.05
        );
        
        // 元のサイズに戻す
        setTimeout(() => {
            if (mesh && !mesh.isDisposed()) {
                mesh.scaling = originalScaling;
            }
        }, 200);
    }

    /**
     * メッシュが選択可能かチェック
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isSelectable(mesh) {
        if (!mesh || !mesh.isPickable) return false;
        
        // 特殊なメッシュは選択不可
        const excludedNames = ['ground', 'floor', 'wall', 'grid', 'helper', 'preview', 'vertical', 'shadow'];
        
        return !excludedNames.some(name => 
            mesh.name.toLowerCase().includes(name)
        );
    }

    /**
     * クリック位置からメッシュを選択
     * @param {BABYLON.PickingInfo} pickResult - ピッキング結果
     * @returns {BABYLON.Mesh|null} 選択されたメッシュ
     */
    selectFromPickResult(pickResult) {
        if (!pickResult.hit || !pickResult.pickedMesh) {
            console.log("❌ ピック失敗: ヒットなしまたはメッシュなし");
            return null;
        }
        
        let targetMesh = null;
        const pickedMesh = pickResult.pickedMesh;
        
        // スカイボックスや背景要素は除外
        if (pickedMesh.name === 'skybox' || 
            pickedMesh.name.includes('background') || 
            pickedMesh.name.includes('sky')) {
            console.log("🌅 背景要素をスキップ:", pickedMesh.name);
            return null;
        }
        
        console.log(`🎯 ピック結果の調査:`, {
            pickedMeshName: pickedMesh.name,
            hasMetadata: !!pickedMesh.metadata,
            metadata: pickedMesh.metadata,
            parentAsset: pickedMesh.metadata?.parentAsset?.name,
            parentAssetPlacementTime: pickedMesh.metadata?.parentAsset?.metadata?.placementTime,
            hasParent: !!pickedMesh.parent,
            parentName: pickedMesh.parent?.name,
            isPickable: pickedMesh.isPickable,
            isEnabled: pickedMesh.isEnabled()
        });
        
        // メタデータから親アセットを取得（最優先）
        if (pickedMesh.metadata && pickedMesh.metadata.parentAsset) {
            targetMesh = pickedMesh.metadata.parentAsset;
            console.log(`✅ メタデータから親アセット取得: ${targetMesh.name}`);
        }
        // 直接選択可能なメッシュ
        else if (this.isUserPlacedMesh(pickedMesh)) {
            targetMesh = pickedMesh;
            console.log(`✅ 直接選択: ${targetMesh.name}`);
        } 
        // 親メッシュから特定
        else if (pickedMesh.parent && this.isUserPlacedMesh(pickedMesh.parent)) {
            targetMesh = pickedMesh.parent;
            console.log(`✅ 親メッシュから特定: ${targetMesh.name}`);
        }
        else {
            console.log(`❌ 選択可能なアセットが見つからない:`, {
                pickedName: pickedMesh.name,
                isUserPlaced: this.isUserPlacedMesh(pickedMesh),
                parentIsUserPlaced: pickedMesh.parent ? this.isUserPlacedMesh(pickedMesh.parent) : false
            });
        }
        
        // 選択可能なメッシュの場合
        if (targetMesh && this.isSelectable(targetMesh)) {
            console.log(`🎉 メッシュ選択実行: ${targetMesh.name}`);
            this.selectMesh(targetMesh);
            return targetMesh;
        } else if (targetMesh) {
            console.log(`⚠️ メッシュは見つかったが選択不可: ${targetMesh.name}, selectable=${this.isSelectable(targetMesh)}`);
        }
        
        return null;
    }

    /**
     * ユーザーが配置したメッシュかチェック
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isUserPlacedMesh(mesh) {
        if (!mesh || !mesh.name) {
            console.log(`❌ isUserPlacedMesh: メッシュまたは名前がない`);
            return false;
        }
        
        const name = mesh.name;
        
        // 標準アセットの判定
        const isStandardAsset = name.startsWith("cube_") || 
                               name.startsWith("burger_") ||
                               name.startsWith("record_") ||
                               name.startsWith("juiceBox_") ||
                               name.startsWith("mikeDesk_");
        
        // 車両アセットの判定
        const isVehicleAsset = name.startsWith("placed_vehicle_") || 
                              (mesh.metadata && mesh.metadata.isVehicle);
        
        // アップロードアセットの判定 (uploaded_ プレフィックス)
        const isUploadedAsset = name.startsWith("uploaded_");
        
        // メタデータによる判定
        const hasAssetMetadata = mesh.metadata && mesh.metadata.isAsset;
        
        const isUserPlaced = isStandardAsset || isVehicleAsset || isUploadedAsset || hasAssetMetadata;
        
        console.log(`🔍 ユーザー配置チェック [${name}]: ${isUserPlaced}`, {
            isStandardAsset,
            isVehicleAsset,
            isUploadedAsset,
            hasAssetMetadata,
            metadata: mesh.metadata
        });
        
        if (!isUserPlaced) {
            // より詳細な分析
            console.log(`  名前パターン分析:`, {
                hasCube: name.includes("cube"),
                hasBurger: name.includes("burger"),  
                hasRecord: name.includes("record"),
                hasJuice: name.includes("juice"),
                hasMike: name.includes("mike"),
                hasDesk: name.includes("desk"),
                hasUploaded: name.includes("uploaded"),
                fullName: name
            });
        }
        
        return isUserPlaced;
    }

    /**
     * 選択中のメッシュを回転
     * @param {number} angle - 回転角度（ラジアン）
     */
    rotateSelectedMesh(angle = Math.PI / 2) {
        if (!this.selectedMesh || this.selectedMesh.isDisposed()) return;
        
        this.selectedMesh.rotation.y += angle;
        console.log("Rotated selected mesh:", this.selectedMesh.name);
    }

    /**
     * 選択中のメッシュを削除
     */
    deleteSelectedMesh() {
        if (!this.selectedMesh || this.selectedMesh.isDisposed()) return;
        
        const meshName = this.selectedMesh.name;
        const meshToDelete = this.selectedMesh;
        const isVehicle = meshToDelete.metadata && meshToDelete.metadata.isVehicle;
        
        // 選択を解除
        this.deselectAll();
        
        // 車両の場合はVehicleManagerからも削除
        if (isVehicle && this.app && this.app.getManager('vehicle')) {
            const vehicleManager = this.app.getManager('vehicle');
            if (vehicleManager.getPlacedVehicle() === meshToDelete) {
                vehicleManager.placedVehicleMesh = null;
            }
        }
        
        // AssetPlacerからも削除（重要）
        if (this.app && this.app.getManager('assetPlacer')) {
            this.app.getManager('assetPlacer').removeAsset(meshToDelete);
        } else {
            // AssetPlacerが見つからない場合は直接削除
            meshToDelete.dispose();
        }
        
        console.log("Deleted mesh:", meshName);
    }

    /**
     * 選択中のメッシュを取得
     * @returns {BABYLON.Mesh|null}
     */
    getSelectedMesh() {
        return this.selectedMesh;
    }

    /**
     * メッシュが選択されているかチェック
     * @returns {boolean}
     */
    hasSelection() {
        return this.selectedMesh !== null;
    }

    /**
     * 選択時のコールバックを追加
     * @param {Function} callback - コールバック関数
     */
    onSelect(callback) {
        this.onSelectCallbacks.push(callback);
    }

    /**
     * 選択解除時のコールバックを追加
     * @param {Function} callback - コールバック関数
     */
    onDeselect(callback) {
        this.onDeselectCallbacks.push(callback);
    }

    /**
     * コールバックをクリア
     */
    clearCallbacks() {
        this.onSelectCallbacks = [];
        this.onDeselectCallbacks = [];
    }

    /**
     * マルチピックで選択可能なメッシュを探す
     * @param {number} x - スクリーンX座標
     * @param {number} y - スクリーンY座標
     * @param {BABYLON.Camera} camera - カメラ
     * @returns {BABYLON.Mesh|null}
     */
    findSelectableMeshFromMultiPick(x, y, camera) {
        const ray = this.scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), camera);
        const hits = this.scene.multiPickWithRay(ray);
        
        console.log(`Multi-pick detected ${hits.length} hits`);
        
        // ヒットしたメッシュから選択可能なものを探す
        for (let hit of hits) {
            const hitMesh = hit.pickedMesh;
            
            // 直接アセットメッシュの場合
            if (this.isUserPlacedMesh(hitMesh)) {
                return hitMesh;
            }
            
            // 親メッシュを確認
            if (hitMesh.parent && this.isUserPlacedMesh(hitMesh.parent)) {
                return hitMesh.parent;
            }
        }
        
        return null;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing SelectionController...");
        
        this.deselectAll();
        this.clearCallbacks();
        
        this.selectedMesh = null;
        this.highlightLayer = null;
    }
}