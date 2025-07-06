// js/camera/CameraManager.js
/**
 * カメラシステムを管理するクラス
 */

import { CAMERA_SETTINGS } from '../config/constants.js';
import { DEFAULT_SETTINGS } from '../config/default-settings.js';

export class CameraManager {
    constructor(scene, canvas, errorHandler) {
        this.scene = scene;
        this.canvas = canvas;
        this.errorHandler = errorHandler;
        
        // カメラインスタンス
        this.isometricCamera = null;
        this.firstPersonCamera = null;
        this.activeCamera = null;
        
        // カメラモード
        this.currentMode = DEFAULT_SETTINGS.camera.mode;
        
        // ズーム設定
        this.zoomLevel = DEFAULT_SETTINGS.zoom.level;
        
        // 1人称モード用
        this.firstPersonControls = null;
        this.movementKeys = {};
    }

    /**
     * デフォルトカメラをセットアップ
     */
    setupDefaultCamera() {
        try {
            // アイソメトリックカメラを作成
            this.createIsometricCamera();
            
            // デフォルトカメラをアクティブに
            this.setActiveCamera(this.isometricCamera);
            
            console.log("Default camera setup complete");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'CameraManager.setupDefaultCamera');
        }
    }

    /**
     * アイソメトリックカメラを作成
     */
    createIsometricCamera() {
        const settings = CAMERA_SETTINGS.DEFAULT;
        const limits = CAMERA_SETTINGS.LIMITS;
        
        this.isometricCamera = new BABYLON.ArcRotateCamera(
            "isometricCamera",
            settings.ALPHA,
            settings.BETA,
            settings.RADIUS,
            new BABYLON.Vector3(settings.TARGET.x, settings.TARGET.y, settings.TARGET.z),
            this.scene
        );
        
        // カメラ制限を設定
        this.isometricCamera.lowerRadiusLimit = limits.MIN_RADIUS;
        this.isometricCamera.upperRadiusLimit = limits.MAX_RADIUS;
        this.isometricCamera.lowerBetaLimit = limits.MIN_BETA;
        this.isometricCamera.upperBetaLimit = limits.MAX_BETA;
        this.isometricCamera.panningSensibility = DEFAULT_SETTINGS.camera.panningSensibility;
        
        // クリッピングプレーンを設定
        this.isometricCamera.minZ = 0.01;  // 非常に小さい正の値に設定
        this.isometricCamera.maxZ = limits.MAX_Z;
        
        // カメラコントロールの設定
        this.isometricCamera.useAutoRotationBehavior = false;
        this.isometricCamera.wheelPrecision = DEFAULT_SETTINGS.camera.wheelPrecision;
        
        // 等角投影モードを設定
        this.isometricCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.isometricCamera.skipFrustumClipping = false;
        this.isometricCamera.checkCollisions = false;
        
        // 初期投影設定
        this.updateCameraProjection();
        
        // カメラ位置変更イベント
        this.isometricCamera.onViewMatrixChangedObservable.add(() => {
            this.ensureMeshVisibility();
        });
        
        console.log("Isometric camera created");
    }

    /**
     * 1人称カメラを作成
     */
    createFirstPersonCamera() {
        const settings = CAMERA_SETTINGS.FIRST_PERSON;
        
        this.firstPersonCamera = new BABYLON.UniversalCamera(
            "firstPersonCamera",
            new BABYLON.Vector3(0, settings.EYE_HEIGHT, -5),
            this.scene
        );
        
        // ターゲットを前方に設定
        const target = this.firstPersonCamera.position.clone();
        target.z += 1;
        this.firstPersonCamera.setTarget(target);
        
        // カメラ設定
        this.firstPersonCamera.speed = settings.SPEED;
        this.firstPersonCamera.angularSensibility = settings.ANGULAR_SENSIBILITY;
        this.firstPersonCamera.inertia = settings.INERTIA;
        this.firstPersonCamera.minZ = 0.1;
        this.firstPersonCamera.maxZ = 100;
        
        // 移動制限を設定
        this.firstPersonCamera.checkCollisions = true;
        this.firstPersonCamera.ellipsoid = new BABYLON.Vector3(
            settings.ELLIPSOID.x,
            settings.ELLIPSOID.y,
            settings.ELLIPSOID.z
        );
        this.firstPersonCamera.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);
        
        // 標準のキーボード操作を無効化
        this.firstPersonCamera.keysUp = [];
        this.firstPersonCamera.keysDown = [];
        this.firstPersonCamera.keysLeft = [];
        this.firstPersonCamera.keysRight = [];
        
        console.log("First person camera created");
    }

    /**
     * カメラの投影範囲を更新
     * @param {number} customOrthoSize - カスタムオルソサイズ（オプション）
     */
    updateCameraProjection(customOrthoSize = null) {
        if (!this.isometricCamera || !this.scene.getEngine()) return;
        
        const engine = this.scene.getEngine();
        const aspectRatio = engine.getAspectRatio(this.isometricCamera);
        const canvas = engine.getRenderingCanvas();
        const canvasWidth = canvas.width;
        
        // 36×36の描画範囲を実現するために基本値を18に設定
        let orthoSize;
        if (customOrthoSize !== null) {
            orthoSize = customOrthoSize;
        } else {
            if (canvasWidth <= 768) {
                orthoSize = 18; // モバイル（36×36）
            } else if (canvasWidth <= 1024) {
                orthoSize = 18; // タブレット（36×36）
            } else {
                orthoSize = 18; // デスクトップ（36×36）
            }
            
            // ズームレベルを適用
            orthoSize = orthoSize / this.zoomLevel;
        }
        
        // 投影パラメータを設定
        if (aspectRatio > 1.5) {
            this.isometricCamera.orthoTop = orthoSize;
            this.isometricCamera.orthoBottom = -orthoSize;
            this.isometricCamera.orthoLeft = -orthoSize * aspectRatio;
            this.isometricCamera.orthoRight = orthoSize * aspectRatio;
        } else {
            this.isometricCamera.orthoTop = orthoSize;
            this.isometricCamera.orthoBottom = -orthoSize;
            this.isometricCamera.orthoLeft = -orthoSize * aspectRatio;
            this.isometricCamera.orthoRight = orthoSize * aspectRatio;
        }
    }

    /**
     * アクティブカメラを設定
     * @param {BABYLON.Camera} camera - カメラ
     */
    setActiveCamera(camera) {
        this.activeCamera = camera;
        this.scene.activeCamera = camera;
        
        if (camera) {
            camera.attachControl(this.canvas, true);
        }
    }

    /**
     * カメラモードを切り替え
     * @param {string} mode - 'isometric' または 'firstPerson'
     */
    switchCameraMode(mode) {
        if (mode === this.currentMode) return;
        
        // 現在のカメラをデタッチ
        if (this.activeCamera) {
            this.activeCamera.detachControl(this.canvas);
        }
        
        if (mode === 'firstPerson') {
            // 1人称カメラがなければ作成
            if (!this.firstPersonCamera) {
                this.createFirstPersonCamera();
            }
            
            this.setActiveCamera(this.firstPersonCamera);
            this.setupFirstPersonControls();
            this.enableCollisions();
            
        } else {
            // アイソメトリックカメラに戻す
            this.setActiveCamera(this.isometricCamera);
            this.removeFirstPersonControls();
            this.disableCollisions();
        }
        
        this.currentMode = mode;
        console.log(`Switched to ${mode} camera mode`);
    }

    /**
     * 1人称モードのコントロールをセットアップ
     */
    setupFirstPersonControls() {
        // キーボードイベントリスナー
        this.onKeyDown = (event) => {
            this.movementKeys[event.code] = true;
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ControlLeft', 'Space', 'KeyC'].includes(event.code)) {
                event.preventDefault();
            }
        };
        
        this.onKeyUp = (event) => {
            this.movementKeys[event.code] = false;
        };
        
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        
        // レンダーループで移動を処理
        this.scene.registerBeforeRender(this.updateFirstPersonMovement.bind(this));
    }

    /**
     * 1人称モードのコントロールを削除
     */
    removeFirstPersonControls() {
        if (this.onKeyDown) {
            window.removeEventListener("keydown", this.onKeyDown);
            window.removeEventListener("keyup", this.onKeyUp);
        }
        
        this.scene.unregisterBeforeRender(this.updateFirstPersonMovement.bind(this));
        this.movementKeys = {};
    }

    /**
     * 1人称モードでの移動処理
     */
    updateFirstPersonMovement() {
        if (!this.firstPersonCamera || this.currentMode !== 'firstPerson') return;
        
        const engine = this.scene.getEngine();
        const speed = this.movementKeys['ShiftLeft'] ? 8.0 : (this.movementKeys['ControlLeft'] ? 2.0 : 4.0);
        const deltaTime = engine.getDeltaTime() / 1000;
        
        // カメラの向きに基づいて移動方向を計算
        const forward = this.firstPersonCamera.getDirection(BABYLON.Vector3.Forward()).normalize();
        const right = this.firstPersonCamera.getDirection(BABYLON.Vector3.Right()).normalize();
        const up = BABYLON.Vector3.Up();
        
        // 水平移動用のベクトル
        const forwardHorizontal = new BABYLON.Vector3(forward.x, 0, forward.z).normalize();
        const rightHorizontal = new BABYLON.Vector3(right.x, 0, right.z).normalize();
        
        let movement = BABYLON.Vector3.Zero();
        
        // WASD移動
        if (this.movementKeys['KeyW']) {
            movement = movement.add(forwardHorizontal.scale(-speed * deltaTime * 2.0));
        }
        if (this.movementKeys['KeyS']) {
            movement = movement.add(forwardHorizontal.scale(speed * deltaTime * 2.0));
        }
        if (this.movementKeys['KeyA']) {
            movement = movement.add(rightHorizontal.scale(-speed * deltaTime));
        }
        if (this.movementKeys['KeyD']) {
            movement = movement.add(rightHorizontal.scale(speed * deltaTime));
        }
        if (this.movementKeys['Space']) {
            movement = movement.add(up.scale(speed * deltaTime));
        }
        if (this.movementKeys['KeyC']) {
            movement = movement.add(up.scale(-speed * deltaTime));
        }
        
        // 移動を適用
        if (!movement.equalsToFloats(0, 0, 0)) {
            const newPosition = this.firstPersonCamera.position.add(movement);
            
            // 部屋の境界内に制限
            const boundary = this.getBoundary();
            if (newPosition.x >= boundary.minX && newPosition.x <= boundary.maxX &&
                newPosition.z >= boundary.minZ && newPosition.z <= boundary.maxZ &&
                newPosition.y >= boundary.minY && newPosition.y <= boundary.maxY) {
                
                this.firstPersonCamera.position = newPosition;
            }
        }
    }

    /**
     * 衝突判定を有効化
     */
    enableCollisions() {
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes("floor") || 
                mesh.name.includes("ground") || 
                mesh.name.includes("wall")) {
                mesh.checkCollisions = true;
            }
        });
    }

    /**
     * 衝突判定を無効化
     */
    disableCollisions() {
        this.scene.meshes.forEach(mesh => {
            mesh.checkCollisions = false;
        });
    }

    /**
     * メッシュの可視性を確保
     */
    ensureMeshVisibility() {
        this.scene.meshes.forEach(mesh => {
            if (mesh !== this.gridMesh && 
                !mesh.name.startsWith("preview") && 
                !mesh.name.startsWith("vertical")) {
                mesh.isVisible = true;
                mesh.alwaysSelectAsActiveMesh = true;
                mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
            }
        });
    }

    /**
     * ズームレベルを設定
     * @param {number} level - ズームレベル
     */
    setZoomLevel(level) {
        this.zoomLevel = Math.max(0.5, Math.min(2.0, level));
        
        if (this.currentMode === 'isometric') {
            this.updateCameraProjection();
        }
    }

    /**
     * カメラをリセット
     */
    resetCamera() {
        if (this.currentMode === 'firstPerson') {
            this.switchCameraMode('isometric');
        }
        
        if (this.isometricCamera) {
            const settings = CAMERA_SETTINGS.DEFAULT;
            this.isometricCamera.alpha = settings.ALPHA;
            this.isometricCamera.beta = settings.BETA;
            this.isometricCamera.radius = settings.RADIUS;
            this.isometricCamera.target = new BABYLON.Vector3(
                settings.TARGET.x,
                settings.TARGET.y,
                settings.TARGET.z
            );
        }
        
        this.zoomLevel = DEFAULT_SETTINGS.zoom.level;
        this.updateCameraProjection();
    }

    /**
     * フォーカス前の状態に戻る（アニメーション付き）
     */
    returnToPreFocusState() {
        if (!this.preFocusState || !this.isometricCamera) {
            console.error("No pre-focus state saved");
            return;
        }
        
        // オルソグラフィックモードからの復帰
        if (this.preFocusState.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA && 
            this.isometricCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
            // オルソグラフィックモードでのアニメーション
            const currentOrthoSize = Math.abs(this.isometricCamera.orthoTop);
            const targetOrthoSize = Math.abs(this.preFocusState.orthoTop);
            
            const orthoState = {
                orthoSize: currentOrthoSize,
                alpha: this.isometricCamera.alpha,
                beta: this.isometricCamera.beta,
                targetX: this.isometricCamera.target.x,
                targetY: this.isometricCamera.target.y,
                targetZ: this.isometricCamera.target.z
            };
            
            gsap.to(orthoState, {
                duration: 1.5,
                orthoSize: targetOrthoSize,
                alpha: this.preFocusState.alpha,
                beta: this.preFocusState.beta,
                targetX: this.preFocusState.target.x,
                targetY: this.preFocusState.target.y,
                targetZ: this.preFocusState.target.z,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.updateCameraProjection(orthoState.orthoSize);
                    this.isometricCamera.alpha = orthoState.alpha;
                    this.isometricCamera.beta = orthoState.beta;
                    this.isometricCamera.target.x = orthoState.targetX;
                    this.isometricCamera.target.y = orthoState.targetY;
                    this.isometricCamera.target.z = orthoState.targetZ;
                },
                onComplete: () => {
                    // ズームレベルを復元
                    this.zoomLevel = this.preFocusState.zoomLevel || 1;
                    this.updateCameraProjection();
                    console.log("Returned to pre-focus state (ORTHOGRAPHIC)");
                }
            });
        } else {
            // 透視投影モードでの復元または異なるモード間の切り替え
            const cameraState = {
                radius: this.isometricCamera.radius,
                alpha: this.isometricCamera.alpha,
                beta: this.isometricCamera.beta,
                targetX: this.isometricCamera.target.x,
                targetY: this.isometricCamera.target.y,
                targetZ: this.isometricCamera.target.z
            };
            
            gsap.to(cameraState, {
                duration: 1.5,
                radius: this.preFocusState.radius,
                alpha: this.preFocusState.alpha,
                beta: this.preFocusState.beta,
                targetX: this.preFocusState.target.x,
                targetY: this.preFocusState.target.y,
                targetZ: this.preFocusState.target.z,
                ease: "power2.inOut",
                onUpdate: () => {
                    this.isometricCamera.radius = cameraState.radius;
                    this.isometricCamera.alpha = cameraState.alpha;
                    this.isometricCamera.beta = cameraState.beta;
                    this.isometricCamera.target.x = cameraState.targetX;
                    this.isometricCamera.target.y = cameraState.targetY;
                    this.isometricCamera.target.z = cameraState.targetZ;
                },
                onComplete: () => {
                    // 元のカメラモードに戻す
                    this.isometricCamera.mode = this.preFocusState.mode;
                    if (this.preFocusState.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
                        this.zoomLevel = this.preFocusState.zoomLevel || 1;
                        this.updateCameraProjection();
                    }
                    console.log("Returned to pre-focus state");
                }
            });
        }
    }

    /**
     * 特定のメッシュにカメラをフォーカス（GSAPアニメーション）
     * @param {BABYLON.AbstractMesh} targetMesh - フォーカス対象のメッシュ
     * @param {Object} options - アニメーションオプション
     */
    focusOnMesh(targetMesh, options = {}) {
        if (!targetMesh || !this.isometricCamera) {
            console.error("Target mesh or camera not available");
            return;
        }

        // デフォルトオプション
        const defaults = {
            duration: 2,          // アニメーション時間（秒）
            radiusMultiplier: 2.5,  // メッシュのサイズに対する距離の倍率
            ease: "power2.inOut",
            minRadius: 5,        // 最小距離（これ以上近づかない）
            keepOrthographic: true,  // オルソグラフィックモードを維持するか
            onComplete: null
        };
        
        const settings = { ...defaults, ...options };
        
        // 1人称モードの場合はアイソメトリックに切り替え
        if (this.currentMode === 'firstPerson') {
            this.switchCameraMode('isometric');
        }
        
        // ターゲットのバウンディングボックスを取得
        const boundingInfo = targetMesh.getBoundingInfo();
        const boundingSphere = boundingInfo.boundingSphere;
        const center = boundingSphere.centerWorld;
        const radius = boundingSphere.radiusWorld;
        
        console.log("Focus mesh debug:", {
            meshName: targetMesh.name,
            sphereRadius: radius,
            currentCameraRadius: this.isometricCamera.radius,
            multiplier: settings.radiusMultiplier
        });
        
        // 目標となるカメラ設定
        let targetRadius = radius * settings.radiusMultiplier;
        // 最小距離を保証
        targetRadius = Math.max(targetRadius, settings.minRadius);
        
        console.log("Target camera settings:", {
            targetRadius: targetRadius,
            minRadius: settings.minRadius,
            finalRadius: targetRadius
        });
        
        const targetAlpha = this.isometricCamera.alpha; // 現在の角度を維持
        const targetBeta = Math.PI / 4; // 45度（より近い視点）
        
        // フォーカス前のカメラ状態を保存（戻る時のため）
        this.preFocusState = {
            radius: this.isometricCamera.radius,
            alpha: this.isometricCamera.alpha,
            beta: this.isometricCamera.beta,
            target: this.isometricCamera.target.clone(),
            mode: this.isometricCamera.mode,
            orthoLeft: this.isometricCamera.orthoLeft,
            orthoRight: this.isometricCamera.orthoRight,
            orthoTop: this.isometricCamera.orthoTop,
            orthoBottom: this.isometricCamera.orthoBottom,
            zoomLevel: this.zoomLevel
        };
        
        console.log("Camera state before focus:", {
            currentMode: this.isometricCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA ? "ORTHOGRAPHIC" : "PERSPECTIVE",
            currentRadius: this.isometricCamera.radius,
            orthoParams: {
                left: this.isometricCamera.orthoLeft,
                right: this.isometricCamera.orthoRight,
                top: this.isometricCamera.orthoTop,
                bottom: this.isometricCamera.orthoBottom
            }
        });
        
        // GSAPでアニメーション（現在の位置から開始）
        const cameraState = {
            radius: this.isometricCamera.radius,  // 現在の距離から開始
            alpha: this.isometricCamera.alpha,
            beta: this.isometricCamera.beta,
            targetX: this.isometricCamera.target.x,
            targetY: this.isometricCamera.target.y,
            targetZ: this.isometricCamera.target.z,
            progress: 0  // 投影モード切り替えのタイミング制御用
        };
        
        // 現在の距離から目標距離への変化を確認
        console.log("Camera animation from/to:", {
            fromRadius: cameraState.radius,
            toRadius: targetRadius,
            radiusChange: cameraState.radius - targetRadius,
            cameraMode: settings.keepOrthographic && this.isometricCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA ? "ORTHOGRAPHIC" : "PERSPECTIVE"
        });
        
        // オルソグラフィックモードでのフォーカス
        if (settings.keepOrthographic && this.isometricCamera.mode === BABYLON.Camera.ORTHOGRAPHIC_CAMERA) {
            // オルソグラフィックモードを維持
            console.log("Focusing in ORTHOGRAPHIC mode");
            
            // 現在のオルソサイズから計算
            const currentOrthoSize = Math.abs(this.isometricCamera.orthoTop);
            // ズームインのため、現在のオルソサイズより小さい値を目標にする
            const targetOrthoSize = Math.max(radius * 0.8, 3); // 車両サイズに基づいた値（最小3）
            const minOrthoSize = 3; // 最小オルソサイズ（これ以上近づかない）
            const maxOrthoSize = currentOrthoSize * 0.75; // 現在の75%までズームイン（少し控えめに）
            const finalOrthoSize = Math.min(maxOrthoSize, Math.max(minOrthoSize, targetOrthoSize));
            
            console.log("Orthographic zoom calculation:", {
                currentOrthoSize,
                vehicleRadius: radius,
                targetOrthoSize,
                minOrthoSize,
                maxOrthoSize,
                finalOrthoSize,
                willZoomIn: finalOrthoSize < currentOrthoSize,
                zoomRatio: finalOrthoSize / currentOrthoSize
            });
            
            // GSAPでアニメーション
            const orthoState = {
                orthoSize: currentOrthoSize,
                alpha: this.isometricCamera.alpha,
                beta: this.isometricCamera.beta,
                targetX: this.isometricCamera.target.x,
                targetY: this.isometricCamera.target.y,
                targetZ: this.isometricCamera.target.z
            };
            
            gsap.to(orthoState, {
                duration: settings.duration,
                orthoSize: finalOrthoSize,
                alpha: targetAlpha,
                beta: targetBeta,
                targetX: center.x,
                targetY: center.y,
                targetZ: center.z,
                ease: settings.ease,
                onUpdate: () => {
                    // オルソグラフィック投影範囲を更新
                    this.updateCameraProjection(orthoState.orthoSize);
                    this.isometricCamera.alpha = orthoState.alpha;
                    this.isometricCamera.beta = orthoState.beta;
                    this.isometricCamera.target.x = orthoState.targetX;
                    this.isometricCamera.target.y = orthoState.targetY;
                    this.isometricCamera.target.z = orthoState.targetZ;
                },
                onComplete: () => {
                    console.log("Camera focus animation completed (ORTHOGRAPHIC)", {
                        finalOrthoSize: orthoState.orthoSize,
                        finalTarget: this.isometricCamera.target
                    });
                    if (settings.onComplete) {
                        settings.onComplete();
                    }
                }
            });
            
        } else {
            // 透視投影モードでのフォーカス（従来の動作）
            console.log("Focusing in PERSPECTIVE mode");
            
            // フォーカス時は透視投影に切り替える（ズーム効果のため）
            this.isometricCamera.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;
            
            // デバッグ用：開始距離を調整可能にする
            const startRadius = settings.startRadius || 20; // デフォルト20、オプションで調整可能
            console.log("Using start radius:", startRadius);
            
            // カメラの開始距離を設定
            cameraState.radius = startRadius;
            this.isometricCamera.radius = startRadius;
            
            gsap.to(cameraState, {
                duration: settings.duration,
                radius: targetRadius,
                alpha: targetAlpha,
                beta: targetBeta,
                targetX: center.x,
                targetY: center.y,
                targetZ: center.z,
                ease: settings.ease,
                onUpdate: () => {
                    this.isometricCamera.radius = cameraState.radius;
                    this.isometricCamera.alpha = cameraState.alpha;
                    this.isometricCamera.beta = cameraState.beta;
                    this.isometricCamera.target.x = cameraState.targetX;
                    this.isometricCamera.target.y = cameraState.targetY;
                    this.isometricCamera.target.z = cameraState.targetZ;
                },
                onComplete: () => {
                    console.log("Camera focus animation completed", {
                        finalRadius: this.isometricCamera.radius,
                        finalTarget: this.isometricCamera.target
                    });
                    if (settings.onComplete) {
                        settings.onComplete();
                    }
                }
            });
        }
    }

    /**
     * 現在のカメラ設定を取得
     * @returns {Object} カメラ設定
     */
    getCameraSettings() {
        const camera = this.activeCamera;
        if (!camera) return null;
        
        if (camera === this.isometricCamera) {
            return {
                mode: 'isometric',
                alpha: camera.alpha,
                beta: camera.beta,
                radius: camera.radius,
                target: {
                    x: camera.target.x,
                    y: camera.target.y,
                    z: camera.target.z
                },
                position: {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z
                },
                zoomLevel: this.zoomLevel
            };
        } else {
            return {
                mode: 'firstPerson',
                position: {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z
                },
                rotation: {
                    x: camera.rotation.x,
                    y: camera.rotation.y,
                    z: camera.rotation.z
                }
            };
        }
    }

    /**
     * 現在のカメラモードを取得
     * @returns {string} カメラモード
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * アクティブカメラを取得
     * @returns {BABYLON.Camera}
     */
    getActiveCamera() {
        return this.activeCamera;
    }

    /**
     * 部屋の境界を取得
     * @returns {Object} 境界オブジェクト
     */
    getBoundary() {
        return {
            minX: -8.5,
            maxX: 8.5,
            minZ: -8.5,
            maxZ: 8.5,
            minY: 0.1,
            maxY: 5.0
        };
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing CameraManager...");
        
        // カメラコントロールを削除
        if (this.activeCamera) {
            this.activeCamera.detachControl(this.canvas);
        }
        
        // 1人称コントロールを削除
        this.removeFirstPersonControls();
        
        // カメラを破棄
        if (this.isometricCamera) {
            this.isometricCamera.dispose();
            this.isometricCamera = null;
        }
        
        if (this.firstPersonCamera) {
            this.firstPersonCamera.dispose();
            this.firstPersonCamera = null;
        }
        
        this.activeCamera = null;
    }
}