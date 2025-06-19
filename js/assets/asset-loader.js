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
            juiceBox: null
        };
        
        // ロード状態
        this.loadingStatus = {
            burger: false,
            recordMachine: false,
            juiceBox: false
        };
        
        // ロード完了コールバック
        this.onLoadCallbacks = [];
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
                this.loadJuiceBoxModel()
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
            
            // クローンされた子メッシュも有効化
            const childMeshes = clonedModel.getChildMeshes();
            childMeshes.forEach(childMesh => {
                childMesh.setEnabled(true);
            });
            
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
            record: this.isModelAvailable('record'),
            juiceBox: this.isModelAvailable('juiceBox'),
            isLoading: Object.values(this.loadingStatus).some(status => status)
        };
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
        
        this.preloadedModels = {
            burger: null,
            recordMachine: null,
            juiceBox: null
        };
        
        this.loadingStatus = {
            burger: false,
            recordMachine: false,
            juiceBox: false
        };
        
        this.onLoadCallbacks = [];
    }
}