// js/core/SceneManager.js
/**
 * Babylon.jsのシーンとエンジンを管理するクラス
 */

import { DEFAULT_SETTINGS } from '../config/default-settings.js';
import { ASSET_URLS, BACKGROUND_360_SETTINGS } from '../config/constants.js';
import { ErrorHandler } from './error-handler.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.errorHandler = new ErrorHandler();
        this.highlightLayer = null; // ハイライトレイヤーを追加
        this.isInitialized = false;
        this.backgroundLoaded = false; // 背景ロード状態を追跡
    }

    /**
     * エンジンとシーンを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.initializeEngine();
            this.createScene();
            this.setupWindowResize();
            this.isInitialized = true;
            
            console.log("SceneManager initialized successfully");
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'SceneManager.initialize');
            throw error;
        }
    }

    /**
     * Babylon.jsエンジンの初期化
     */
    initializeEngine() {
        try {
            const engineSettings = DEFAULT_SETTINGS.engine;
            
            this.engine = new BABYLON.Engine(
                this.canvas, 
                engineSettings.antialiasing
            );
            
            // アルファモードを設定
            if (engineSettings.alphaMode === 'DISABLE') {
                this.engine.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
            }
            
            // ハードウェアスケーリングレベルを設定
            this.engine.setHardwareScalingLevel(engineSettings.hardwareScalingLevel);
            
            console.log("Babylon.js engine initialized");
        } catch (error) {
            throw new Error("Babylon.jsエンジンの初期化に失敗しました: " + error.message);
        }
    }

    /**
     * シーンの作成
     */
    createScene() {
        try {
            this.scene = new BABYLON.Scene(this.engine);
            
            const envSettings = DEFAULT_SETTINGS.environment;
            
            // 背景色を設定
            this.scene.clearColor = new BABYLON.Color4(
                envSettings.backgroundColor.r,
                envSettings.backgroundColor.g,
                envSettings.backgroundColor.b,
                envSettings.backgroundColor.a
            );
            
            // 右手系座標を使用
            if (envSettings.useRightHandedSystem) {
                this.scene.useRightHandedSystem = true;
            }
            
            // 深度レンダラーを設定
            this.scene.depthRenderer = new BABYLON.DepthRenderer(this.scene, {
                useOnlyInActiveCamera: true,
                depthScale: 10
            });
            
            // 深度バッファの精度を向上
            this.scene.getEngine().setDepthBuffer(true);
            this.scene.getEngine().setDepthFunction(BABYLON.Engine.LEQUAL);
            
            // Frustum Cullingの設定
            this.scene.autoClear = false;
            this.scene.skipFrustumClipping = true;
            
            // ハイライトレイヤーの作成
            this.highlightLayer = new BABYLON.HighlightLayer("highlightLayer", this.scene, {
                blurHorizontalSize: 2,
                blurVerticalSize: 2,
                mainTextureRatio: 0.5
            });
            
            console.log("Scene created successfully");
            
            // 背景作成は少し遅延させる（カメラ作成後）
            setTimeout(() => {
                this.setup360Background();
            }, 100);
        } catch (error) {
            throw new Error("シーンの作成に失敗しました: " + error.message);
        }
    }

    /**
     * 360度背景を設定
     */
    setup360Background() {
        try {
            console.log("🌅 360度背景の設定開始...");
            
            // プログラム生成のグラデーション背景を作成
            console.log("🚀 背景作成開始 - ダイナミックテクスチャ方式");
            this.createDynamicGradientSkybox();
            
        } catch (error) {
            console.error("❌ 360度背景の設定に失敗:", error);
            // フォールバック: デフォルトの背景色を維持
        }
    }
    
    /**
     * ダイナミックテクスチャでグラデーションスカイボックスを作成
     */
    createDynamicGradientSkybox() {
        try {
            console.log("🎨 ダイナミックテクスチャでグラデーション作成開始...");
            
            // 既存のスカイボックスを削除
            const existingSkybox = this.scene.getMeshByName("skybox");
            if (existingSkybox) {
                existingSkybox.dispose();
            }
            
            // 設定値を取得
            const settings = BACKGROUND_360_SETTINGS;
            
            // スカイボックスメッシュを作成
            const skybox = BABYLON.MeshBuilder.CreateSphere("skybox", {diameter: settings.DIAMETER}, this.scene);
            
            // ダイナミックテクスチャを作成
            const textureSize = 512;
            const dynamicTexture = new BABYLON.DynamicTexture("gradientTexture", textureSize, this.scene, false);
            
            // Canvasコンテキストを取得してグラデーションを描画
            const ctx = dynamicTexture.getContext();
            
            // グラデーションを作成
            const gradient = ctx.createLinearGradient(0, 0, 0, textureSize);
            gradient.addColorStop(0, "rgb(235, 242, 250)");      // 上部: 明るいライトブルーグレー
            gradient.addColorStop(0.4, "rgb(166, 179, 191)");    // 中間上: 中程度のグレー
            gradient.addColorStop(0.6, "rgb(166, 179, 191)");    // 中間下: 中程度のグレー
            gradient.addColorStop(1, "rgb(77, 89, 102)");        // 下部: 濃いグレー
            
            // グラデーションを描画
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, textureSize, textureSize);
            
            // テクスチャを更新
            dynamicTexture.update();
            
            console.log("✅ ダイナミックテクスチャ作成完了");
            
            // スカイボックスマテリアルを作成
            const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", this.scene);
            
            // テクスチャ設定
            skyboxMaterial.diffuseTexture = dynamicTexture;
            skyboxMaterial.emissiveTexture = dynamicTexture;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            
            // グラデーション用設定
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            
            // 明度設定
            skyboxMaterial.emissiveColor = new BABYLON.Color3(settings.BRIGHTNESS, settings.BRIGHTNESS, settings.BRIGHTNESS);
            
            skybox.material = skyboxMaterial;
            skybox.infiniteDistance = true;
            skybox.isPickable = false;
            skybox.checkCollisions = false;
            
            console.log("✅ ダイナミックグラデーションスカイボックス作成完了");
            
            // カメラが存在する場合のみレンダリング
            if (this.scene.activeCamera) {
                this.scene.render();
            } else {
                console.log("ℹ️ カメラ未作成のためレンダリングスキップ");
            }
            
        } catch (error) {
            console.error("❌ ダイナミックグラデーション作成エラー:", error);
            this.createFallbackSkybox();
        }
    }
    
    /**
     * フォールバック用のシンプルなスカイボックス
     */
    createFallbackSkybox() {
        try {
            console.log("🔄 フォールバックスカイボックス作成...");
            
            // 既存のスカイボックスを削除
            const existingSkybox = this.scene.getMeshByName("skybox");
            if (existingSkybox) {
                existingSkybox.dispose();
            }
            
            // 設定値を取得
            const settings = BACKGROUND_360_SETTINGS;
            
            // シンプルなスカイボックスを作成
            const skybox = BABYLON.MeshBuilder.CreateSphere("skybox", {diameter: settings.DIAMETER}, this.scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMaterial", this.scene);
            
            // 単色設定（中間グレー）
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.65, 0.7);
            skyboxMaterial.emissiveColor = new BABYLON.Color3(0.6 * settings.BRIGHTNESS, 0.65 * settings.BRIGHTNESS, 0.7 * settings.BRIGHTNESS);
            
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            
            skybox.material = skyboxMaterial;
            skybox.infiniteDistance = true;
            skybox.isPickable = false;
            skybox.checkCollisions = false;
            
            console.log("✅ フォールバックスカイボックス作成完了");
            
        } catch (error) {
            console.error("❌ フォールバックスカイボックス作成エラー:", error);
        }
    }

    /**
     * ウィンドウリサイズイベントの設定
     */
    setupWindowResize() {
        window.addEventListener("resize", () => {
            this.engine.resize();
            console.log("Engine resized");
        });
    }

    /**
     * レンダリングループの開始
     */
    startRenderLoop() {
        if (!this.isInitialized) {
            console.error("シーンが初期化されていません");
            return;
        }

        this.engine.runRenderLoop(() => {
            // 透明度バッファをクリア
            this.engine.clear(this.scene.clearColor, true, true, true);
            
            // シーンのレンダリング
            this.scene.render();
        });
        
        console.log("Render loop started");
    }

    /**
     * レンダリングループの停止
     */
    stopRenderLoop() {
        if (this.engine) {
            this.engine.stopRenderLoop();
            console.log("Render loop stopped");
        }
    }

    /**
     * シーンを取得
     * @returns {BABYLON.Scene}
     */
    getScene() {
        return this.scene;
    }

    /**
     * エンジンを取得
     * @returns {BABYLON.Engine}
     */
    getEngine() {
        return this.engine;
    }

    /**
     * ハイライトレイヤーを取得
     * @returns {BABYLON.HighlightLayer}
     */
    getHighlightLayer() {
        return this.highlightLayer;
    }

    /**
     * エラーハンドラーを取得
     * @returns {ErrorHandler}
     */
    getErrorHandler() {
        return this.errorHandler;
    }

    /**
     * キャンバスを取得
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * レンダリングの一時停止
     */
    pauseRendering() {
        this.stopRenderLoop();
    }

    /**
     * レンダリングの再開
     */
    resumeRendering() {
        this.startRenderLoop();
    }

    /**
     * シーンのスクリーンショットを撮る
     * @param {Object} options - スクリーンショットオプション
     * @returns {Promise<string>} - スクリーンショットのDataURL
     */
    takeScreenshot(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const screenshotSize = {
                    width: options.width || this.engine.getRenderWidth(),
                    height: options.height || this.engine.getRenderHeight()
                };
                
                // 一時的に高解像度に設定
                const originalScaling = this.engine.getHardwareScalingLevel();
                this.engine.setHardwareScalingLevel(options.scaling || 0.5);
                
                // シーンを一度レンダリング
                this.scene.render();
                
                // スクリーンショットを撮る
                BABYLON.Tools.CreateScreenshot(
                    this.engine,
                    this.scene.activeCamera,
                    screenshotSize,
                    (data) => {
                        // 元のスケーリングレベルに戻す
                        this.engine.setHardwareScalingLevel(originalScaling);
                        resolve(data);
                    }
                );
            } catch (error) {
                this.errorHandler.handleError(error, 'SceneManager.takeScreenshot');
                reject(error);
            }
        });
    }

    /**
     * リソースのクリーンアップ
     */
    dispose() {
        this.stopRenderLoop();
        
        if (this.highlightLayer) {
            this.highlightLayer.dispose();
        }
        
        if (this.scene) {
            this.scene.dispose();
        }
        
        if (this.engine) {
            this.engine.dispose();
        }
        
        console.log("SceneManager disposed");
    }
}