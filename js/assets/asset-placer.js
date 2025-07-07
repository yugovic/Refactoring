// js/assets/AssetPlacer.js
/**
 * アセットの配置を管理するクラス
 */

import { ASSET_TYPES, ASSET_URLS, UI_SETTINGS } from '../config/constants.js';
import { PRESET_COLORS } from '../utils/color-utils.js';
import { CollisionDetector } from '../collision/collision-detector.js';

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
        
        // アップロードアセット用のデフォルトスケール
        this.uploadedAssetScales = new Map();
        
        // 衝突検出システムを初期化
        this.collisionDetector = new CollisionDetector(scene);
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
                case ASSET_TYPES.TROPHY:
                    mesh = this.placeTrophy(position);
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
                
                // 衝突検出システムに登録
                this.collisionDetector.registerAsset(mesh);
                
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
                // 衝突チェック
                if (!this.checkAndPlaceAsset(burger, position, ASSET_TYPES.CUBE)) {
                    burger.dispose();
                    return null;
                }
                
                this.applyWallRotation(burger);
                this.setupMeshInteraction(burger, ASSET_TYPES.CUBE);
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
                // 衝突チェック
                if (!this.checkAndPlaceAsset(record, position, ASSET_TYPES.RECORD_MACHINE)) {
                    record.dispose();
                    return null;
                }
                
                this.applyWallRotation(record);
                this.setupMeshInteraction(record, ASSET_TYPES.RECORD_MACHINE);
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
                // 衝突チェック
                if (!this.checkAndPlaceAsset(juiceBox, position, ASSET_TYPES.JUICE_BOX)) {
                    juiceBox.dispose();
                    return null;
                }
                
                this.applyWallRotation(juiceBox);
                this.setupMeshInteraction(juiceBox, ASSET_TYPES.JUICE_BOX);
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
        
        // メタデータを設定
        mesh.metadata = {
            isAsset: true,
            isPlacedAsset: true,
            canMove: true,
            assetType: ASSET_TYPES.MIKE_DESK,
            placementTime: Date.now()
        };
        
        // 衝突チェック
        if (!this.checkAndPlaceAsset(mesh, position, ASSET_TYPES.MIKE_DESK)) {
            mesh.dispose();
            return null;
        }
        
        this.applyWallRotation(mesh);
        this.setupMeshInteraction(mesh, ASSET_TYPES.MIKE_DESK);
        
        return mesh;
    }

    /**
     * トロフィーを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeTrophy(position) {
        if (this.assetLoader.isModelAvailable('trophy')) {
            const timestamp = Date.now();
            const trophy = this.assetLoader.cloneModel('trophy', `trophy_${timestamp}`);
            
            if (trophy) {
                // 衝突チェック
                if (!this.checkAndPlaceAsset(trophy, position, ASSET_TYPES.TROPHY)) {
                    trophy.dispose();
                    return null;
                }
                
                this.applyWallRotation(trophy);
                this.setupMeshInteraction(trophy, ASSET_TYPES.TROPHY);
                this.createBoundingBox(trophy, timestamp);
                return trophy;
            }
        } else {
            this.loadAndPlaceAsset(ASSET_URLS.TROPHY, `trophy_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * ファシリティアセットを配置
     * @param {string} assetFile - アセットファイル名
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {Promise<BABYLON.Mesh|null>}
     */
    async placeFacilityAsset(assetFile, position) {
        try {
            const assetPath = `assets/Facilities/${assetFile}`;
            const timestamp = Date.now();
            const assetName = assetFile.replace('.glb', '');
            const meshName = `facility_${assetName}_${timestamp}`;
            
            console.log(`ファシリティアセットをロード: ${assetPath}`);
            
            // AssetLoaderを使用してファシリティアセットをロード
            const rootMesh = await this.assetLoader.loadFacilityAsset(assetPath, meshName);
            
            if (!rootMesh) {
                console.error("ファシリティアセットのロードに失敗");
                return null;
            }
            
            // 確実に有効化
            rootMesh.setEnabled(true);
            
            // 子メッシュも確実に有効化
            const childMeshes = rootMesh.getChildMeshes();
            childMeshes.forEach(child => {
                child.setEnabled(true);
            });
            
            // バウンディングボックスを強制的に再計算（ファシリティアセット特有の処理）
            this.assetLoader.recalculateParentBounding(rootMesh);
            
            // 衝突チェックと位置設定
            if (!this.checkAndPlaceAsset(rootMesh, position, 'facility')) {
                rootMesh.dispose();
                return null;
            }
            
            // インタラクション設定
            this.setupMeshInteraction(rootMesh, 'facility');
            
            // バウンディングボックスを作成
            this.createBoundingBox(rootMesh, timestamp);
            
            // 影の設定
            this.setupShadow(rootMesh);
            
            // 配置エフェクトを表示
            this.showPlacementEffect(position, 'facility');
            
            console.log(`ファシリティアセット配置完了: ${meshName}`);
            return rootMesh;
            
        } catch (error) {
            console.error("ファシリティアセット配置エラー:", error);
            this.errorHandler.showError(`アセットの配置に失敗しました: ${error.message}`);
            return null;
        }
    }

    /**
     * 衝突チェックのみを実行（エラーメッセージなし）
     * @param {BABYLON.Mesh} mesh - チェックするメッシュ
     * @param {BABYLON.Vector3} position - チェックする位置
     * @param {BABYLON.Mesh} excludeMesh - 除外するメッシュ（ドラッグ中の自身など）
     * @returns {boolean} 配置可能な場合true
     */
    checkCollisionOnly(mesh, position, excludeMesh = null) {
        const collisionResult = this.collisionDetector.checkPlacement(mesh, position, excludeMesh);
        return collisionResult.canPlace;
    }

    /**
     * 衝突チェックと詳細情報取得
     * @param {BABYLON.Mesh} mesh - チェックするメッシュ
     * @param {BABYLON.Vector3} position - チェックする位置
     * @param {BABYLON.Mesh} excludeMesh - 除外するメッシュ
     * @returns {{canPlace: boolean, collisions: Array}} 衝突結果
     */
    checkCollisionWithDetails(mesh, position, excludeMesh = null) {
        return this.collisionDetector.checkPlacement(mesh, position, excludeMesh);
    }

    /**
     * 衝突チェックとアセット配置
     * @param {BABYLON.Mesh} mesh - 配置するメッシュ
     * @param {BABYLON.Vector3} position - 配置位置
     * @param {string} assetType - アセットタイプ
     * @returns {boolean} 配置成功した場合true
     */
    checkAndPlaceAsset(mesh, position, assetType = null) {
        // 統一されたロジックで衝突チェック（詳細情報付き）
        const collisionResult = this.checkCollisionWithDetails(mesh, position);
        
        if (!collisionResult.canPlace) {
            // 衝突が検出された
            const collisionNames = collisionResult.collisions.map(c => c.name).join(', ');
            this.errorHandler.showError(`配置できません：他のアセット(${collisionNames})と重なります`);
            console.log(`⚠️ 配置キャンセル: ${collisionResult.collisions.length}個のアセットと衝突`);
            return false;
        }
        
        // 配置処理
        this.positionAssetOnFloor(mesh, position);
        
        // 衝突検出システムに登録（placeAssetでも行われるが、直接呼び出し用に重複チェック込みで実行）
        if (!this.placedAssets.includes(mesh)) {
            this.placedAssets.push(mesh);
            this.collisionDetector.registerAsset(mesh);
        }
        
        return true;
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
            
            // 即座にバウンディングボックスを計算
            this.calculateAndSetPosition(mesh, position, childMeshes);
            
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
            
            // 親メッシュのバウンディングボックスを直接使用（最も効率的）
            const boundingInfo = mesh.getBoundingInfo();
            
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
                source: 'parent-mesh',
                minY: minY.toFixed(3),
                maxY: maxY.toFixed(3),
                height: height.toFixed(3),
                meshY: mesh.position.y.toFixed(3),
                targetFloorY: position.y.toFixed(3),
                childMeshCount: childMeshes.length
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
     * @param {string} assetType - アセットタイプ
     */
    setupMeshInteraction(mesh, assetType = null) {
        // メインメッシュの設定
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.renderingGroupId = 0;
        mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
        
        // アクティブメッシュとして常に選択
        mesh.alwaysSelectAsActiveMesh = true;
        
        // バウンディング情報をログ出力
        this.logBoundingInfo(mesh, assetType);
        
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
                    isPartOfAsset: true,  // これを追加
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
            isPlacedAsset: true,  // これを追加
            canMove: true,
            assetName: mesh.name,
            assetType: assetType,
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
                
                // 子メッシュのバウンディング情報もログ出力
                this.logBoundingInfo(child, assetType, index);
            });
        }
    }
    
    /**
     * バウンディング情報をログに出力
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {string} assetType - アセットタイプ
     * @param {number} childIndex - 子メッシュのインデックス（メインメッシュの場合は undefined）
     */
    logBoundingInfo(mesh, assetType = null, childIndex = undefined) {
        try {
            // メッシュのスケール情報
            const scale = mesh.scaling;
            const childPrefix = childIndex !== undefined ? `[子${childIndex}] ` : '';
            
            console.log(`📐 ${childPrefix}バウンディング情報 [${mesh.name}${assetType ? ` - ${assetType}` : ''}]:`);
            console.log(`  スケール: (${scale.x.toFixed(3)}, ${scale.y.toFixed(3)}, ${scale.z.toFixed(3)})`);
            console.log(`  位置: (${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`);
            
            // バウンディング情報を取得
            const boundingInfo = mesh.getBoundingInfo();
            if (boundingInfo) {
                const boundingBox = boundingInfo.boundingBox;
                const boundingSphere = boundingInfo.boundingSphere;
                
                console.log(`  バウンディングボックス:`);
                console.log(`    最小値: (${boundingBox.minimum.x.toFixed(3)}, ${boundingBox.minimum.y.toFixed(3)}, ${boundingBox.minimum.z.toFixed(3)})`);
                console.log(`    最大値: (${boundingBox.maximum.x.toFixed(3)}, ${boundingBox.maximum.y.toFixed(3)}, ${boundingBox.maximum.z.toFixed(3)})`);
                console.log(`    サイズ: (${(boundingBox.maximum.x - boundingBox.minimum.x).toFixed(3)}, ${(boundingBox.maximum.y - boundingBox.minimum.y).toFixed(3)}, ${(boundingBox.maximum.z - boundingBox.minimum.z).toFixed(3)})`);
                
                console.log(`  ワールドバウンディングボックス:`);
                console.log(`    最小値: (${boundingBox.minimumWorld.x.toFixed(3)}, ${boundingBox.minimumWorld.y.toFixed(3)}, ${boundingBox.minimumWorld.z.toFixed(3)})`);
                console.log(`    最大値: (${boundingBox.maximumWorld.x.toFixed(3)}, ${boundingBox.maximumWorld.y.toFixed(3)}, ${boundingBox.maximumWorld.z.toFixed(3)})`);
                console.log(`    サイズ: (${(boundingBox.maximumWorld.x - boundingBox.minimumWorld.x).toFixed(3)}, ${(boundingBox.maximumWorld.y - boundingBox.minimumWorld.y).toFixed(3)}, ${(boundingBox.maximumWorld.z - boundingBox.minimumWorld.z).toFixed(3)})`);
                
                console.log(`  バウンディングスフィア:`);
                console.log(`    中心: (${boundingSphere.center.x.toFixed(3)}, ${boundingSphere.center.y.toFixed(3)}, ${boundingSphere.center.z.toFixed(3)})`);
                console.log(`    半径: ${boundingSphere.radius.toFixed(3)}`);
                console.log(`    ワールド中心: (${boundingSphere.centerWorld.x.toFixed(3)}, ${boundingSphere.centerWorld.y.toFixed(3)}, ${boundingSphere.centerWorld.z.toFixed(3)})`);
                console.log(`    ワールド半径: ${boundingSphere.radiusWorld.toFixed(3)}`);
                
                // ピッキング用の情報
                console.log(`  ピッキング情報:`);
                console.log(`    選択可能: ${mesh.isPickable}`);
                console.log(`    有効: ${mesh.isEnabled()}`);
                console.log(`    可視: ${mesh.visibility}`);
                console.log(`    ジオメトリ有り: ${!!mesh.geometry}`);
                
                // 10%スケールの影響を分析
                if (scale.x === 0.1 || scale.y === 0.1 || scale.z === 0.1) {
                    const actualRadius = boundingSphere.radiusWorld;
                    const expectedRadius = boundingSphere.radius * Math.max(scale.x, scale.y, scale.z);
                    console.log(`  🔍 10%スケール影響分析:`);
                    console.log(`    実際の半径: ${actualRadius.toFixed(3)}`);
                    console.log(`    期待される半径: ${expectedRadius.toFixed(3)}`);
                    console.log(`    差異: ${Math.abs(actualRadius - expectedRadius).toFixed(3)}`);
                    
                    // ピッキング判定に問題がありそうな場合の警告
                    if (actualRadius < 0.05) {
                        console.warn(`    ⚠️ バウンディングスフィアが非常に小さい！ピッキング判定に問題が生じる可能性があります`);
                    }
                }
            } else {
                console.warn(`  ⚠️ バウンディング情報が利用できません`);
            }
            
            // メタデータ情報
            if (mesh.metadata) {
                console.log(`  メタデータ:`, {
                    isAsset: mesh.metadata.isAsset,
                    isPlacedAsset: mesh.metadata.isPlacedAsset,
                    canMove: mesh.metadata.canMove,
                    assetType: mesh.metadata.assetType,
                    isPartOfAsset: mesh.metadata.isPartOfAsset
                });
            }
        } catch (error) {
            console.error(`❌ バウンディング情報の取得に失敗 [${mesh.name}]:`, error);
        }
    }

    /**
     * バウンディングボックスを作成
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {number} timestamp - タイムスタンプ
     */
    createBoundingBox(mesh, timestamp) {
        try {
            console.log(`📦 バウンディングボックス作成開始 [${mesh.name}]`);
            
            // メッシュのバウンディング情報を取得
            let boundingInfo = null;
            let targetMesh = mesh;
            
            // 子メッシュがある場合は、最初の有効な子メッシュを使用
            const childMeshes = mesh.getChildMeshes ? mesh.getChildMeshes() : [];
            if (childMeshes.length > 0) {
                const validChild = childMeshes.find(child => 
                    child.geometry && child.isEnabled() && !child.isDisposed()
                );
                if (validChild) {
                    targetMesh = validChild;
                    console.log(`📦 子メッシュを使用してバウンディングボックス計算: ${validChild.name}`);
                }
            }
            
            // バウンディング情報を更新
            targetMesh.computeWorldMatrix(true);
            targetMesh.refreshBoundingInfo();
            boundingInfo = targetMesh.getBoundingInfo();
            
            if (!boundingInfo || !boundingInfo.boundingBox) {
                console.warn(`⚠️ バウンディング情報が取得できません。デフォルトサイズを使用: ${targetMesh.name}`);
                // デフォルトサイズでバウンディングボックスを作成
                this.createDefaultBoundingBox(mesh, timestamp);
                return;
            }
            
            const boundingBox = boundingInfo.boundingBox;
            const size = {
                width: Math.max(0.1, boundingBox.maximum.x - boundingBox.minimum.x),
                height: Math.max(0.1, boundingBox.maximum.y - boundingBox.minimum.y),
                depth: Math.max(0.1, boundingBox.maximum.z - boundingBox.minimum.z)
            };
            
            console.log(`📦 計算されたサイズ: ${size.width.toFixed(3)} x ${size.height.toFixed(3)} x ${size.depth.toFixed(3)}`);
            
            // バウンディングボックスメッシュを作成
            const visualBoundingBox = BABYLON.MeshBuilder.CreateBox(
                `boundingBox_${timestamp}`, 
                {
                    width: size.width,
                    height: size.height,  
                    depth: size.depth
                }, 
                this.scene
            );
            
            // 車両の場合は特別な処理を適用
            if (mesh.metadata && (mesh.metadata.isVehicle || mesh.metadata.vehicleType)) {
                console.log(`🚗 車両用バウンディングボックス処理`);
                
                // 車両の場合は親メッシュのバウンディング情報を使用
                mesh.computeWorldMatrix(true);
                mesh.refreshBoundingInfo();
                const parentBoundingInfo = mesh.getBoundingInfo();
                
                if (parentBoundingInfo && parentBoundingInfo.boundingBox) {
                    // 親メッシュのバウンディングボックスを使用
                    const parentBoundingBox = parentBoundingInfo.boundingBox;
                    
                    // ワールド座標でのサイズを計算
                    const worldSize = {
                        width: parentBoundingBox.maximumWorld.x - parentBoundingBox.minimumWorld.x,
                        height: parentBoundingBox.maximumWorld.y - parentBoundingBox.minimumWorld.y,
                        depth: parentBoundingBox.maximumWorld.z - parentBoundingBox.minimumWorld.z
                    };
                    
                    // バウンディングボックスを再作成
                    visualBoundingBox.dispose();
                    const newBoundingBox = BABYLON.MeshBuilder.CreateBox(
                        `boundingBox_${mesh.name}_${timestamp}`, 
                        {
                            width: worldSize.width,
                            height: worldSize.height,  
                            depth: worldSize.depth
                        }, 
                        this.scene
                    );
                    visualBoundingBox = newBoundingBox;
                    
                    // バウンディングボックスを親メッシュに設定せず、ワールド座標で配置
                    visualBoundingBox.parent = null;
                    
                    // ワールド座標での中心位置を計算
                    const worldCenter = parentBoundingBox.minimumWorld.add(parentBoundingBox.maximumWorld).scale(0.5);
                    
                    // デバッグ情報
                    console.log(`  🔍 ワールド座標確認:`);
                    console.log(`    minimumWorld: (${parentBoundingBox.minimumWorld.x.toFixed(3)}, ${parentBoundingBox.minimumWorld.y.toFixed(3)}, ${parentBoundingBox.minimumWorld.z.toFixed(3)})`);
                    console.log(`    maximumWorld: (${parentBoundingBox.maximumWorld.x.toFixed(3)}, ${parentBoundingBox.maximumWorld.y.toFixed(3)}, ${parentBoundingBox.maximumWorld.z.toFixed(3)})`);
                    console.log(`    計算された中心: (${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})`);
                    console.log(`    車両の実際の位置: (${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`);
                    
                    // ワールド座標が不正確な場合は、車両の位置を直接使用
                    if (Math.abs(worldCenter.x) < 0.5 && Math.abs(worldCenter.z) < 0.5 && 
                        (Math.abs(mesh.position.x) > 1 || Math.abs(mesh.position.z) > 1)) {
                        console.warn(`  ⚠️ ワールド座標が不正確です。車両の位置を使用します`);
                        visualBoundingBox.position = mesh.position.clone();
                    } else {
                        visualBoundingBox.position = worldCenter;
                    }
                    
                    // スケールは設定しない
                    visualBoundingBox.scaling = new BABYLON.Vector3(1, 1, 1);
                    
                    console.log(`  親メッシュバウンディングボックスサイズ: ${worldSize.width.toFixed(3)} x ${worldSize.height.toFixed(3)} x ${worldSize.depth.toFixed(3)}`);
                    console.log(`  バウンディングボックス位置: (${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})`);
                    console.log(`  車両位置: (${mesh.position.x.toFixed(3)}, ${mesh.position.y.toFixed(3)}, ${mesh.position.z.toFixed(3)})`);
                    
                    // 車両用のメタデータ設定とワイヤーフレームマテリアルを即座に設定
                    visualBoundingBox.visibility = 0.0;
                    visualBoundingBox.isPickable = false;
                    visualBoundingBox.name = `boundingBox_${mesh.name}_${timestamp}`;
                    
                    const wireframeMaterial = new BABYLON.StandardMaterial(`boundingBoxMaterial_${timestamp}`, this.scene);
                    wireframeMaterial.wireframe = true;
                    wireframeMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
                    wireframeMaterial.alpha = 0.8;
                    visualBoundingBox.material = wireframeMaterial;
                    
                    visualBoundingBox.metadata = {
                        isBoundingBox: true,
                        parentAsset: mesh,
                        boundingBoxType: 'vehicle',
                        originalSize: worldSize,
                        timestamp: timestamp
                    };
                    
                    if (!mesh.metadata) {
                        mesh.metadata = {};
                    }
                    mesh.metadata.visualBoundingBox = visualBoundingBox;
                    
                    console.log(`✅ 車両バウンディングボックス作成完了 [${mesh.name}] -> [${visualBoundingBox.name}]`);
                    return;
                } else {
                    console.warn(`⚠️ 車両の親メッシュバウンディング情報が取得できません`);
                }
            } else {
                // 通常のアセットの場合
                const center = boundingBox.center || mesh.position;
                visualBoundingBox.position = center.clone();
                
                // スケールを適用
                if (mesh.scaling) {
                    visualBoundingBox.scaling = mesh.scaling.clone();
                }
                
                // 親を設定
                visualBoundingBox.parent = mesh;
            }
            
            // 表示設定（デフォルトでは非表示、デバッグ時のみ表示）
            visualBoundingBox.visibility = 0.0;
            visualBoundingBox.isPickable = false; // バウンディングボックス自体はピッキング不可
            
            // 車両の場合は特に確実にピッキング不可にする
            if (mesh.metadata && (mesh.metadata.isVehicle || mesh.metadata.vehicleType)) {
                visualBoundingBox.name = `boundingBox_${mesh.name}_${timestamp}`;
                console.log(`  バウンディングボックス名: ${visualBoundingBox.name}`);
            }
            
            // ワイヤーフレームマテリアルを作成
            const wireframeMaterial = new BABYLON.StandardMaterial(`boundingBoxMaterial_${timestamp}`, this.scene);
            wireframeMaterial.wireframe = true;
            wireframeMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0); // 緑色
            wireframeMaterial.alpha = 0.8;
            visualBoundingBox.material = wireframeMaterial;
            
            // メタデータを設定
            visualBoundingBox.metadata = {
                isBoundingBox: true,
                parentAsset: mesh,
                boundingBoxType: 'visual',
                originalSize: size,
                timestamp: timestamp
            };
            
            // メッシュにバウンディングボックスの参照を保存
            if (!mesh.metadata) {
                mesh.metadata = {};
            }
            mesh.metadata.visualBoundingBox = visualBoundingBox;
            
            console.log(`✅ バウンディングボックス作成完了 [${mesh.name}] -> [${visualBoundingBox.name}]`);
            
            // デバッグ用にバウンディングボックス表示関数を追加
            this.toggleBoundingBoxVisibility = (visible) => {
                const boundingBoxes = this.scene.meshes.filter(m => 
                    m.metadata && m.metadata.isBoundingBox
                );
                boundingBoxes.forEach(box => {
                    box.visibility = visible ? 0.5 : 0.0;
                    // 車両のバウンディングボックスは赤色で表示
                    if (box.metadata && box.metadata.boundingBoxType === 'vehicle' && box.material) {
                        box.material.emissiveColor = new BABYLON.Color3(1, 0, 0); // 赤色
                    }
                });
                console.log(`バウンディングボックス表示: ${visible ? 'ON' : 'OFF'} (${boundingBoxes.length}個)`);
                return boundingBoxes.length;
            };
            
        } catch (error) {
            console.error(`❌ バウンディングボックス作成エラー [${mesh.name}]:`, error);
            this.createDefaultBoundingBox(mesh, timestamp);
        }
    }
    
    /**
     * デフォルトバウンディングボックスを作成
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {number} timestamp - タイムスタンプ
     */
    createDefaultBoundingBox(mesh, timestamp) {
        console.log(`📦 デフォルトバウンディングボックス作成 [${mesh.name}]`);
        
        const defaultBoundingBox = BABYLON.MeshBuilder.CreateBox(
            `defaultBoundingBox_${timestamp}`, 
            {
                width: 0.5,
                height: 0.5,
                depth: 0.5
            }, 
            this.scene
        );
        
        defaultBoundingBox.position = mesh.position.clone();
        defaultBoundingBox.parent = mesh;
        defaultBoundingBox.visibility = 0.0;
        defaultBoundingBox.isPickable = false;
        
        // ワイヤーフレームマテリアル
        const wireframeMaterial = new BABYLON.StandardMaterial(`defaultBoundingBoxMaterial_${timestamp}`, this.scene);
        wireframeMaterial.wireframe = true;
        wireframeMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); // 赤色（デフォルト）
        wireframeMaterial.alpha = 0.8;
        defaultBoundingBox.material = wireframeMaterial;
        
        // メタデータを設定
        defaultBoundingBox.metadata = {
            isBoundingBox: true,
            parentAsset: mesh,
            boundingBoxType: 'default',
            timestamp: timestamp
        };
        
        if (!mesh.metadata) {
            mesh.metadata = {};
        }
        mesh.metadata.visualBoundingBox = defaultBoundingBox;
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
        if (!mesh) return;
        
        console.log(`🗑️ アセットを削除: ${mesh.name}`);
        
        const index = this.placedAssets.indexOf(mesh);
        if (index > -1) {
            this.placedAssets.splice(index, 1);
        }
        
        // 衝突検出システムからも削除
        this.collisionDetector.unregisterAsset(mesh);
        
        // バウンディングボックスを削除
        if (mesh.metadata && mesh.metadata.visualBoundingBox) {
            console.log(`  📦 バウンディングボックスも削除`);
            mesh.metadata.visualBoundingBox.dispose();
            mesh.metadata.visualBoundingBox = null;
        }
        
        // 子メッシュも含めて削除
        if (mesh.getChildMeshes) {
            const children = mesh.getChildMeshes();
            console.log(`  👶 ${children.length}個の子メッシュも削除`);
            children.forEach(child => {
                child.dispose();
            });
        }
        
        if (mesh && mesh._scene) {
            mesh.dispose();
        }
    }

    /**
     * すべてのアセットをクリア
     */
    clearAllAssets() {
        console.log(`🧹 すべてのアセットをクリア (${this.placedAssets.length}個)`);
        
        // 各アセットを適切に削除
        const assetsToRemove = [...this.placedAssets];
        assetsToRemove.forEach(mesh => {
            this.removeAsset(mesh);
        });
        
        // 念のため配列をクリア
        this.placedAssets = [];
        
        // 衝突検出システムもクリア
        this.collisionDetector.clear();
        
        // バウンディングボックスの残骸をクリーンアップ
        const orphanedBoundingBoxes = this.scene.meshes.filter(m => 
            m.metadata && m.metadata.isBoundingBox
        );
        orphanedBoundingBoxes.forEach(box => {
            console.log(`  🗑️ 残存バウンディングボックスを削除: ${box.name}`);
            box.dispose();
        });
        
        console.log("✅ All placed assets cleared");
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
     * アセットタイプのデフォルトスケールを設定
     * @param {string} assetType - アセットタイプ
     * @param {number} scale - スケール値
     */
    setDefaultScale(assetType, scale) {
        this.defaultScales[assetType] = scale;
        console.log(`デフォルトスケール設定: ${assetType} -> ${scale}`);
    }

    /**
     * アセットタイプのデフォルトスケールを取得
     * @param {string} assetType - アセットタイプ
     * @returns {number} スケール値
     */
    getDefaultScale(assetType) {
        return this.defaultScales[assetType] || 1.0;
    }

    /**
     * 特定のアセットタイプの配置済みメッシュのスケールを更新
     * @param {string} assetType - アセットタイプ
     * @param {number} newScale - 新しいスケール値
     */
    updateAssetTypeScale(assetType, newScale) {
        this.setDefaultScale(assetType, newScale);
        
        // 配置済みのアセットのスケールを更新
        this.placedAssets.forEach(mesh => {
            if (mesh.metadata && mesh.metadata.assetType === assetType) {
                mesh.scaling = new BABYLON.Vector3(newScale, newScale, newScale);
                console.log(`メッシュスケール更新: ${mesh.name} -> ${Math.round(newScale * 100)}%`);
            }
        });
    }

    /**
     * 特定のメッシュのスケールを更新
     * @param {BABYLON.Mesh} mesh - 対象メッシュ
     * @param {number} newScale - 新しいスケール値
     */
    updateMeshScale(mesh, newScale) {
        if (mesh && mesh.scaling) {
            mesh.scaling = new BABYLON.Vector3(newScale, newScale, newScale);
            console.log(`個別メッシュスケール更新: ${mesh.name} -> ${Math.round(newScale * 100)}%`);
            
            // アップロードアセットの場合は元アセットのスケールも更新
            if (mesh.metadata && mesh.metadata.isUploadedAsset && mesh.metadata.originalAssetId) {
                this.setUploadedAssetScale(mesh.metadata.originalAssetId, newScale);
            }
        }
    }
    
    /**
     * アップロードアセットのデフォルトスケールを設定
     * @param {string} assetId - アセットID
     * @param {number} scale - スケール値
     */
    setUploadedAssetScale(assetId, scale) {
        this.uploadedAssetScales.set(assetId, scale);
        console.log(`アップロードアセットスケール設定: ${assetId} -> ${Math.round(scale * 100)}%`);
    }
    
    /**
     * アップロードアセットのデフォルトスケールを取得
     * @param {string} assetId - アセットID
     * @returns {number} スケール値
     */
    getUploadedAssetScale(assetId) {
        return this.uploadedAssetScales.get(assetId) || 1.0;
    }
    
    /**
     * 特定のアップロードアセットの配置済みメッシュのスケールを更新
     * @param {string} assetId - アセットID
     * @param {number} newScale - 新しいスケール値
     */
    updateUploadedAssetTypeScale(assetId, newScale) {
        this.setUploadedAssetScale(assetId, newScale);
        
        // 配置済みのアセットのスケールを更新
        this.placedAssets.forEach(mesh => {
            if (mesh.metadata && mesh.metadata.isUploadedAsset && mesh.metadata.originalAssetId === assetId) {
                mesh.scaling = new BABYLON.Vector3(newScale, newScale, newScale);
                console.log(`アップロードメッシュスケール更新: ${mesh.name} -> ${Math.round(newScale * 100)}%`);
            }
        });
    }

    /**
     * スケール設定をローカルストレージに保存
     */
    saveScaleSettings() {
        try {
            const scaleData = {
                defaultScales: this.defaultScales,
                uploadedAssetScales: Object.fromEntries(this.uploadedAssetScales),
                timestamp: Date.now()
            };
            
            localStorage.setItem('assetScaleSettings', JSON.stringify(scaleData));
            console.log('スケール設定を保存しました:', scaleData);
        } catch (error) {
            console.error('スケール設定の保存に失敗:', error);
        }
    }
    
    /**
     * ローカルストレージからスケール設定を復元
     */
    loadScaleSettings() {
        try {
            const savedData = localStorage.getItem('assetScaleSettings');
            if (!savedData) {
                console.log('保存されたスケール設定がありません');
                return;
            }
            
            const scaleData = JSON.parse(savedData);
            
            // デフォルトスケールを復元
            if (scaleData.defaultScales) {
                Object.keys(scaleData.defaultScales).forEach(assetType => {
                    if (this.defaultScales.hasOwnProperty(assetType)) {
                        this.defaultScales[assetType] = scaleData.defaultScales[assetType];
                    }
                });
            }
            
            // アップロードアセットスケールを復元
            if (scaleData.uploadedAssetScales) {
                this.uploadedAssetScales = new Map(Object.entries(scaleData.uploadedAssetScales));
            }
            
            console.log('スケール設定を復元しました:', {
                defaultScales: this.defaultScales,
                uploadedAssetScales: Object.fromEntries(this.uploadedAssetScales)
            });
            
            // UIに反映
            this.updateUIWithLoadedScales();
            
        } catch (error) {
            console.error('スケール設定の復元に失敗:', error);
        }
    }
    
    /**
     * 復元したスケール設定をUIに反映
     */
    updateUIWithLoadedScales() {
        // UIManagerに通知してスライダーの値を更新
        const uiManager = this.app?.getManager?.('ui');
        if (uiManager && uiManager.updateScaleSliders) {
            uiManager.updateScaleSliders(this.defaultScales);
        }
    }
    
    /**
     * スケール設定をリセット
     */
    resetScaleSettings() {
        this.defaultScales = {
            [ASSET_TYPES.CUBE]: 1.0,
            [ASSET_TYPES.RECORD_MACHINE]: 1.0,
            [ASSET_TYPES.JUICE_BOX]: 1.0,
            [ASSET_TYPES.MIKE_DESK]: 1.0
        };
        this.uploadedAssetScales.clear();
        
        // ローカルストレージからも削除
        localStorage.removeItem('assetScaleSettings');
        
        console.log('スケール設定をリセットしました');
    }

    /**
     * バウンディングボックスの表示を切り替え
     * @param {boolean} visible - 表示するかどうか
     */
    toggleBoundingBoxVisibility(visible) {
        const boundingBoxes = this.scene.meshes.filter(m => 
            m.metadata && m.metadata.isBoundingBox
        );
        boundingBoxes.forEach(box => {
            box.visibility = visible ? 0.5 : 0.0;
        });
        console.log(`📦 バウンディングボックス表示: ${visible ? 'ON' : 'OFF'} (${boundingBoxes.length}個)`);
        return boundingBoxes.length;
    }
    
    /**
     * 全アセットのバウンディング情報を一括表示
     */
    logAllBoundingInfo() {
        console.log("=== 📊 全アセットバウンディング情報一括表示 ===");
        
        this.placedAssets.forEach((mesh, index) => {
            console.log(`\n--- アセット ${index + 1}/${this.placedAssets.length} ---`);
            this.logBoundingInfo(mesh, mesh.metadata?.assetType || 'unknown');
        });
        
        // バウンディングボックスの統計
        const boundingBoxes = this.scene.meshes.filter(m => 
            m.metadata && m.metadata.isBoundingBox
        );
        console.log(`\n📊 バウンディングボックス統計: ${boundingBoxes.length}個作成済み`);
        
        const visibleBoxes = boundingBoxes.filter(box => box.visibility > 0);
        console.log(`📊 表示中のバウンディングボックス: ${visibleBoxes.length}個`);
    }
    
    /**
     * 衝突検出システムのデバッグモードを切り替え
     * @param {boolean} enabled - 有効/無効
     */
    toggleCollisionDebugMode(enabled) {
        this.collisionDetector.setDebugMode(enabled);
        console.log(`衝突検出デバッグモード: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * 衝突検出マージンを設定
     * @param {number} margin - マージン（メートル単位）
     */
    setCollisionMargin(margin) {
        this.collisionDetector.setCollisionMargin(margin);
    }

    /**
     * ピッキング問題の診断
     */
    diagnoseBoundingIssues() {
        console.log("=== 🔍 バウンディングスフィア・ピッキング問題診断 ===");
        
        const issues = [];
        
        this.placedAssets.forEach((mesh, index) => {
            const boundingInfo = mesh.getBoundingInfo();
            if (boundingInfo) {
                const sphere = boundingInfo.boundingSphere;
                const scale = mesh.scaling;
                
                // 問題1: バウンディングスフィアが極小
                if (sphere.radiusWorld < 0.05) {
                    issues.push({
                        mesh: mesh.name,
                        issue: 'バウンディングスフィアが極小',
                        radius: sphere.radiusWorld,
                        scale: scale.x
                    });
                }
                
                // 問題2: 10%スケールでの問題
                if (scale.x === 0.1 && sphere.radiusWorld < 0.1) {
                    issues.push({
                        mesh: mesh.name,
                        issue: '10%スケールでピッキング困難',
                        radius: sphere.radiusWorld,
                        scale: scale.x
                    });
                }
                
                // 問題3: ピッキング無効
                if (!mesh.isPickable) {
                    issues.push({
                        mesh: mesh.name,
                        issue: 'メッシュがピッキング無効',
                        pickable: mesh.isPickable,
                        enabled: mesh.isEnabled()
                    });
                }
            }
        });
        
        if (issues.length === 0) {
            console.log("✅ バウンディング関連の問題は検出されませんでした");
        } else {
            console.log(`⚠️ ${issues.length}個の問題を検出:`);
            issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. [${issue.mesh}] ${issue.issue}:`, issue);
            });
        }
        
        return issues;
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        console.log("🧹 AssetPlacer: クリーンアップを開始");
        
        // スケール設定を保存
        this.saveScaleSettings();
        
        // すべてのアセットをクリア
        this.clearAllAssets();
        
        // 参照をクリア
        this.shadowGenerator = null;
        this.lastWallNormal = null;
        this.uploadedAssetScales.clear();
        
        // 衝突検出システムをクリーンアップ
        if (this.collisionDetector && this.collisionDetector.dispose) {
            this.collisionDetector.dispose();
        }
        
        console.log("✅ AssetPlacer: クリーンアップ完了");
    }
}