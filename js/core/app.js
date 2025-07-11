// js/core/App.js
/**
 * メインアプリケーションクラス
 * 各モジュールを統合して管理
 */

import { SceneManager } from './scene-manager.js';
import { RoomManager } from '../environment/room-manager.js';
import { GridSystem } from '../environment/grid-system.js';
import { LightingSystem } from '../environment/lighting-system.js';
import { CameraManager } from '../camera/camera-manager.js';
import { AssetLoader } from '../assets/asset-loader.js';
import { AssetPlacer } from '../assets/asset-placer.js';
import { InteractionManager } from '../interaction/interaction-manager.js';
import { UIManager } from '../ui/ui-manager.js';
import { SelectionController } from '../interaction/selection-controller.js';
import { LoadingManager } from '../ui/loading-manager.js';
import { EnvironmentManager } from '../environment/environment-manager.js';
import { TextureManager } from '../environment/texture-manager.js';
import { UploadManager } from '../assets/upload-manager.js';
import { VehicleManager } from '../assets/vehicle-manager.js';
import { AudioManager } from '../audio/audio-manager.js';
import { BoundingBoxDebug } from '../debug/bounding-box-debug.js';
import { VehicleAnimation } from '../animation/vehicle-animation.js';

export class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.managers = {};
        this.isInitialized = false;
        this.loadingManager = new LoadingManager();
    }

    /**
     * アプリケーションを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log("Initializing application...");
            
            // ローディング表示を開始
            this.loadingManager.show("アプリケーションを初期化中...");
            this.loadingManager.setProgress(10);

            // シーンマネージャーを初期化
            this.managers.scene = new SceneManager(this.canvas);
            await this.managers.scene.initialize();
            this.loadingManager.setProgress(20);

            const scene = this.managers.scene.getScene();
            const errorHandler = this.managers.scene.getErrorHandler();

            // 各マネージャーを初期化
            this.loadingManager.updateMessage("マネージャーを初期化中...");
            this.managers.room = new RoomManager(scene, errorHandler);
            this.managers.grid = new GridSystem(scene, errorHandler);
            this.managers.lighting = new LightingSystem(scene, errorHandler);
            this.managers.camera = new CameraManager(scene, this.canvas, errorHandler);
            this.managers.assetLoader = new AssetLoader(scene, errorHandler);
            this.managers.assetPlacer = new AssetPlacer(scene, this.managers.assetLoader, errorHandler);
            this.managers.selection = new SelectionController(
                scene, 
                this.managers.scene.getHighlightLayer(), 
                errorHandler,
                this
            );
            this.managers.interaction = new InteractionManager(this, errorHandler);
            this.managers.ui = new UIManager(this, errorHandler);
            this.managers.environment = new EnvironmentManager(scene, errorHandler);
            this.managers.texture = new TextureManager(scene, errorHandler);
            this.managers.upload = new UploadManager(scene, this.managers.assetPlacer, errorHandler);
            this.managers.vehicle = new VehicleManager(scene, this.managers.assetLoader, errorHandler);
            
            // RoomManagerにTextureManagerを設定
            this.managers.room.setTextureManager(this.managers.texture);
            
            this.loadingManager.setProgress(40);

            // 環境をセットアップ
            await this.setupEnvironment();

            // インタラクションとUIを初期化
            this.managers.interaction.initialize();
            this.managers.ui.initialize();
            
            // SelectionControllerを初期化
            this.managers.selection.initialize();
            
            // アップロードマネージャーを初期化
            this.managers.upload.initialize();
            
            // 車両マネージャーを初期化
            this.managers.vehicle.setApp(this);
            this.managers.vehicle.initialize();
            
            // オーディオマネージャーを初期化
            this.managers.audio = new AudioManager(this.managers.scene.getScene(), this.managers.scene.getErrorHandler());
            this.managers.audio.initialize();
            
            // バウンディングボックスデバッグを初期化
            this.managers.boundingBoxDebug = new BoundingBoxDebug(this.managers.scene.getScene());
            
            // 車両アニメーションを初期化
            this.managers.vehicleAnimation = new VehicleAnimation(
                this.managers.scene.getScene(),
                this.managers.vehicle
            );
            
            // スケール設定を復元
            this.managers.assetPlacer.loadScaleSettings();
            
            // UploadManagerにInteractionManagerの参照を設定
            this.managers.upload.setInteractionManager(this.managers.interaction);
            this.loadingManager.setProgress(100);

            this.isInitialized = true;
            console.log("Application initialized successfully");
            
            // ローディング表示を非表示
            setTimeout(() => {
                this.loadingManager.hide();
                
                // 車両アニメーションを開始
                if (this.managers.vehicleAnimation) {
                    console.log('Starting vehicle animation...');
                    this.managers.vehicleAnimation.start();
                }
                
                // 車両選択モーダルを表示（少し遅延させてDOM要素が確実に読み込まれるようにする）
                setTimeout(() => {
                    console.log('Attempting to show vehicle modal...');
                    if (this.managers.vehicle) {
                        this.managers.vehicle.showModal();
                    } else {
                        console.error('VehicleManager not available');
                    }
                }, 100);
            }, 500);

        } catch (error) {
            console.error("Failed to initialize application:", error);
            this.loadingManager.showError(error.message);
            
            if (this.managers.scene) {
                this.managers.scene.getErrorHandler().handleCriticalError(
                    error, 
                    'App.initialize'
                );
            }
            throw error;
        }
    }

    /**
     * 環境をセットアップ
     * @returns {Promise<void>}
     */
    async setupEnvironment() {
        try {
            // 部屋をロード
            this.loadingManager.updateMessage("3Dルームをロード中...");
            await this.managers.room.loadRoom();
            this.loadingManager.setProgress(60);
            
            // アセットを事前ロード
            this.loadingManager.updateMessage("アセットをプリロード中...");
            
            // アセットローダーのプログレスを監視
            let loadedCount = 0;
            const totalAssets = 3; // バーガー、レコード、ジュースボックス
            
            this.managers.assetLoader.onAssetsLoaded(() => {
                loadedCount = totalAssets;
                this.loadingManager.updateAssetProgress(loadedCount, totalAssets);
            });
            
            await this.managers.assetLoader.preloadAssets();
            this.loadingManager.setProgress(80);
            
            // グリッドを作成
            this.loadingManager.updateMessage("環境を構築中...");
            this.managers.grid.initialize(
                this.managers.room.getGround(),
                this.managers.room.getWalls()
            );
            
            // ライティングをセットアップ
            this.managers.lighting.setupLights();
            
            // シャドウレシーバーとキャスターを設定
            console.log('=== シャドウレシーバー/キャスターの設定 ===');
            const shadowReceivers = this.managers.room.getShadowReceivers();
            const shadowCasters = this.managers.room.getShadowCasters();
            console.log(`シャドウレシーバー数: ${shadowReceivers.length}`);
            console.log(`シャドウキャスター数: ${shadowCasters.length}`);
            
            this.managers.lighting.setShadowReceivers(shadowReceivers);
            this.managers.lighting.setShadowCasters(shadowCasters);
            
            // デバッグ: 影の診断を実行
            setTimeout(() => {
                console.log('=== アプリケーション起動後の影診断 ===');
                this.managers.lighting.diagnoseShadows();
            }, 1000);
            
            // AssetPlacerにシャドウジェネレーターを設定
            this.managers.assetPlacer.setShadowGenerator(this.managers.lighting.getShadowGenerator());
            
            // 環境装飾オブジェクト（木、建物など）を作成
            this.loadingManager.updateMessage("環境装飾オブジェクトを作成中...");
            this.managers.environment.initialize();
            this.managers.environment.setShadowGenerator(this.managers.lighting.getShadowGenerator());
            
            // カメラをセットアップ
            this.managers.camera.setupDefaultCamera();
            
            // ポストプロセス効果を追加（ブルーム効果）
            this.setupPostProcessing();
            
            this.loadingManager.setProgress(90);
            
        } catch (error) {
            this.loadingManager.showError("環境のセットアップに失敗しました");
            throw error;
        }
    }

    /**
     * ポストプロセス効果をセットアップ
     */
    setupPostProcessing() {
        try {
            const scene = this.managers.scene.getScene();
            const camera = this.managers.camera.getActiveCamera();
            
            if (!scene || !camera) {
                console.warn("Scene or camera not available for post-processing");
                return;
            }
            
            // デフォルトパイプラインを作成
            const pipeline = new BABYLON.DefaultRenderingPipeline(
                "defaultPipeline",
                true,  // HDRテクスチャーを使用
                scene,
                [camera]
            );
            
            // ブルーム効果を有効化（Three.jsの例に合わせて intensity: 0.5）
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = 0.8;
            pipeline.bloomWeight = 0.5;  // Three.jsのintensity: 0.5に相当
            pipeline.bloomKernel = 64;
            pipeline.bloomScale = 0.5;
            
            // 追加の視覚効果（オプション）
            pipeline.fxaaEnabled = true;  // アンチエイリアシング
            
            console.log("Post-processing effects enabled (bloom intensity: 0.5)");
            
        } catch (error) {
            console.warn("Failed to setup post-processing:", error);
            // ポストプロセスの失敗はアプリケーションの動作に影響しないため、警告のみ
        }
    }

    /**
     * アプリケーションを開始
     */
    start() {
        if (!this.isInitialized) {
            console.error("Application not initialized");
            return;
        }

        // レンダーループにSelectionControllerのupdateを追加
        const scene = this.managers.scene.getScene();
        scene.registerBeforeRender(() => {
            if (this.managers.selection) {
                this.managers.selection.update();
            }
        });

        this.managers.scene.startRenderLoop();
        console.log("Application started");
    }

    /**
     * マネージャーを取得
     * @param {string} name - マネージャー名
     * @returns {Object} マネージャーインスタンス
     */
    getManager(name) {
        return this.managers[name];
    }

    /**
     * シーンを取得
     * @returns {BABYLON.Scene}
     */
    getScene() {
        return this.managers.scene ? this.managers.scene.getScene() : null;
    }

    /**
     * エンジンを取得
     * @returns {BABYLON.Engine}
     */
    getEngine() {
        return this.managers.scene ? this.managers.scene.getEngine() : null;
    }

    /**
     * エラーハンドラーを取得
     * @returns {ErrorHandler}
     */
    getErrorHandler() {
        return this.managers.scene ? this.managers.scene.getErrorHandler() : null;
    }

    /**
     * ローディングマネージャーを取得
     * @returns {LoadingManager}
     */
    getLoadingManager() {
        return this.loadingManager;
    }

    /**
     * アプリケーションの状態を取得
     * @returns {Object} アプリケーション状態
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentMode: this.managers.interaction ? 
                this.managers.interaction.getCurrentMode() : null,
            selectedObject: this.managers.selection ? 
                this.managers.selection.getSelectedMesh() : null,
            cameraMode: this.managers.camera ? 
                this.managers.camera.getCurrentMode() : null,
            gridSettings: this.managers.grid ? 
                this.managers.grid.getSettings() : null,
            lightingSettings: this.managers.lighting ? 
                this.managers.lighting.getSettings() : null,
            assetLoadingStatus: this.managers.assetLoader ? 
                this.managers.assetLoader.getLoadingStatus() : null
        };
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        if (!this.managers.scene || !this.getScene()) {
            return null;
        }
        
        const scene = this.getScene();
        const engine = this.getEngine();
        
        if (!scene || !engine) {
            return null;
        }
        
        return {
            fps: engine.getFps(),
            activeMeshes: scene.getActiveMeshes().length,
            totalMeshes: scene.meshes.length,
            totalVertices: scene.getTotalVertices(),
            drawCalls: scene.getEngine().drawCalls || 0
        };
    }

    /**
     * スクリーンショットを撮る
     * @param {Object} options - スクリーンショットオプション
     * @returns {Promise<string>} DataURL
     */
    async takeScreenshot(options = {}) {
        if (!this.managers.scene) {
            throw new Error("Scene not initialized");
        }
        
        return await this.managers.scene.takeScreenshot(options);
    }

    /**
     * アプリケーションをリセット
     */
    reset() {
        console.log("Resetting application...");

        // すべての配置済みアセットを削除
        if (this.managers.assetPlacer) {
            this.managers.assetPlacer.clearAllAssets();
        }

        // 選択を解除
        if (this.managers.selection) {
            this.managers.selection.deselectAll();
        }

        // インタラクションモードをリセット
        if (this.managers.interaction) {
            this.managers.interaction.resetMode();
        }

        // カメラをリセット
        if (this.managers.camera) {
            this.managers.camera.resetCamera();
        }

        console.log("Application reset complete");
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing application...");
        
        // すべてのマネージャーをクリーンアップ
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.dispose === 'function') {
                manager.dispose();
            }
        });
        
        // ローディングマネージャーをクリーンアップ
        if (this.loadingManager) {
            this.loadingManager.dispose();
        }
        
        this.managers = {};
        this.isInitialized = false;
        
        console.log("Application disposed");
    }
}