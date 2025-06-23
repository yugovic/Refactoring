// js/assets/AssetLoader.js
/**
 * アセットのロードとキャッシュを管理するクラス
 */

import { ASSET_URLS, MODEL_SCALES } from '../config/constants.js';

export class AssetLoader {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // プリロードしたモデルを保持
        this.preloadedModels = {
            burger: null,
            recordMachine: null,
            juiceBox: null,
            trophy: null
        };
        
        // ロード状態
        this.loadingStatus = {
            burger: false,
            recordMachine: false,
            juiceBox: false,
            trophy: false
        };
        
        // ロード完了コールバック
        this.onLoadCallbacks = [];
        
        // ファシリティアセットのキャッシュ
        this.facilityAssetCache = new Map();
    }

    /**
     * すべてのアセットを事前ロード
     * @returns {Promise<void>}
     */
    async preloadAssets() {
        console.log("Starting asset preload...");
        
        try {
            // 並列でロード
            await Promise.all([
                this.loadBurgerModel(),
                this.loadRecordModel(),
                this.loadJuiceBoxModel(),
                this.loadTrophyModel()
            ]);
            
            console.log("All assets preloaded successfully");
            
            // ロード完了コールバックを実行
            this.onLoadCallbacks.forEach(callback => callback());
            
        } catch (error) {
            this.errorHandler.showError("アセットのプリロードに失敗しました: " + error.message);
            console.error("Asset preload error:", error);
        }
    }

    /**
     * バーガーモデルをロード
     * @returns {Promise<void>}
     */
    async loadBurgerModel() {
        if (this.loadingStatus.burger || this.preloadedModels.burger) return;
        
        this.loadingStatus.burger = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.BURGER, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Burger model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.BURGER);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.burger = rootMesh;
                        
                        // バウンディング情報をログ出力
                        this.logAssetBoundingInfo(rootMesh, 'burger');
                    }
                    
                    this.loadingStatus.burger = false;
                    resolve();
                },
                null,
                (_, message) => {
                    this.loadingStatus.burger = false;
                    reject(new Error("Failed to load burger model: " + message));
                }
            );
        });
    }

    /**
     * レコードマシンモデルをロード
     * @returns {Promise<void>}
     */
    async loadRecordModel() {
        if (this.loadingStatus.recordMachine || this.preloadedModels.recordMachine) return;
        
        this.loadingStatus.recordMachine = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.RECORD_MACHINE, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Record machine model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.RECORD_MACHINE);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.recordMachine = rootMesh;
                        
                        // バウンディング情報をログ出力
                        this.logAssetBoundingInfo(rootMesh, 'recordMachine');
                    }
                    
                    this.loadingStatus.recordMachine = false;
                    resolve();
                },
                null,
                (_, message) => {
                    this.loadingStatus.recordMachine = false;
                    reject(new Error("Failed to load record model: " + message));
                }
            );
        });
    }

    /**
     * ジュースボックスモデルをロード
     * @returns {Promise<void>}
     */
    async loadJuiceBoxModel() {
        if (this.loadingStatus.juiceBox || this.preloadedModels.juiceBox) return;
        
        this.loadingStatus.juiceBox = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.JUICE_BOX, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Juice box model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.JUICE_BOX);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.juiceBox = rootMesh;
                        
                        // バウンディング情報をログ出力
                        this.logAssetBoundingInfo(rootMesh, 'juiceBox');
                    }
                    
                    this.loadingStatus.juiceBox = false;
                    resolve();
                },
                null,
                (_, message) => {
                    this.loadingStatus.juiceBox = false;
                    reject(new Error("Failed to load juice box model: " + message));
                }
            );
        });
    }

    /**
     * トロフィーモデルをロード
     * @returns {Promise<void>}
     */
    async loadTrophyModel() {
        if (this.loadingStatus.trophy || this.preloadedModels.trophy) return;
        
        this.loadingStatus.trophy = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.TROPHY, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Trophy model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.TROPHY);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.trophy = rootMesh;
                        
                        // バウンディング情報をログ出力
                        this.logAssetBoundingInfo(rootMesh, 'trophy');
                    }
                    
                    this.loadingStatus.trophy = false;
                    resolve();
                },
                null,
                (_, message) => {
                    this.loadingStatus.trophy = false;
                    reject(new Error("Failed to load trophy model: " + message));
                }
            );
        });
    }

    /**
     * メッシュを準備
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {Object} scale - スケール設定
     * @returns {BABYLON.Mesh} 準備されたメッシュ
     */
    prepareMesh(mesh, scale) {
        // 非表示にしておく
        mesh.setEnabled(false);
        
        // スケーリングを設定
        mesh.scaling = new BABYLON.Vector3(scale.x, scale.y, scale.z);
        
        // 親メッシュのバウンディングを子メッシュから再計算
        this.recalculateParentBounding(mesh);
        
        return mesh;
    }

    /**
     * メッシュのプロパティを設定
     * @param {BABYLON.Mesh} rootMesh - ルートメッシュ
     */
    setupMeshProperties(rootMesh) {
        // レンダリング設定を調整
        rootMesh.renderingGroupId = 0;
        rootMesh.alwaysSelectAsActiveMesh = true;
        rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
        
        // 子メッシュもすべて設定
        rootMesh.getChildMeshes().forEach(childMesh => {
            childMesh.renderingGroupId = 0;
            childMesh.alwaysSelectAsActiveMesh = true;
            childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
            
            if (childMesh.material) {
                childMesh.material.backFaceCulling = false;
                childMesh.material.needDepthPrePass = true;
            }
        });
    }

    /**
     * モデルをクローン
     * @param {string} modelType - モデルタイプ ('burger', 'record', 'juiceBox')
     * @param {string} name - 新しい名前
     * @returns {BABYLON.Mesh|null} クローンされたメッシュ
     */
    cloneModel(modelType, name) {
        const originalModel = this.preloadedModels[modelType];
        
        if (!originalModel) {
            console.error(`Model ${modelType} not preloaded`);
            return null;
        }
        
        try {
            // クローン前にオリジナルモデルが正しく存在するか確認
            if (!originalModel._scene) {
                console.error(`Original model ${modelType} is not in scene`);
                return null;
            }
            
            // clone()メソッドは子メッシュも自動的にクローンする
            const clonedModel = originalModel.clone(name);
            
            if (!clonedModel) {
                console.error(`Failed to clone model ${modelType}`);
                return null;
            }
            
            // クローンを有効化
            clonedModel.setEnabled(true);
            
            // クローンされた子メッシュも有効化し、ユニークな名前を付与
            const childMeshes = clonedModel.getChildMeshes();
            childMeshes.forEach((childMesh, index) => {
                childMesh.setEnabled(true);
                
                // 子メッシュにもユニークな名前を付与（重複防止）
                const originalChildName = childMesh.name;
                childMesh.name = `${name}_child${index}_${originalChildName}`;
                
                console.log(`  子メッシュ名変更: ${originalChildName} → ${childMesh.name}`);
            });
            
            // クローンされたモデルのバウンディングを再計算
            this.recalculateParentBounding(clonedModel);
            
            // バウンディング情報をログ出力
            this.logAssetBoundingInfo(clonedModel, modelType);
            
            console.log(`Successfully cloned ${modelType} as ${name} with ${childMeshes.length} child meshes`);
            
            return clonedModel;
            
        } catch (error) {
            console.error(`Error cloning model ${modelType}:`, error);
            return null;
        }
    }

    /**
     * 動的にアセットをロード
     * @param {string} url - アセットURL
     * @param {string} name - メッシュ名
     * @returns {Promise<BABYLON.Mesh>}
     */
    async loadAsset(url, name) {
        return new Promise((resolve, reject) => {
            // プレースホルダーを作成
            const placeholder = this.createPlaceholder(name);
            
            BABYLON.SceneLoader.ImportMesh(
                "", 
                url, 
                "", 
                this.scene,
                (meshes) => {
                    // プレースホルダーを削除
                    placeholder.dispose();
                    
                    if (meshes.length > 0) {
                        const rootMesh = meshes[0];
                        rootMesh.name = name;
                        
                        // デフォルトスケールを適用
                        this.applyDefaultScale(rootMesh, name);
                        
                        // メッシュプロパティを設定
                        this.setupDynamicMeshProperties(rootMesh);
                        
                        resolve(rootMesh);
                    } else {
                        reject(new Error("No meshes loaded"));
                    }
                },
                null,
                (_, message) => {
                    placeholder.dispose();
                    reject(new Error("Failed to load asset: " + message));
                }
            );
        });
    }

    /**
     * プレースホルダーを作成
     * @param {string} name - メッシュ名
     * @returns {BABYLON.Mesh} プレースホルダー
     */
    createPlaceholder(name) {
        const placeholder = BABYLON.MeshBuilder.CreateBox(
            `placeholder_${name}`, 
            { size: 0.1 }, 
            this.scene
        );
        
        const material = new BABYLON.StandardMaterial(`placeholderMat_${name}`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.alpha = 0.5;
        placeholder.material = material;
        placeholder.isPickable = false;
        placeholder.visibility = 0.3;
        
        return placeholder;
    }

    /**
     * デフォルトスケールを適用
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {string} name - メッシュ名
     */
    applyDefaultScale(mesh, name) {
        if (name.includes("burger")) {
            mesh.scaling = new BABYLON.Vector3(
                MODEL_SCALES.BURGER.x, 
                MODEL_SCALES.BURGER.y, 
                MODEL_SCALES.BURGER.z
            );
        } else if (name.includes("record")) {
            mesh.scaling = new BABYLON.Vector3(
                MODEL_SCALES.RECORD_MACHINE.x, 
                MODEL_SCALES.RECORD_MACHINE.y, 
                MODEL_SCALES.RECORD_MACHINE.z
            );
        } else if (name.includes("juiceBox")) {
            mesh.scaling = new BABYLON.Vector3(
                MODEL_SCALES.JUICE_BOX.x, 
                MODEL_SCALES.JUICE_BOX.y, 
                MODEL_SCALES.JUICE_BOX.z
            );
        } else if (name.includes("trophy")) {
            mesh.scaling = new BABYLON.Vector3(
                MODEL_SCALES.TROPHY.x, 
                MODEL_SCALES.TROPHY.y, 
                MODEL_SCALES.TROPHY.z
            );
        }
    }

    /**
     * 動的にロードしたメッシュのプロパティを設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupDynamicMeshProperties(mesh) {
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.renderingGroupId = 0;
        
        mesh.getChildMeshes().forEach(childMesh => {
            childMesh.renderingGroupId = 0;
            childMesh.receiveShadows = true;
            childMesh.isPickable = true;
            childMesh.alwaysSelectAsActiveMesh = true;
            childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
            
            if (childMesh.material) {
                childMesh.material.backFaceCulling = false;
                childMesh.material.needDepthPrePass = true;
                childMesh.material.zOffset = 1;
                childMesh.material.forceDepthWrite = true;
            }
        });
        
        // 動的にロードしたメッシュのバウンディングも再計算
        this.recalculateParentBounding(mesh);
    }

    /**
     * モデルが利用可能かチェック
     * @param {string} modelType - モデルタイプ
     * @returns {boolean}
     */
    isModelAvailable(modelType) {
        return this.preloadedModels[modelType] !== null;
    }

    /**
     * すべてのモデルがロード済みかチェック
     * @returns {boolean}
     */
    areAllModelsLoaded() {
        return Object.values(this.preloadedModels).every(model => model !== null);
    }

    /**
     * デフォルトスケールを取得
     * @param {string} assetType - アセットタイプ
     * @returns {Object} スケール値
     */
    getDefaultScale(assetType) {
        switch(assetType) {
            case 'burger':
                return MODEL_SCALES.BURGER;
            case 'recordMachine':
                return MODEL_SCALES.RECORD_MACHINE;
            case 'juiceBox':
                return MODEL_SCALES.JUICE_BOX;
            case 'trophy':
                return MODEL_SCALES.TROPHY;
            case 'facility':
                return MODEL_SCALES.DEFAULT;
            default:
                return MODEL_SCALES.DEFAULT;
        }
    }

    /**
     * ファシリティアセットをロード
     * @param {string} filePath - ファイルパス
     * @param {string} name - メッシュ名
     * @returns {Promise<BABYLON.Mesh>}
     */
    async loadFacilityAsset(filePath, name) {
        // キャッシュをチェック
        if (this.facilityAssetCache.has(filePath)) {
            console.log(`Using cached facility asset: ${filePath}`);
            const cachedMesh = this.facilityAssetCache.get(filePath);
            
            // キャッシュされたメッシュの状態を確認
            console.log(`Cached mesh status:`, {
                exists: !!cachedMesh,
                isDisposed: cachedMesh ? cachedMesh.isDisposed() : 'N/A',
                inScene: cachedMesh ? !!cachedMesh._scene : 'N/A',
                name: cachedMesh ? cachedMesh.name : 'N/A',
                childCount: cachedMesh && cachedMesh.getChildMeshes ? cachedMesh.getChildMeshes().length : 'N/A'
            });
            
            // キャッシュされたメッシュが無効な場合は、キャッシュから削除して再ロード
            if (!cachedMesh || cachedMesh.isDisposed() || !cachedMesh._scene) {
                console.warn(`Cached mesh is invalid, removing from cache and reloading`);
                this.facilityAssetCache.delete(filePath);
                // 再帰的に再ロード
                return this.loadFacilityAsset(filePath, name);
            }
            
            // キャッシュされたメッシュをクローンして返す
            return this.cloneFacilityAsset(cachedMesh, name);
        }
        
        return new Promise((resolve, reject) => {
            console.log(`Loading facility asset: ${filePath}`);
            
            BABYLON.SceneLoader.ImportMesh(
                "", 
                filePath, 
                "", 
                this.scene,
                (meshes) => {
                    console.log(`Facility asset loaded: ${meshes.length} meshes`);
                    
                    if (meshes.length > 0) {
                        const rootMesh = meshes[0];
                        rootMesh.name = name;
                        
                        // スケールを設定
                        rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                        
                        // メッシュプロパティを設定
                        this.setupMeshProperties(rootMesh);
                        
                        // バウンディングを再計算
                        this.recalculateParentBounding(rootMesh);
                        
                        // バウンディング情報をログ出力
                        this.logAssetBoundingInfo(rootMesh, 'facility');
                        
                        // オリジナルメッシュをキャッシュ用に準備
                        rootMesh.setEnabled(false);
                        
                        // オリジナルメッシュを保護（破棄されないように）
                        rootMesh.doNotDispose = true;
                        
                        // 子メッシュも保護
                        const childMeshes = rootMesh.getChildMeshes();
                        childMeshes.forEach(child => {
                            child.doNotDispose = true;
                        });
                        
                        // キャッシュに保存
                        this.facilityAssetCache.set(filePath, rootMesh);
                        
                        // クローンを作成して返す
                        const clonedMesh = this.cloneFacilityAsset(rootMesh, name);
                        resolve(clonedMesh);
                    } else {
                        reject(new Error("No meshes loaded"));
                    }
                },
                null,
                (_, message) => {
                    reject(new Error("Failed to load facility asset: " + message));
                }
            );
        });
    }

    /**
     * ファシリティアセットをクローン
     * @param {BABYLON.Mesh} originalMesh - オリジナルメッシュ
     * @param {string} name - 新しい名前
     * @returns {BABYLON.Mesh|null}
     */
    cloneFacilityAsset(originalMesh, name) {
        try {
            // オリジナルメッシュが存在し、破棄されていないことを確認
            if (!originalMesh) {
                console.error('Original facility mesh is null');
                return null;
            }
            
            if (originalMesh.isDisposed()) {
                console.error(`Original facility mesh is disposed: ${originalMesh.name}`);
                return null;
            }
            
            // シーンに属していることを確認
            if (!originalMesh._scene) {
                console.error(`Original facility mesh is not in scene: ${originalMesh.name}`);
                return null;
            }
            
            // 深いクローンを作成（子メッシュも含む）
            const clonedMesh = originalMesh.clone(name, null, false, true);
            
            if (!clonedMesh) {
                console.error('Failed to clone facility asset');
                return null;
            }
            
            // クローンを有効化
            clonedMesh.setEnabled(true);
            
            // 子メッシュも有効化し、ユニークな名前を付与
            const childMeshes = clonedMesh.getChildMeshes();
            childMeshes.forEach((childMesh, index) => {
                childMesh.setEnabled(true);
                // 重複を避けるためタイムスタンプを追加
                const timestamp = Date.now();
                childMesh.name = `${name}_child${index}_${timestamp}`;
            });
            
            // メッシュプロパティを再設定
            this.setupMeshProperties(clonedMesh);
            
            // バウンディングを再計算
            this.recalculateParentBounding(clonedMesh);
            
            // バウンディング情報をログ出力
            this.logAssetBoundingInfo(clonedMesh, 'facility');
            
            console.log(`Successfully cloned facility asset as ${name} with ${childMeshes.length} child meshes`);
            
            return clonedMesh;
            
        } catch (error) {
            console.error('Error cloning facility asset:', error);
            return null;
        }
    }

    /**
     * ロード完了時のコールバックを追加
     * @param {Function} callback - コールバック関数
     */
    onAssetsLoaded(callback) {
        if (this.areAllModelsLoaded()) {
            callback();
        } else {
            this.onLoadCallbacks.push(callback);
        }
    }

    /**
     * ロード状態を取得
     * @returns {Object} ロード状態
     */
    getLoadingStatus() {
        return {
            burger: this.isModelAvailable('burger'),
            record: this.isModelAvailable('recordMachine'),
            juiceBox: this.isModelAvailable('juiceBox'),
            trophy: this.isModelAvailable('trophy'),
            isLoading: Object.values(this.loadingStatus).some(status => status)
        };
    }

    /**
     * 親メッシュのバウンディングを子メッシュから再計算
     * @param {BABYLON.AbstractMesh} parentMesh - 親メッシュ
     */
    recalculateParentBounding(parentMesh) {
        try {
            // 子メッシュを取得
            const childMeshes = parentMesh.getChildMeshes ? parentMesh.getChildMeshes() : [];
            
            if (childMeshes.length === 0) {
                console.log(`アセット ${parentMesh.name} に子メッシュがありません`);
                return;
            }

            console.log(`🔄 アセット ${parentMesh.name} のバウンディングを再計算中... (子メッシュ: ${childMeshes.length}個)`);

            // 子メッシュの中でジオメトリを持つものを探す
            const meshesWithGeometry = childMeshes.filter(child => 
                child.geometry && child.getVerticesData && child.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            );

            if (meshesWithGeometry.length === 0) {
                console.log(`アセット ${parentMesh.name} の子メッシュにジオメトリが見つかりません`);
                return;
            }

            // 各子メッシュのワールド座標でのバウンディングボックスを計算
            let globalMin = null;
            let globalMax = null;

            meshesWithGeometry.forEach((child, index) => {
                // 子メッシュのバウンディング情報を更新
                child.refreshBoundingInfo();
                const childBounding = child.getBoundingInfo();
                
                if (childBounding) {
                    const worldMin = childBounding.boundingBox.minimumWorld;
                    const worldMax = childBounding.boundingBox.maximumWorld;
                    
                    if (globalMin === null) {
                        globalMin = worldMin.clone();
                        globalMax = worldMax.clone();
                    } else {
                        // 最小値と最大値を更新
                        globalMin.x = Math.min(globalMin.x, worldMin.x);
                        globalMin.y = Math.min(globalMin.y, worldMin.y);
                        globalMin.z = Math.min(globalMin.z, worldMin.z);
                        
                        globalMax.x = Math.max(globalMax.x, worldMax.x);
                        globalMax.y = Math.max(globalMax.y, worldMax.y);
                        globalMax.z = Math.max(globalMax.z, worldMax.z);
                    }
                    
                    console.log(`  子メッシュ[${index}] ${child.name}: 
                        ワールド範囲 (${worldMin.x.toFixed(3)}, ${worldMin.y.toFixed(3)}, ${worldMin.z.toFixed(3)}) - 
                        (${worldMax.x.toFixed(3)}, ${worldMax.y.toFixed(3)}, ${worldMax.z.toFixed(3)})`);
                }
            });

            if (globalMin && globalMax) {
                // 親メッシュの位置を基準にローカル座標に変換
                const parentPosition = parentMesh.position;
                const parentRotation = parentMesh.rotation;
                const parentScaling = parentMesh.scaling;

                // ワールド座標からローカル座標への変換
                const localMin = globalMin.subtract(parentPosition);
                const localMax = globalMax.subtract(parentPosition);

                // スケーリングを考慮
                if (parentScaling.x !== 0) {
                    localMin.x /= parentScaling.x;
                    localMax.x /= parentScaling.x;
                }
                if (parentScaling.y !== 0) {
                    localMin.y /= parentScaling.y;
                    localMax.y /= parentScaling.y;
                }
                if (parentScaling.z !== 0) {
                    localMin.z /= parentScaling.z;
                    localMax.z /= parentScaling.z;
                }

                // 親メッシュのバウンディング情報を新しく設定
                const boundingMin = new BABYLON.Vector3(
                    Math.min(localMin.x, localMax.x),
                    Math.min(localMin.y, localMax.y),
                    Math.min(localMin.z, localMax.z)
                );
                const boundingMax = new BABYLON.Vector3(
                    Math.max(localMin.x, localMax.x),
                    Math.max(localMin.y, localMax.y),
                    Math.max(localMin.z, localMax.z)
                );

                // 新しいバウンディング情報を設定
                parentMesh.setBoundingInfo(new BABYLON.BoundingInfo(boundingMin, boundingMax));
                
                console.log(`✅ アセット ${parentMesh.name} のバウンディングを再計算完了:`);
                console.log(`  新しいローカル範囲: (${boundingMin.x.toFixed(3)}, ${boundingMin.y.toFixed(3)}, ${boundingMin.z.toFixed(3)}) - 
                    (${boundingMax.x.toFixed(3)}, ${boundingMax.y.toFixed(3)}, ${boundingMax.z.toFixed(3)})`);
                console.log(`  新しいワールド範囲: (${globalMin.x.toFixed(3)}, ${globalMin.y.toFixed(3)}, ${globalMin.z.toFixed(3)}) - 
                    (${globalMax.x.toFixed(3)}, ${globalMax.y.toFixed(3)}, ${globalMax.z.toFixed(3)})`);
                    
                // バウンディング半径も計算
                const center = boundingMin.add(boundingMax).scale(0.5);
                const radius = BABYLON.Vector3.Distance(center, boundingMax);
                console.log(`  計算された半径: ${radius.toFixed(3)}`);

            } else {
                console.warn(`アセット ${parentMesh.name} のバウンディング再計算に失敗 - 有効な子メッシュがありません`);
            }

        } catch (error) {
            console.error(`❌ アセット ${parentMesh.name} のバウンディング再計算中にエラー:`, error);
        }
    }

    /**
     * アセットのバウンディング情報をログに出力
     * @param {BABYLON.AbstractMesh} assetMesh - アセットメッシュ
     * @param {string} assetType - アセットタイプ
     */
    logAssetBoundingInfo(assetMesh, assetType = 'unknown') {
        try {
            console.log(`📦 アセットバウンディング情報 [${assetMesh.name} - ${assetType}]:`);
            
            // アセットのスケール情報
            const scale = assetMesh.scaling;
            console.log(`  スケール: (${scale.x.toFixed(3)}, ${scale.y.toFixed(3)}, ${scale.z.toFixed(3)}) - ${Math.round(scale.x * 100)}%`);
            console.log(`  位置: (${assetMesh.position.x.toFixed(3)}, ${assetMesh.position.y.toFixed(3)}, ${assetMesh.position.z.toFixed(3)})`);
            
            // メインメッシュのバウンディング情報
            const boundingInfo = assetMesh.getBoundingInfo();
            if (boundingInfo) {
                const boundingBox = boundingInfo.boundingBox;
                const boundingSphere = boundingInfo.boundingSphere;
                
                console.log(`  バウンディングボックス:`);
                console.log(`    ローカル最小値: (${boundingBox.minimum.x.toFixed(3)}, ${boundingBox.minimum.y.toFixed(3)}, ${boundingBox.minimum.z.toFixed(3)})`);
                console.log(`    ローカル最大値: (${boundingBox.maximum.x.toFixed(3)}, ${boundingBox.maximum.y.toFixed(3)}, ${boundingBox.maximum.z.toFixed(3)})`);
                console.log(`    ワールド最小値: (${boundingBox.minimumWorld.x.toFixed(3)}, ${boundingBox.minimumWorld.y.toFixed(3)}, ${boundingBox.minimumWorld.z.toFixed(3)})`);
                console.log(`    ワールド最大値: (${boundingBox.maximumWorld.x.toFixed(3)}, ${boundingBox.maximumWorld.y.toFixed(3)}, ${boundingBox.maximumWorld.z.toFixed(3)})`);
                
                const worldSize = {
                    x: boundingBox.maximumWorld.x - boundingBox.minimumWorld.x,
                    y: boundingBox.maximumWorld.y - boundingBox.minimumWorld.y,
                    z: boundingBox.maximumWorld.z - boundingBox.minimumWorld.z
                };
                console.log(`    ワールドサイズ: (${worldSize.x.toFixed(3)}, ${worldSize.y.toFixed(3)}, ${worldSize.z.toFixed(3)})`);
                
                console.log(`  バウンディングスフィア:`);
                console.log(`    中心: (${boundingSphere.center.x.toFixed(3)}, ${boundingSphere.center.y.toFixed(3)}, ${boundingSphere.center.z.toFixed(3)})`);
                console.log(`    半径: ${boundingSphere.radius.toFixed(3)}`);
                console.log(`    ワールド中心: (${boundingSphere.centerWorld.x.toFixed(3)}, ${boundingSphere.centerWorld.y.toFixed(3)}, ${boundingSphere.centerWorld.z.toFixed(3)})`);
                console.log(`    ワールド半径: ${boundingSphere.radiusWorld.toFixed(3)}`);
                
                // 10%スケールの影響を分析
                if (scale.x === 0.1) {
                    console.log(`  🔍 10%スケール影響分析:`);
                    console.log(`    原寸半径: ${(boundingSphere.radius / scale.x).toFixed(3)}`);
                    console.log(`    スケール後半径: ${boundingSphere.radiusWorld.toFixed(3)}`);
                    console.log(`    ピッキング判定半径: ${boundingSphere.radiusWorld.toFixed(3)}`);
                    
                    if (boundingSphere.radiusWorld < 0.1) {
                        console.warn(`    ⚠️ バウンディングスフィアが小さすぎます！ピッキング判定が困難になる可能性があります`);
                    }
                }
            }
            
            // 子メッシュの情報
            const childMeshes = assetMesh.getChildMeshes ? assetMesh.getChildMeshes() : [];
            if (childMeshes.length > 0) {
                console.log(`  子メッシュ (${childMeshes.length}個):`);
                childMeshes.forEach((child, index) => {
                    const childBounding = child.getBoundingInfo();
                    if (childBounding) {
                        const childSphere = childBounding.boundingSphere;
                        console.log(`    [${index}] ${child.name}: 半径=${childSphere.radiusWorld.toFixed(3)}, 選択可能=${child.isPickable}`);
                    } else {
                        console.log(`    [${index}] ${child.name}: バウンディング情報なし, 選択可能=${child.isPickable}`);
                    }
                });
            }
            
            // ピッキング情報
            console.log(`  ピッキング情報:`);
            console.log(`    選択可能: ${assetMesh.isPickable}`);
            console.log(`    有効: ${assetMesh.isEnabled()}`);
            console.log(`    可視: ${assetMesh.visibility}`);
            console.log(`    ジオメトリ有り: ${!!assetMesh.geometry}`);
            
        } catch (error) {
            console.error(`❌ アセットバウンディング情報の取得に失敗 [${assetMesh.name}]:`, error);
        }
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing AssetLoader...");
        
        // プリロードしたモデルを破棄
        Object.values(this.preloadedModels).forEach(model => {
            if (model && model._scene) {
                model.dispose();
            }
        });
        
        // ファシリティアセットキャッシュを破棄
        this.facilityAssetCache.forEach((mesh, filePath) => {
            if (mesh && mesh._scene) {
                // 保護フラグを解除してから破棄
                mesh.doNotDispose = false;
                const childMeshes = mesh.getChildMeshes();
                childMeshes.forEach(child => {
                    child.doNotDispose = false;
                });
                mesh.dispose();
            }
        });
        this.facilityAssetCache.clear();
        
        this.preloadedModels = {
            burger: null,
            recordMachine: null,
            juiceBox: null,
            trophy: null
        };
        
        this.loadingStatus = {
            burger: false,
            recordMachine: false,
            juiceBox: false,
            trophy: false
        };
        
        this.onLoadCallbacks = [];
    }
}