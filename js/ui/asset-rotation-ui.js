// js/ui/asset-rotation-ui.js
/**
 * アセット選択時に表示される回転UIコントロール
 */

export class AssetRotationUI {
    constructor(scene, app) {
        this.scene = scene;
        this.app = app;
        
        // UI要素
        this.rotationButton = null;
        this.buttonMaterial = null;
        this.advancedTexture = null;
        
        // 現在のターゲット
        this.targetMesh = null;
        
        // 設定
        this.buttonSize = 1; // ボタンサイズは1で固定
        this.buttonDistance = 0.1; // アセットからの距離を近く
        this.buttonHeight = 0.05; // 低めに配置
    }

    /**
     * 初期化
     */
    initialize() {
        // GUI用のAdvancedDynamicTextureを作成
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("rotationUI");
        
        console.log("AssetRotationUI initialized");
    }

    /**
     * 回転ボタンを表示
     * @param {BABYLON.Mesh} mesh - ターゲットメッシュ
     */
    showRotationButton(mesh) {
        if (!mesh || mesh.isDisposed()) return;
        
        // 既存のボタンを削除
        this.hideRotationButton();
        
        this.targetMesh = mesh;
        
        // 3Dボタンを作成
        this.createRotationButton3D(mesh);
    }

    /**
     * 3D空間に回転ボタンを作成
     * @param {BABYLON.Mesh} mesh - ターゲットメッシュ
     */
    createRotationButton3D(mesh) {
        // 白い背景用の円を作成（1.1倍のサイズ）
        const backgroundButton = BABYLON.MeshBuilder.CreateDisc("rotationButtonBg", {
            radius: this.buttonSize * 0.55, // 0.5 * 1.1 = 0.55
            tessellation: 32,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);
        
        // 白い背景のマテリアル（半透明）
        const bgMaterial = new BABYLON.StandardMaterial("rotationButtonBgMat", this.scene);
        bgMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // 白色
        bgMaterial.emissiveColor = new BABYLON.Color3(0.95, 0.95, 0.95); // 少し明るく
        bgMaterial.alpha = 0.3; // 半透明（30%の不透明度）
        bgMaterial.backFaceCulling = false;
        backgroundButton.material = bgMaterial;
        
        // 背景もUI要素として設定
        backgroundButton.metadata = {
            isUIElement: true,
            type: 'rotationButtonBackground'
        };
        backgroundButton.isPickable = true;
        
        // アイコン用の平面を作成
        this.rotationButton = BABYLON.MeshBuilder.CreatePlane("rotationButton", {
            size: this.buttonSize,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);
        
        // 背景ボタンの子要素として設定
        backgroundButton.parent = this.rotationButton;
        backgroundButton.position.z = -0.01; // 少し後ろに配置
        
        // ボタンのマテリアルを作成
        this.buttonMaterial = new BABYLON.StandardMaterial("rotationButtonMat", this.scene);
        
        // 画像ファイルからテクスチャを読み込み
        const buttonTexture = new BABYLON.Texture("./assets/Rotate.png", this.scene);
        buttonTexture.hasAlpha = true;
        
        // マテリアルにテクスチャを設定
        this.buttonMaterial.diffuseTexture = buttonTexture;
        this.buttonMaterial.emissiveTexture = buttonTexture;
        this.buttonMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // 明るく表示
        this.buttonMaterial.opacityTexture = buttonTexture;
        this.buttonMaterial.hasAlpha = true; // アルファ透明度を有効化
        this.buttonMaterial.useAlphaFromDiffuseTexture = true;
        this.buttonMaterial.backFaceCulling = false;
        
        this.rotationButton.material = this.buttonMaterial;
        
        // ボタンの位置を設定
        this.updateButtonPosition();
        
        // ボタンを常にカメラに向ける
        this.rotationButton.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // ボタンをクリック可能にする
        this.rotationButton.isPickable = true;
        
        // ボタンのメタデータを設定（InteractionManagerで除外するため）
        this.rotationButton.metadata = {
            isUIElement: true,
            type: 'rotationButton'
        };
        
        // ホバー効果とクリックイベントを追加
        this.setupButtonInteractions();
    }

    /**
     * ボタンの位置を更新
     */
    updateButtonPosition() {
        if (!this.rotationButton || !this.targetMesh) return;
        
        // メッシュのバウンディングボックスを取得（ワールド空間）
        const boundingInfo = this.targetMesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        const size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
        
        // メッシュの中心位置を取得
        const meshCenter = this.targetMesh.getAbsolutePosition();
        
        // デバッグ情報
        console.log("Button position debug:", {
            meshName: this.targetMesh.name,
            meshCenter: meshCenter.toString(),
            boundingBoxSize: size.toString(),
            maxSize: Math.max(size.x, size.y, size.z),
            buttonDistance: this.buttonDistance,
            meshScale: this.targetMesh.scaling.toString(),
            minimumWorld: boundingBox.minimumWorld.toString(),
            maximumWorld: boundingBox.maximumWorld.toString()
        });
        
        // カメラの位置を取得してボタンを配置する方向を決定
        const camera = this.scene.activeCamera;
        const cameraDir = camera.position.subtract(meshCenter).normalize();
        
        // メッシュのサイズに基づいて距離を計算
        // buttonDistanceは固定値として使用（0.5 = 50cm）
        const maxSize = Math.max(size.x, size.y, size.z);
        const distance = (maxSize * 0.5) + this.buttonDistance;
        
        console.log("Distance calculation:", {
            maxSize: maxSize,
            buttonDistance: this.buttonDistance,
            finalDistance: distance
        });
        
        // カメラ方向にボタンを配置（右寄り）
        const rightVector = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraDir).normalize();
        const buttonOffset = rightVector.scale(distance);
        
        // ボタンの位置を設定（メッシュの右側、少し上）
        this.rotationButton.position = meshCenter.add(buttonOffset);
        this.rotationButton.position.y = meshCenter.y + (size.y * 0.5) + this.buttonHeight;
        
        console.log("Final button position:", this.rotationButton.position.toString());
    }

    /**
     * ボタンのインタラクションを設定
     */
    setupButtonInteractions() {
        // ホバー時のアニメーション
        let isHovering = false;
        let animationId = null;
        
        // ポインターエンター
        this.rotationButton.actionManager = new BABYLON.ActionManager(this.scene);
        
        // ホバー開始
        this.rotationButton.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                () => {
                    if (!isHovering) {
                        isHovering = true;
                        // スケーリングアニメーション
                        const hoverAnimation = new BABYLON.Animation(
                            "buttonHoverIn",
                            "scaling",
                            60,
                            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
                        
                        const hoverKeys = [];
                        hoverKeys.push({ frame: 0, value: this.rotationButton.scaling.clone() });
                        hoverKeys.push({ frame: 8, value: new BABYLON.Vector3(1.05, 1.05, 1.05) });
                        
                        hoverAnimation.setKeys(hoverKeys);
                        
                        this.scene.beginDirectAnimation(
                            this.rotationButton,
                            [hoverAnimation],
                            0,
                            8,
                            false
                        );
                        
                        // 明度を少し上げる
                        if (this.buttonMaterial) {
                            this.buttonMaterial.emissiveColor = new BABYLON.Color3(1.2, 1.2, 1.2);
                        }
                        
                        // カーソルを変更
                        this.scene.hoverCursor = "pointer";
                    }
                }
            )
        );
        
        // ホバー終了
        this.rotationButton.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                () => {
                    if (isHovering) {
                        isHovering = false;
                        // 元のサイズに戻すアニメーション
                        const hoverOutAnimation = new BABYLON.Animation(
                            "buttonHoverOut",
                            "scaling",
                            60,
                            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
                        
                        const hoverOutKeys = [];
                        hoverOutKeys.push({ frame: 0, value: this.rotationButton.scaling.clone() });
                        hoverOutKeys.push({ frame: 8, value: new BABYLON.Vector3(1, 1, 1) });
                        
                        hoverOutAnimation.setKeys(hoverOutKeys);
                        
                        this.scene.beginDirectAnimation(
                            this.rotationButton,
                            [hoverOutAnimation],
                            0,
                            8,
                            false
                        );
                        
                        // 明度を元に戻す
                        if (this.buttonMaterial) {
                            this.buttonMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
                        }
                        
                        // カーソルを戻す
                        this.scene.hoverCursor = "default";
                    }
                }
            )
        );
        
