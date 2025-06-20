// js/debug/bounding-box-debug.js
/**
 * バウンディングボックスのデバッグ表示機能
 */

export class BoundingBoxDebug {
    constructor(scene) {
        this.scene = scene;
        this.isEnabled = false;
        this.boundingBoxMeshes = new Map(); // メッシュとそのバウンディングボックスのマッピング
        this.updateInterval = null;
    }

    /**
     * バウンディングボックス表示を有効/無効にする
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (enabled) {
            this.showAllBoundingBoxes();
            // 定期的に更新（移動したオブジェクトに対応）
            this.updateInterval = setInterval(() => {
                this.updateBoundingBoxes();
            }, 100);
        } else {
            this.hideAllBoundingBoxes();
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }
    }

    /**
     * すべての配置済みアセットのバウンディングボックスを表示
     */
    showAllBoundingBoxes() {
        console.log("=== バウンディングボックス表示開始 ===");
        let assetCount = 0;
        
        this.scene.meshes.forEach(mesh => {
            // 配置済みアセットのみ対象
            if (mesh.metadata && (mesh.metadata.isAsset || mesh.metadata.isPlacedAsset || mesh.metadata.isVehicle)) {
                console.log(`バウンディングボックス作成対象: ${mesh.name}`, mesh.metadata);
                this.createBoundingBoxForMesh(mesh);
                assetCount++;
            }
        });
        
        console.log(`バウンディングボックス作成完了: ${assetCount}個のアセット`);
    }

    /**
     * メッシュのバウンディングボックスを作成
     * @param {BABYLON.AbstractMesh} mesh 
     */
    createBoundingBoxForMesh(mesh) {
        // 既に作成済みの場合はスキップ
        if (this.boundingBoxMeshes.has(mesh)) {
            return;
        }

        // バウンディングボックスを計算
        mesh.computeWorldMatrix(true);
        const boundingInfo = mesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        
        // ボックスのサイズと位置を計算
        const size = {
            x: max.x - min.x,
            y: max.y - min.y,
            z: max.z - min.z
        };
        
        const center = new BABYLON.Vector3(
            (min.x + max.x) / 2,
            (min.y + max.y) / 2,
            (min.z + max.z) / 2
        );

        // ワイヤーフレームボックスを作成
        const box = BABYLON.MeshBuilder.CreateBox(`boundingBox_${mesh.name}`, {
            width: size.x,
            height: size.y,
            depth: size.z
        }, this.scene);
        
        // ボックスのサイズを保存（更新時に使用）
        box._width = size.x;
        box._height = size.y;
        box._depth = size.z;
        
        box.position = center;
        
        // ワイヤーフレーム表示用のマテリアル
        const material = new BABYLON.StandardMaterial(`boundingBoxMat_${mesh.name}`, this.scene);
        material.wireframe = true;
        material.emissiveColor = new BABYLON.Color3(0, 1, 0); // 緑色
        material.disableLighting = true;
        material.useEmissiveAsIllumination = true;
        box.material = material;
        
        // ピッキング無効化（クリックを透過）
        box.isPickable = false;
        
        // レンダリング順序を調整（常に前面に表示）
        box.renderingGroupId = 1;
        
        // マッピングに追加
        this.boundingBoxMeshes.set(mesh, box);
    }

    /**
     * バウンディングボックスの位置を更新
     */
    updateBoundingBoxes() {
        this.boundingBoxMeshes.forEach((boxMesh, originalMesh) => {
            // 元のメッシュが削除されている場合
            if (!originalMesh || originalMesh.isDisposed()) {
                boxMesh.dispose();
                this.boundingBoxMeshes.delete(originalMesh);
                return;
            }

            // バウンディングボックスを再計算
            originalMesh.computeWorldMatrix(true);
            const boundingInfo = originalMesh.getBoundingInfo();
            const min = boundingInfo.boundingBox.minimumWorld;
            const max = boundingInfo.boundingBox.maximumWorld;
            
            // 位置を更新
            boxMesh.position.x = (min.x + max.x) / 2;
            boxMesh.position.y = (min.y + max.y) / 2;
            boxMesh.position.z = (min.z + max.z) / 2;
            
            // サイズも更新（スケール変更に対応）
            boxMesh.scaling.x = (max.x - min.x) / boxMesh._width;
            boxMesh.scaling.y = (max.y - min.y) / boxMesh._height;
            boxMesh.scaling.z = (max.z - min.z) / boxMesh._depth;
        });

        // 新しく追加されたメッシュをチェック
        if (this.isEnabled) {
            this.scene.meshes.forEach(mesh => {
                if (mesh.metadata && (mesh.metadata.isAsset || mesh.metadata.isPlacedAsset || mesh.metadata.isVehicle)) {
                    if (!this.boundingBoxMeshes.has(mesh)) {
                        console.log(`新しいアセット検出: ${mesh.name}`);
                        this.createBoundingBoxForMesh(mesh);
                    }
                }
            });
        }
    }

    /**
     * すべてのバウンディングボックスを非表示
     */
    hideAllBoundingBoxes() {
        this.boundingBoxMeshes.forEach(boxMesh => {
            boxMesh.dispose();
        });
        this.boundingBoxMeshes.clear();
    }

    /**
     * 特定のメッシュのバウンディングボックスの色を変更
     * @param {BABYLON.AbstractMesh} mesh 
     * @param {BABYLON.Color3} color 
     */
    highlightBoundingBox(mesh, color) {
        const boxMesh = this.boundingBoxMeshes.get(mesh);
        if (boxMesh && boxMesh.material) {
            boxMesh.material.emissiveColor = color;
        }
    }

    /**
     * クリーンアップ
     */
    dispose() {
        this.hideAllBoundingBoxes();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}