// js/assets/AssetPlacer.js
/**
 * アセットの配置を管理するクラス
 */

import { ASSET_TYPES, ASSET_URLS, UI_SETTINGS } from '../config/constants.js';
import { PRESET_COLORS } from '../utils/color-utils.js';

export class AssetPlacer {
    constructor(scene, assetLoader, errorHandler) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.errorHandler = errorHandler;
        
        // 配置されたアセットのリスト
        this.placedAssets = [];
        
        // 最後の壁の法線（壁配置用）
        this.lastWallNormal = null;
        
        // シャドウジェネレーターの参照
        this.shadowGenerator = null;
    }

    /**
     * シャドウジェネレーターを設定
     * @param {BABYLON.ShadowGenerator} shadowGenerator
     */
    setShadowGenerator(shadowGenerator) {
        this.shadowGenerator = shadowGenerator;
    }

    /**
     * アセットを配置
     * @param {string} assetType - アセットタイプ
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null} 配置されたメッシュ
     */
    placeAsset(assetType, position) {
        try {
            let mesh = null;
            
            console.log(`Placing asset: ${assetType} at position:`, position);
            
            switch (assetType) {
                case ASSET_TYPES.CUBE:
                    mesh = this.placeBurger(position);
                    break;
                case ASSET_TYPES.RECORD_MACHINE:
                    mesh = this.placeRecord(position);
                    break;
                case ASSET_TYPES.JUICE_BOX:
                    mesh = this.placeJuiceBox(position);
                    break;
                case ASSET_TYPES.MIKE_DESK:
                    mesh = this.placeMikeDesk(position);
                    break;
                default:
                    this.errorHandler.showError(`Unknown asset type: ${assetType}`);
                    return null;
            }
            
            if (mesh) {
                // 配置エフェクトを表示
                this.showPlacementEffect(position, assetType);
                
                // リストに追加
                this.placedAssets.push(mesh);
                
                // 影を設定
                this.setupShadow(mesh);
                
                // 確実にメッシュが表示されるようにする
                mesh.setEnabled(true);
                
                // シーンを強制的に再レンダリング
                const renderCallback = () => {
                    // 一度だけ実行
                    this.scene.unregisterBeforeRender(renderCallback);
                    this.scene.render();
                };
                this.scene.registerBeforeRender(renderCallback);
                
                console.log(`Asset placed successfully: ${assetType} (mesh: ${mesh.name}, enabled: ${mesh.isEnabled()}, pickable: ${mesh.isPickable})`);
            } else {
                console.error(`Failed to place asset: ${assetType}`);
            }
            
            return mesh;
            
        } catch (error) {
            this.errorHandler.showError("アセットの配置に失敗しました: " + error.message);
            console.error("Asset placement error:", error);
            return null;
        }
    }

    /**
     * バーガーを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeBurger(position) {
        if (this.assetLoader.isModelAvailable('burger')) {
            const timestamp = Date.now();
            const burger = this.assetLoader.cloneModel('burger', `burger_${timestamp}`);
            
            if (burger) {
                this.positionAssetOnFloor(burger, position);
                this.applyWallRotation(burger);
                this.setupMeshInteraction(burger);
                this.createBoundingBox(burger, timestamp);
                return burger;
            }
        } else {
            // モデルがない場合は動的にロード
            this.loadAndPlaceAsset(ASSET_URLS.BURGER, `burger_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * レコードマシンを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeRecord(position) {
        if (this.assetLoader.isModelAvailable('recordMachine')) {
            const timestamp = Date.now();
            const record = this.assetLoader.cloneModel('recordMachine', `record_${timestamp}`);
            
            if (record) {
                this.positionAssetOnFloor(record, position);
                this.applyWallRotation(record);
                this.setupMeshInteraction(record);
                this.createBoundingBox(record, timestamp);
                return record;
            }
        } else {
            this.loadAndPlaceAsset(ASSET_URLS.RECORD_MACHINE, `record_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * ジュースボックスを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeJuiceBox(position) {
        if (this.assetLoader.isModelAvailable('juiceBox')) {
            const timestamp = Date.now();
            const juiceBox = this.assetLoader.cloneModel('juiceBox', `juiceBox_${timestamp}`);
            
            if (juiceBox) {
                this.positionAssetOnFloor(juiceBox, position);
                this.applyWallRotation(juiceBox);
                this.setupMeshInteraction(juiceBox);
                this.createBoundingBox(juiceBox, timestamp);
                return juiceBox;
            }
        } else {
            this.loadAndPlaceAsset(ASSET_URLS.JUICE_BOX, `juiceBox_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * マイクデスクを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh}
     */
    placeMikeDesk(position) {
        const timestamp = Date.now();
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            `mikeDesk_${timestamp}`, 
            { 
                diameterTop: 0, 
                diameterBottom: 0.6,
                height: 0.9,
                tessellation: 4
            }, 
            this.scene
        );
        
        // マテリアルを作成
        const material = new BABYLON.StandardMaterial("mikeDeskMaterial", this.scene);
        material.diffuseColor = PRESET_COLORS.MIKE_DESK;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.specularPower = 0;
        material.zOffset = 1;
        material.disableLighting = false;
        mesh.material = material;
        
        this.positionAssetOnFloor(mesh, position);
        this.applyWallRotation(mesh);
        this.setupMeshInteraction(mesh);
        
        return mesh;
    }

    /**
     * アセットを床面に正しく配置
     * @param {BABYLON.Mesh} mesh - 配置するメッシュ
     * @param {BABYLON.Vector3} position - 基準位置
     */
    positionAssetOnFloor(mesh, position) {
        try {
            // まず基準位置に配置
            mesh.position = position.clone();
            
            // メッシュが有効化されていることを確認
            mesh.setEnabled(true);
            
            // 子メッシュも有効化
            const childMeshes = mesh.getChildMeshes();
            childMeshes.forEach(child => {
                child.setEnabled(true);
            });
            
            console.log(`🔍 メッシュ調査 [${mesh.name}]:`, {
                hasGeometry: !!mesh.geometry,
                childCount: childMeshes.length,
                isEnabled: mesh.isEnabled(),
                childNames: childMeshes.map(c => c.name)
            });
            
            // 少し待ってからバウンディングボックスを計算
            setTimeout(() => {
                this.calculateAndSetPosition(mesh, position, childMeshes);
            }, 50);
            
            return;
            
        } catch (error) {
            console.error(`❌ アセット配置エラー [${mesh.name}]:`, error);
            mesh.position.y = position.y + 0.05;
        }
    }
    
    /**
     * バウンディングボックス計算と位置設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {BABYLON.Vector3} position - 基準位置
     * @param {Array} childMeshes - 子メッシュ配列
     */
    calculateAndSetPosition(mesh, position, childMeshes) {
        try {
            // 全体のワールドマトリックスを更新
            mesh.computeWorldMatrix(true);
            
            // 子メッシュのワールドマトリックスも更新
            childMeshes.forEach(child => {
                child.computeWorldMatrix(true);
                child.refreshBoundingInfo();
            });
            
            // メインメッシュのバウンディング情報を更新
            mesh.refreshBoundingInfo();
            
            // バウンディングボックスを取得（子メッシュを含む）
            let boundingInfo;
            let usedChildMesh = false;
            
            if (childMeshes.length > 0) {
                // 子メッシュがある場合は、子メッシュのバウンディングボックスを使用
                const validChildren = childMeshes.filter(child => 
                    child.geometry && child.isEnabled() && !child.isDisposed()
                );
                
                if (validChildren.length > 0) {
                    console.log(`👶 子メッシュを使用してバウンディングボックス計算 [${mesh.name}]:`, 
                        validChildren.map(c => c.name));
                    
                    // 有効な子メッシュの最初のものを使用
                    boundingInfo = validChildren[0].getBoundingInfo();
                    usedChildMesh = true;
                }
            }
            
            // 子メッシュが使用できない場合はメインメッシュを使用
            if (!boundingInfo) {
                boundingInfo = mesh.getBoundingInfo();
            }
            
            if (!boundingInfo || !boundingInfo.boundingBox) {
                console.warn(`⚠️ バウンディングボックスが取得できません: ${mesh.name}`);
                console.warn(`フォールバック使用: スケールベースの高さ推定`);
                
                // フォールバック: スケール情報から高さを推定
                const scale = mesh.scaling;
                const estimatedHeight = scale.y * 2.0; // 推定高さ（スケールの2倍）
                mesh.position.y = position.y + estimatedHeight / 2;
                
                console.log(`📏 スケールベース配置 [${mesh.name}]: 推定高さ=${estimatedHeight.toFixed(3)}, Y=${mesh.position.y.toFixed(3)}`);
                return;
            }
            
            // バウンディングボックスの最下点を取得
            const boundingBox = boundingInfo.boundingBox;
            const minY = boundingBox.minimumWorld.y;
            const maxY = boundingBox.maximumWorld.y;
            const height = maxY - minY;
            
            // 異常に小さいバウンディングボックスの検出
            if (height < 0.01) {
                console.warn(`⚠️ バウンディングボックスが異常に小さい [${mesh.name}]: height=${height.toFixed(6)}`);
                
                if (usedChildMesh) {
                    console.log(`🔄 全子メッシュのバウンディングボックスを調査中...`);
                    
                    // 全子メッシュのバウンディングボックスを調査
                    childMeshes.forEach((child, index) => {
                        const childBounding = child.getBoundingInfo();
                        if (childBounding && childBounding.boundingBox) {
                            const childMin = childBounding.boundingBox.minimumWorld.y;
                            const childMax = childBounding.boundingBox.maximumWorld.y;
                            const childHeight = childMax - childMin;
                            
                            console.log(`  子メッシュ[${index}] ${child.name}: height=${childHeight.toFixed(6)}, minY=${childMin.toFixed(3)}, maxY=${childMax.toFixed(3)}`);
                        }
                    });
                }
                
                // フォールバック: スケールベースの配置
                const scale = mesh.scaling;
                const estimatedHeight = scale.y * 1.0; // スケールから推定
                mesh.position.y = position.y + estimatedHeight / 2;
                
                console.log(`📏 フォールバック配置 [${mesh.name}]: スケール=${scale.y.toFixed(3)}, 推定高さ=${estimatedHeight.toFixed(3)}`);
                return;
            }
            
            console.log(`📦 バウンディングボックス情報 [${mesh.name}]:`, {
                source: usedChildMesh ? 'child-mesh' : 'main-mesh',
                minY: minY.toFixed(3),
                maxY: maxY.toFixed(3),
                height: height.toFixed(3),
                meshY: mesh.position.y.toFixed(3),
                targetFloorY: position.y.toFixed(3)
            });
            
            // 床面からの正しい位置を計算
            const offsetFromMeshToBottom = mesh.position.y - minY;
            const newY = position.y + offsetFromMeshToBottom + 0.001; // 1mm浮かす
            
            mesh.position.y = newY;
            
            console.log(`✅ アセット配置完了 [${mesh.name}]: Y=${newY.toFixed(3)} (offset: ${offsetFromMeshToBottom.toFixed(3)})`);
            
        } catch (error) {
            console.error(`❌ バウンディングボックス計算エラー [${mesh.name}]:`, error);
            mesh.position.y = position.y + 0.05;
        }
    }

    /**
     * 動的にアセットをロードして配置
     * @param {string} url - アセットURL
     * @param {string} name - メッシュ名
     * @param {BABYLON.Vector3} position - 配置位置
     */
    async loadAndPlaceAsset(url, name, position) {
        try {
            const mesh = await this.assetLoader.loadAsset(url, name);
            
            // バウンディングボックスを使用して適切に配置
            this.positionAssetOnFloor(mesh, position);
            
            // 壁配置の場合は回転
            this.applyWallRotation(mesh);
            
            // インタラクションを設定
            this.setupMeshInteraction(mesh);
            
            // リストに追加
            this.placedAssets.push(mesh);
            
            // 影を設定
            this.setupShadow(mesh);
            
            // シーンを再レンダリング
            this.scene.render();
            
        } catch (error) {
            this.errorHandler.showError("アセットのロードに失敗しました: " + error.message);
        }
    }

    /**
     * 壁配置用の回転を適用
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    applyWallRotation(mesh) {
        if (this.lastWallNormal) {
            const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                new BABYLON.Vector3(0, 0, 1),
                this.lastWallNormal,
                new BABYLON.Quaternion()
            );
            mesh.rotationQuaternion = rotationQuaternion;
            this.lastWallNormal = null;
        }
    }

    /**
     * メッシュのインタラクションを設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupMeshInteraction(mesh) {
        // メインメッシュの設定
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.renderingGroupId = 0;
        mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
        
        // アクティブメッシュとして常に選択
        mesh.alwaysSelectAsActiveMesh = true;
        
        // メッシュのマテリアル設定
        if (mesh.material) {
            mesh.material.needDepthPrePass = false;
            mesh.material.separateCullingPass = true;
            mesh.material.backFaceCulling = false;
            mesh.material.forceDepthWrite = true;
        }
        
        // 子メッシュの設定
        const childMeshes = mesh.getChildMeshes();
        if (childMeshes.length > 0) {
            childMeshes.forEach(childMesh => {
                // 子メッシュも選択可能に設定
                childMesh.isPickable = true;
                childMesh.receiveShadows = true;
                childMesh.renderingGroupId = 0;
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
                
                // 親メッシュへの参照を設定（強制的に新しいメタデータオブジェクトを作成）
                childMesh.metadata = {
                    parentAsset: mesh,
                    isChildMesh: true,
                    parentName: mesh.name,
                    childIndex: childMeshes.indexOf(childMesh)
                };
                
                // 子メッシュのマテリアル設定
                if (childMesh.material) {
                    childMesh.material.needDepthPrePass = false;
                    childMesh.material.backFaceCulling = false;
                    childMesh.material.forceDepthWrite = true;
                    // zOffsetは削除（深度バッファの問題を避けるため）
                }
            });
        }
        
        // メッシュのメタデータを設定（強制的に新しいオブジェクトを作成）
        mesh.metadata = {
            isAsset: true,
            canMove: true,
            assetName: mesh.name,
            placementTime: Date.now(),
            childCount: childMeshes.length
        };
        
        // 詳細な選択可能性の調査
        console.log(`🎯 メッシュ選択設定完了 [${mesh.name}]:`, {
            mainMeshPickable: mesh.isPickable,
            mainMeshEnabled: mesh.isEnabled(),
            mainMeshVisible: mesh.visibility,
            childCount: childMeshes.length,
            childPickableCount: childMeshes.filter(c => c.isPickable).length,
            hasGeometry: !!mesh.geometry,
            hasParent: !!mesh.parent,
            metadata: {
                isAsset: mesh.metadata?.isAsset,
                canMove: mesh.metadata?.canMove
            }
        });
        
        // 子メッシュの詳細情報
        if (childMeshes.length > 0) {
            console.log(`👶 子メッシュ詳細 [${mesh.name}]:`);
            childMeshes.forEach((child, index) => {
                console.log(`  [${index}] ${child.name}: pickable=${child.isPickable}, enabled=${child.isEnabled()}, visible=${child.visibility}, hasGeometry=${!!child.geometry}`);
            });
        }
    }

    /**
     * バウンディングボックスを作成
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {number} timestamp - タイムスタンプ
     */
    createBoundingBox(mesh, timestamp) {
        const boundingBox = BABYLON.MeshBuilder.CreateBox(
            `boundingBox_${timestamp}`, 
            {
                width: 0.5,
                height: 0.5,
                depth: 0.5
            }, 
            this.scene
        );
        
        boundingBox.position = mesh.position.clone();
        boundingBox.parent = mesh;
        boundingBox.visibility = 0.0;
        boundingBox.isPickable = true;
        
        // メタデータを追加
        boundingBox.metadata = boundingBox.metadata || {};
        boundingBox.metadata.parentAsset = mesh;
    }

    /**
     * 影を設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupShadow(mesh) {
        if (!this.shadowGenerator) return;
        
        try {
            this.shadowGenerator.removeShadowCaster(mesh);
        } catch (e) {
            // 初回は存在しないのでエラーは無視
        }
        
        this.shadowGenerator.addShadowCaster(mesh, true);
        console.log("Shadow caster added:", mesh.name);
        
        // シーンを再レンダリング
        setTimeout(() => {
            this.scene.render();
        }, 100);
    }

    /**
     * 配置エフェクトを表示
     * @param {BABYLON.Vector3} position - 位置
     * @param {string} assetType - アセットタイプ
     */
    showPlacementEffect(position, assetType) {
        try {
            const particleSystem = new BABYLON.ParticleSystem(
                "placementEffect", 
                UI_SETTINGS.PARTICLE_EFFECT.COUNT, 
                this.scene
            );
            
            particleSystem.particleTexture = new BABYLON.Texture(
                ASSET_URLS.FLARE_TEXTURE, 
                this.scene
            );
            
            particleSystem.emitter = position.clone();
            
            // アセットタイプに応じてスケールを調整
            const scale = this.getEffectScale(assetType);
            
            particleSystem.minEmitBox = new BABYLON.Vector3(-0.5 * scale, 0, -0.5 * scale);
            particleSystem.maxEmitBox = new BABYLON.Vector3(0.5 * scale, 0, 0.5 * scale);
            
            particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
            particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            
            particleSystem.minSize = 0.1 * scale;
            particleSystem.maxSize = 0.3 * scale;
            
            particleSystem.minLifeTime = UI_SETTINGS.PARTICLE_EFFECT.MIN_LIFETIME;
            particleSystem.maxLifeTime = UI_SETTINGS.PARTICLE_EFFECT.MAX_LIFETIME;
            
            particleSystem.emitRate = UI_SETTINGS.PARTICLE_EFFECT.EMIT_RATE;
            
            particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
            particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);
            
            particleSystem.minEmitPower = 1 * scale;
            particleSystem.maxEmitPower = 2 * scale;
            
            particleSystem.updateSpeed = UI_SETTINGS.PARTICLE_EFFECT.UPDATE_SPEED;
            
            // 一時的に表示
            particleSystem.start();
            
            setTimeout(() => {
                particleSystem.stop();
                setTimeout(() => {
                    particleSystem.dispose();
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error("Failed to create placement effect:", error);
        }
    }

    /**
     * エフェクトのスケールを取得
     * @param {string} assetType - アセットタイプ
     * @returns {number} スケール
     */
    getEffectScale(assetType) {
        switch (assetType) {
            case ASSET_TYPES.JUICE_BOX:
                return 3.0;
            case ASSET_TYPES.MIKE_DESK:
                return 4.0;
            case ASSET_TYPES.RECORD_MACHINE:
                return 2.5;
            case ASSET_TYPES.CUBE:
                return 2.0;
            default:
                return 1.0;
        }
    }

    /**
     * 壁の法線を設定
     * @param {BABYLON.Vector3} normal - 法線ベクトル
     */
    setWallNormal(normal) {
        this.lastWallNormal = normal;
    }

    /**
     * アセットを削除
     * @param {BABYLON.Mesh} mesh - 削除するメッシュ
     */
    removeAsset(mesh) {
        const index = this.placedAssets.indexOf(mesh);
        if (index > -1) {
            this.placedAssets.splice(index, 1);
        }
        
        if (mesh && mesh._scene) {
            mesh.dispose();
        }
    }

    /**
     * すべてのアセットをクリア
     */
    clearAllAssets() {
        this.placedAssets.forEach(mesh => {
            if (mesh && mesh._scene) {
                mesh.dispose();
            }
        });
        
        this.placedAssets = [];
        console.log("All placed assets cleared");
    }

    /**
     * 配置されたアセットの数を取得
     * @returns {number} アセット数
     */
    getPlacedAssetCount() {
        return this.placedAssets.length;
    }

    /**
     * 配置されたアセットのリストを取得
     * @returns {Array<BABYLON.Mesh>} アセットリスト
     */
    getPlacedAssets() {
        return [...this.placedAssets];
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing AssetPlacer...");
        
        this.clearAllAssets();
        this.shadowGenerator = null;
        this.lastWallNormal = null;
    }
}