        // クリック時の処理
        this.rotationButton.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    console.log("回転ボタンがクリックされました");
                    // 直接SelectionControllerを呼び出す
                    const selectionController = this.app.getManager('selection');
                    if (selectionController && selectionController.getSelectedMesh()) {
                        console.log("選択中のメッシュを回転:", selectionController.getSelectedMesh().name);
                        selectionController.rotateSelectedMesh();
                        
                        // ボタンのアニメーション
                        this.animateButtonPress();
                    } else {
                        console.log("選択中のメッシュがありません");
                    }
                }
            )
        );
    }

    /**
     * ボタンの押し込みアニメーション
     */
    animateButtonPress() {
        if (!this.rotationButton || this.rotationButton.isDisposed()) return;
        
        // 現在のスケーリングを保存
        const currentScaling = this.rotationButton.scaling.clone();
        
        // 押し込みアニメーション
        const pressAnimation = new BABYLON.Animation(
            "buttonPress",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const pressKeys = [];
        pressKeys.push({ frame: 0, value: currentScaling });
        pressKeys.push({ frame: 5, value: new BABYLON.Vector3(0.95, 0.95, 0.95) });
        pressKeys.push({ frame: 10, value: new BABYLON.Vector3(1, 1, 1) });
        
        pressAnimation.setKeys(pressKeys);
        
        // アニメーションを実行
        this.scene.beginDirectAnimation(
            this.rotationButton,
            [pressAnimation],
            0,
            10,
            false
        );
    }

    /**
     * 回転ボタンを非表示
     */
    hideRotationButton() {
        if (this.rotationButton) {
            this.rotationButton.dispose();
            this.rotationButton = null;
        }
        
        if (this.buttonMaterial) {
            this.buttonMaterial.dispose();
            this.buttonMaterial = null;
        }
        
        this.targetMesh = null;
        
        // カーソルを戻す
        if (this.scene) {
            this.scene.hoverCursor = "default";
        }
    }

    /**
     * フレーム更新
     */
    update() {
        // ボタンの位置を常に更新（ターゲットが移動した場合に対応）
        if (this.rotationButton && this.targetMesh && !this.targetMesh.isDisposed()) {
            this.updateButtonPosition();
        }
    }

    /**
     * クリーンアップ
     */
    dispose() {
        this.hideRotationButton();
        
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
            this.advancedTexture = null;
        }
    }
}