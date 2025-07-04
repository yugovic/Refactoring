// js/ui/UIManager.js
/**
 * ユーザーインターフェースを管理するクラス
 */

import { ASSET_TYPES, BACKGROUND_360_SETTINGS } from '../config/constants.js';
import { color3ToHex } from '../utils/color-utils.js';
import { AnimationControls } from './animation-controls.js';

export class UIManager {
    constructor(app, errorHandler) {
        this.app = app;
        this.errorHandler = errorHandler;
        
        // DOM要素の参照
        this.elements = {};
        
        // UI状態
        this.controlsPanelVisible = true;
        this.helpPanelVisible = false;
        this.isVehicleFocused = false;  // 車両フォーカス状態フラグ
        
        // 位置インジケーター
        this.positionIndicator = null;
        
        // カメラ位置表示（1人称モード用）
        this.cameraPositionDisplay = null;
        
        // 1人称モードガイド
        this.firstPersonGuide = null;
        
        // アニメーションコントロール
        this.animationControls = null;
    }

    /**
     * UIを初期化
     */
    initialize() {
        try {
            // DOM要素を取得
            this.collectDOMElements();
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            // 初期値を設定
            this.setInitialValues();
            
            // アニメーションコントロールを初期化
            this.initializeAnimationControls();
            
            // 位置インジケーターを作成
            this.createPositionIndicator();
            
            // 1人称モードガイドを作成
            this.createFirstPersonGuide();
            
            // デバッグモードのキーボードショートカットを設定
            this.setupDebugShortcuts();
            
            console.log("UIManager initialized");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'UIManager.initialize');
        }
    }

    /**
     * DOM要素を収集
     */
    collectDOMElements() {
        // 車両関連ボタン
        this.elements.placeVehicleBtn = document.getElementById("placeVehicleBtn");
        this.elements.changeVehicleBtn = document.getElementById("changeVehicleBtn");
        
        // アセット配置ボタン
        this.elements.cubeBtn = document.getElementById("cubeBtn");
        this.elements.recordBtn = document.getElementById("recordBtn");
        this.elements.juiceBoxBtn = document.getElementById("juiceBoxBtn");
        this.elements.mikeDeskBtn = document.getElementById("mikeDeskBtn");
        this.elements.trophyBtn = document.getElementById("trophyBtn");
        
        // アクションボタン
        this.elements.rotateBtn = document.getElementById("rotateBtn");
        this.elements.deleteBtn = document.getElementById("deleteBtn");
        this.elements.firstPersonBtn = document.getElementById("firstPersonBtn");
        this.elements.exportImageBtn = document.getElementById("exportImageBtn");
        
        // コントロールパネル
        this.elements.toggleControlsBtn = document.getElementById("toggleControlsBtn");
        this.elements.toggleControlsIcon = document.querySelector(".toggle-icon");
        this.elements.controlsContent = document.querySelector(".controls-content");
        
        // グリッド設定
        this.elements.gridSizeSelect = document.getElementById("gridSizeSelect");
        this.elements.showGridCheck = document.getElementById("showGridCheck");
        this.elements.snapToGridCheck = document.getElementById("snapToGridCheck");
        
        // ズーム設定
        this.elements.zoomSlider = document.getElementById("zoomSlider");
        this.elements.zoomInBtn = document.getElementById("zoomInBtn");
        this.elements.zoomOutBtn = document.getElementById("zoomOutBtn");
        this.elements.resetZoomBtn = document.getElementById("resetZoomBtn");
        
        // ライティング設定
        this.elements.lighting = {
            ambientIntensity: document.getElementById("ambientIntensity"),
            directionalIntensity: document.getElementById("directionalIntensity"),
            pointLightIntensity: document.getElementById("pointLightIntensity"),
            shadowDarkness: document.getElementById("shadowDarkness"),
            ambientColor: document.getElementById("ambientColor"),
            pointLight1Color: document.getElementById("pointLight1Color"),
            pointLight2Color: document.getElementById("pointLight2Color"),
            dirLightX: document.getElementById("dirLightX"),
            dirLightY: document.getElementById("dirLightY"),
            dirLightZ: document.getElementById("dirLightZ"),
            pointLight1X: document.getElementById("pointLight1X"),
            pointLight1Y: document.getElementById("pointLight1Y"),
            pointLight1Z: document.getElementById("pointLight1Z"),
            pointLight2X: document.getElementById("pointLight2X"),
            pointLight2Y: document.getElementById("pointLight2Y"),
            pointLight2Z: document.getElementById("pointLight2Z"),
            reduceShininess: document.getElementById("reduceShininess")
        };
        
        // カメラデバッグパネル
        this.elements.camera = {
            alphaSlider: document.getElementById("cameraAlpha"),
            betaSlider: document.getElementById("cameraBeta"),
            radiusSlider: document.getElementById("cameraRadius"),
            targetXSlider: document.getElementById("cameraTargetX"),
            targetYSlider: document.getElementById("cameraTargetY"),
            targetZSlider: document.getElementById("cameraTargetZ"),
            infoDisplay: document.getElementById("cameraInfoDisplay"),
            resetBtn: document.getElementById("resetCameraBtn"),
            logBtn: document.getElementById("logCameraBtn")
        };
        
        // ヘルプパネル
        this.elements.helpBtn = document.getElementById("helpBtn");
        this.elements.helpPanel = document.querySelector(".help-panel");
        this.elements.helpCloseBtn = document.getElementById("helpCloseBtn");
        
        // アップロード機能
        this.elements.upload = {
            fileInput: document.getElementById("glbFileInput"),
            uploadBtn: document.getElementById("uploadBtn"),
            statusDiv: document.getElementById("uploadStatus"),
            assetsList: document.getElementById("uploadedAssetsList")
        };
        
        // アセットスケール調整
        this.elements.assetScale = {
            cubeSlider: document.getElementById("cubeScaleSlider"),
            cubeValue: document.getElementById("cubeScaleValue"),
            recordSlider: document.getElementById("recordScaleSlider"),
            recordValue: document.getElementById("recordScaleValue"),
            juiceBoxSlider: document.getElementById("juiceBoxScaleSlider"),
            juiceBoxValue: document.getElementById("juiceBoxScaleValue"),
            mikeDeskSlider: document.getElementById("mikeDeskScaleSlider"),
            mikeDeskValue: document.getElementById("mikeDeskScaleValue"),
            trophySlider: document.getElementById("trophyScaleSlider"),
            trophyValue: document.getElementById("trophyScaleValue")
        };
        
        // 選択アセットスケール調整
        this.elements.selectedScale = {
            section: document.getElementById("selectedAssetScale"),
            slider: document.getElementById("selectedAssetScaleSlider"),
            value: document.getElementById("selectedAssetScaleValue"),
            resetBtn: document.getElementById("resetScaleBtn"),
            halfBtn: document.getElementById("halfScaleBtn"),
            doubleBtn: document.getElementById("doubleScaleBtn")
        };
        
        // 車両スケール調整
        this.elements.vehicleScale = {
            slider: document.getElementById("vehicleScaleSlider"),
            value: document.getElementById("vehicleScaleValue")
        };
        
        // 音楽コントロール
        this.elements.music = {
            toggleBtn: document.getElementById("toggleMusicBtn"),
            volumeSlider: document.getElementById("volumeSlider"),
            volumeValue: document.getElementById("volumeValue")
        };
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // アセット配置ボタン
        this.setupAssetButtons();
        
        // アクションボタン
        this.setupActionButtons();
        
        // コントロールパネル
        this.setupControlPanel();
        
        // グリッド設定
        this.setupGridControls();
        
        // ズーム設定
        this.setupZoomControls();
        
        // ライティング設定
        this.setupLightingControls();
        
        // カメラデバッグパネル
        this.setupCameraDebugPanel();
        
        // ヘルプパネル
        this.setupHelpPanel();
        
        // アセットスケール調整
        this.setupAssetScaleControls();
        
        // 選択アセットスケール調整
        this.setupSelectedAssetScaleControls();
        
        // 車両スケール調整
        this.setupVehicleScaleControls();
        
        // 音楽コントロール
        this.setupMusicControls();
        
        // 車両フォーカスボタン
        this.setupVehicleFocusButton();
        
        // カテゴリー折りたたみ機能
        this.setupCategoryToggles();
    }

    /**
     * アセットボタンを設定
     */
    setupAssetButtons() {
        // 車両配置ボタン
        if (this.elements.placeVehicleBtn) {
            this.elements.placeVehicleBtn.addEventListener("click", () => {
                const vehicleManager = this.app.getManager('vehicle');
                if (vehicleManager.hasSelectedVehicle()) {
                    // すでに車両配置モードの場合は何もしない
                    const interactionManager = this.app.getManager('interaction');
                    if (interactionManager.getCurrentMode() !== 'vehicle') {
                        this.resetAssetButtons();
                        this.elements.placeVehicleBtn.classList.add("active");
                        interactionManager.setVehiclePlacementMode();
                    }
                } else {
                    alert('車両を読み込み中です。しばらくお待ちください。');
                }
            });
        }
        
        // 車両変更ボタン
        if (this.elements.changeVehicleBtn) {
            this.elements.changeVehicleBtn.addEventListener("click", () => {
                const vehicleManager = this.app.getManager('vehicle');
                vehicleManager.showModal();
            });
        }
        
        // ビジュアルグリッドのアセットアイテム
        const assetItems = document.querySelectorAll('.asset-item');
        assetItems.forEach(item => {
            item.addEventListener('click', () => {
                const assetType = item.dataset.assetType;
                const assetFile = item.dataset.assetFile;
                
                // 全てのアイテムの選択状態をリセット
                assetItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                if (assetType === 'facility' && assetFile) {
                    // ファシリティアセットの場合
                    console.log(`=== ファシリティアセット選択: ${assetFile} ===`);
                    this.resetAssetButtons();
                    const interactionManager = this.app.getManager('interaction');
                    interactionManager.setFacilityPlacementMode(assetFile);
                } else {
                    // 既存アセットの場合
                    const typeMap = {
                        'cube': ASSET_TYPES.CUBE,
                        'record': ASSET_TYPES.RECORD_MACHINE,
                        'juiceBox': ASSET_TYPES.JUICE_BOX,
                        'mikeDesk': ASSET_TYPES.MIKE_DESK,
                        'trophy': ASSET_TYPES.TROPHY
                    };
                    
                    const mappedType = typeMap[assetType];
                    if (mappedType) {
                        console.log(`=== アセット選択: ${mappedType} ===`);
                        this.resetAssetButtons();
                        // 対応する隠しボタンをクリック
                        const buttonMap = {
                            'cube': this.elements.cubeBtn,
                            'record': this.elements.recordBtn,
                            'juiceBox': this.elements.juiceBoxBtn,
                            'mikeDesk': this.elements.mikeDeskBtn,
                            'trophy': this.elements.trophyBtn
                        };
                        const button = buttonMap[assetType];
                        if (button) {
                            button.classList.add("active");
                        }
                        this.app.getManager('interaction').setPlacementMode(mappedType);
                    }
                }
            });
        });
        
        // 既存のボタンイベント（互換性のため残す）
        const buttons = [
            { element: this.elements.cubeBtn, type: ASSET_TYPES.CUBE },
            { element: this.elements.recordBtn, type: ASSET_TYPES.RECORD_MACHINE },
            { element: this.elements.juiceBoxBtn, type: ASSET_TYPES.JUICE_BOX },
            { element: this.elements.mikeDeskBtn, type: ASSET_TYPES.MIKE_DESK },
            { element: this.elements.trophyBtn, type: ASSET_TYPES.TROPHY }
        ];
        
        buttons.forEach(({ element, type }) => {
            if (element) {
                element.addEventListener("click", () => {
                    console.log(`=== アセットボタンクリック: ${type} ===`);
                    this.resetAssetButtons();
                    element.classList.add("active");
                    console.log("InteractionManagerの取得:", this.app.getManager('interaction'));
                    this.app.getManager('interaction').setPlacementMode(type);
                    console.log(`配置モード設定完了: ${type}`);
                });
            }
        });
    }

    /**
     * アクションボタンを設定
     */
    setupActionButtons() {
        // 回転ボタン
        if (this.elements.rotateBtn) {
            this.elements.rotateBtn.addEventListener("click", () => {
                this.app.getManager('selection').rotateSelectedMesh();
            });
        }
        
        // 削除ボタン
        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.addEventListener("click", () => {
                this.app.getManager('selection').deleteSelectedMesh();
            });
        }
        
        // 1人称モードボタン
        if (this.elements.firstPersonBtn) {
            this.elements.firstPersonBtn.addEventListener("click", () => {
                this.toggleFirstPersonMode();
            });
        }
        
        // 画像エクスポートボタン
        if (this.elements.exportImageBtn) {
            this.elements.exportImageBtn.addEventListener("click", () => {
                this.exportImage();
            });
        }
    }

    /**
     * コントロールパネルを設定
     */
    setupControlPanel() {
        if (this.elements.toggleControlsBtn) {
            this.elements.toggleControlsBtn.addEventListener("click", () => {
                this.toggleControlsPanel();
            });
        }
    }

    /**
     * グリッドコントロールを設定
     */
    setupGridControls() {
        const gridSystem = this.app.getManager('grid');
        
        if (this.elements.gridSizeSelect) {
            this.elements.gridSizeSelect.addEventListener("change", (e) => {
                gridSystem.setGridSize(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.showGridCheck) {
            this.elements.showGridCheck.addEventListener("change", (e) => {
                gridSystem.setShowGrid(e.target.checked);
            });
        }
        
        if (this.elements.snapToGridCheck) {
            this.elements.snapToGridCheck.addEventListener("change", (e) => {
                gridSystem.setSnapToGrid(e.target.checked);
            });
        }
        
        // バウンディングボックス表示
        const boundingBoxCheck = document.getElementById('showBoundingBoxCheck');
        if (boundingBoxCheck) {
            boundingBoxCheck.addEventListener("change", (e) => {
                const boundingBoxDebug = this.app.getManager('boundingBoxDebug');
                if (boundingBoxDebug) {
                    boundingBoxDebug.setEnabled(e.target.checked);
                }
            });
        }
    }

    /**
     * ズームコントロールを設定
     */
    setupZoomControls() {
        const cameraManager = this.app.getManager('camera');
        
        if (this.elements.zoomSlider) {
            this.elements.zoomSlider.addEventListener("input", (e) => {
                cameraManager.setZoomLevel(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener("click", () => {
                const currentZoom = parseFloat(this.elements.zoomSlider.value);
                const newZoom = Math.min(currentZoom + 0.1, 2.0);
                this.elements.zoomSlider.value = newZoom;
                cameraManager.setZoomLevel(newZoom);
            });
        }
        
        if (this.elements.zoomOutBtn) {
            this.elements.zoomOutBtn.addEventListener("click", () => {
                const currentZoom = parseFloat(this.elements.zoomSlider.value);
                const newZoom = Math.max(currentZoom - 0.1, 0.5);
                this.elements.zoomSlider.value = newZoom;
                cameraManager.setZoomLevel(newZoom);
            });
        }
        
        if (this.elements.resetZoomBtn) {
            this.elements.resetZoomBtn.addEventListener("click", () => {
                this.elements.zoomSlider.value = 1.0;
                cameraManager.setZoomLevel(1.0);
            });
        }
    }

    /**
     * ライティングコントロールを設定
     */
    setupLightingControls() {
        const lightingSystem = this.app.getManager('lighting');
        
        // 強度スライダー
        const intensityControls = [
            { element: this.elements.lighting.ambientIntensity, type: 'ambient', property: 'intensity' },
            { element: this.elements.lighting.directionalIntensity, type: 'directional', property: 'intensity' },
            { element: this.elements.lighting.pointLightIntensity, type: 'pointLight1', property: 'intensity' },
            { element: this.elements.lighting.shadowDarkness, type: 'shadow', property: 'darkness' }
        ];
        
        intensityControls.forEach(({ element, type, property }) => {
            if (element) {
                element.addEventListener("input", (e) => {
                    let value = parseFloat(e.target.value);
                    
                    lightingSystem.updateSetting(type, property, value);
                    
                    // ポイントライト2も同時に更新
                    if (type === 'pointLight1' && property === 'intensity') {
                        lightingSystem.updateSetting('pointLight2', property, parseFloat(e.target.value));
                    }
                });
            }
        });
        
        // カラーピッカー
        const colorControls = [
            { element: this.elements.lighting.ambientColor, type: 'ambient', property: 'color' },
            { element: this.elements.lighting.pointLight1Color, type: 'pointLight1', property: 'color' },
            { element: this.elements.lighting.pointLight2Color, type: 'pointLight2', property: 'color' }
        ];
        
        colorControls.forEach(({ element, type, property }) => {
            if (element) {
                element.addEventListener("input", (e) => {
                    lightingSystem.updateSetting(type, property, e.target.value);
                });
            }
        });
        
        // 光源位置スライダー
        this.setupLightPositionControls();
        
        // メタリック効果チェックボックス
        if (this.elements.lighting.reduceShininess) {
            this.elements.lighting.reduceShininess.addEventListener("change", (e) => {
                lightingSystem.adjustMaterialShininess(e.target.checked);
            });
        }
    }

    /**
     * 光源位置コントロールを設定
     */
    setupLightPositionControls() {
        const lightingSystem = this.app.getManager('lighting');
        
        // 方向光の位置
        ['X', 'Y', 'Z'].forEach(axis => {
            const element = this.elements.lighting[`dirLight${axis}`];
            if (element) {
                element.addEventListener("input", () => {
                    const position = {
                        x: parseFloat(this.elements.lighting.dirLightX.value),
                        y: parseFloat(this.elements.lighting.dirLightY.value),
                        z: parseFloat(this.elements.lighting.dirLightZ.value)
                    };
                    lightingSystem.updateSetting('directional', 'position', position);
                });
            }
        });
        
        // ポイントライトの位置
        [1, 2].forEach(lightNum => {
            ['X', 'Y', 'Z'].forEach(axis => {
                const element = this.elements.lighting[`pointLight${lightNum}${axis}`];
                if (element) {
                    element.addEventListener("input", () => {
                        const position = {
                            x: parseFloat(this.elements.lighting[`pointLight${lightNum}X`].value),
                            y: parseFloat(this.elements.lighting[`pointLight${lightNum}Y`].value),
                            z: parseFloat(this.elements.lighting[`pointLight${lightNum}Z`].value)
                        };
                        lightingSystem.updateSetting(`pointLight${lightNum}`, 'position', position);
                    });
                }
            });
        });
    }

    /**
     * カメラデバッグパネルを設定
     */
    setupCameraDebugPanel() {
        const cameraManager = this.app.getManager('camera');
        
        // カメラ角度と位置の調整
        const cameraControls = [
            { element: this.elements.camera.alphaSlider, property: 'alpha' },
            { element: this.elements.camera.betaSlider, property: 'beta' },
            { element: this.elements.camera.radiusSlider, property: 'radius' }
        ];
        
        cameraControls.forEach(({ element, property }) => {
            if (element) {
                element.addEventListener("input", () => {
                    const camera = cameraManager.getActiveCamera();
                    if (camera && camera[property] !== undefined) {
                        camera[property] = parseFloat(element.value);
                        this.updateCameraInfo();
                    }
                });
            }
        });
        
        // カメラターゲット位置
        ['X', 'Y', 'Z'].forEach(axis => {
            const element = this.elements.camera[`target${axis}Slider`];
            if (element) {
                element.addEventListener("input", () => {
                    const camera = cameraManager.getActiveCamera();
                    if (camera && camera.target) {
                        const target = new BABYLON.Vector3(
                            parseFloat(this.elements.camera.targetXSlider.value),
                            parseFloat(this.elements.camera.targetYSlider.value),
                            parseFloat(this.elements.camera.targetZSlider.value)
                        );
                        camera.target = target;
                        this.updateCameraInfo();
                    }
                });
            }
        });
        
        // フォーカス開始距離スライダー
        const focusStartRadiusSlider = document.getElementById('focusStartRadius');
        const focusStartRadiusValue = document.getElementById('focusStartRadiusValue');
        if (focusStartRadiusSlider && focusStartRadiusValue) {
            this.focusStartRadius = 20; // デフォルト値
            focusStartRadiusSlider.addEventListener('input', (e) => {
                this.focusStartRadius = parseInt(e.target.value);
                focusStartRadiusValue.textContent = this.focusStartRadius;
                console.log('Focus start radius changed to:', this.focusStartRadius);
            });
        }
        
        // リセットボタン
        if (this.elements.camera.resetBtn) {
            this.elements.camera.resetBtn.addEventListener("click", () => {
                cameraManager.resetCamera();
                this.updateCameraDebugControls();
            });
        }
        
        // ログボタン
        if (this.elements.camera.logBtn) {
            this.elements.camera.logBtn.addEventListener("click", () => {
                this.logCameraSettings();
            });
        }
        
        // カメラ変更時の更新
        const camera = cameraManager.getActiveCamera();
        if (camera) {
            camera.onViewMatrixChangedObservable.add(() => {
                this.updateCameraInfo();
            });
        }
    }

    /**
     * ヘルプパネルを設定
     */
    setupHelpPanel() {
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener("click", () => {
                this.showHelpPanel();
            });
        }
        
        if (this.elements.helpCloseBtn) {
            this.elements.helpCloseBtn.addEventListener("click", () => {
                this.hideHelpPanel();
            });
        }
    }

    /**
     * アセットスケール調整コントロールを設定
     */
    setupAssetScaleControls() {
        const assetPlacer = this.app.getManager('assetPlacer');
        
        // バーガー
        if (this.elements.assetScale.cubeSlider) {
            this.elements.assetScale.cubeSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.assetScale.cubeValue.textContent = `${Math.round(scale * 100)}%`;
                assetPlacer.updateAssetTypeScale(ASSET_TYPES.CUBE, scale);
                assetPlacer.saveScaleSettings(); // 自動保存
            });
        }
        
        // レコードマシン
        if (this.elements.assetScale.recordSlider) {
            this.elements.assetScale.recordSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.assetScale.recordValue.textContent = `${Math.round(scale * 100)}%`;
                assetPlacer.updateAssetTypeScale(ASSET_TYPES.RECORD_MACHINE, scale);
                assetPlacer.saveScaleSettings(); // 自動保存
            });
        }
        
        // ジュースボックス
        if (this.elements.assetScale.juiceBoxSlider) {
            this.elements.assetScale.juiceBoxSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.assetScale.juiceBoxValue.textContent = `${Math.round(scale * 100)}%`;
                assetPlacer.updateAssetTypeScale(ASSET_TYPES.JUICE_BOX, scale);
                assetPlacer.saveScaleSettings(); // 自動保存
            });
        }
        
        // マイクデスク
        if (this.elements.assetScale.mikeDeskSlider) {
            this.elements.assetScale.mikeDeskSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.assetScale.mikeDeskValue.textContent = `${Math.round(scale * 100)}%`;
                assetPlacer.updateAssetTypeScale(ASSET_TYPES.MIKE_DESK, scale);
                assetPlacer.saveScaleSettings(); // 自動保存
            });
        }
        
        // トロフィー
        if (this.elements.assetScale.trophySlider) {
            this.elements.assetScale.trophySlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.assetScale.trophyValue.textContent = `${Math.round(scale * 100)}%`;
                assetPlacer.updateAssetTypeScale(ASSET_TYPES.TROPHY, scale);
                assetPlacer.saveScaleSettings(); // 自動保存
            });
        }
    }

    /**
     * 選択アセットスケール調整コントロールを設定
     */
    setupSelectedAssetScaleControls() {
        const assetPlacer = this.app.getManager('assetPlacer');
        const selectionController = this.app.getManager('selection');
        
        // スライダー
        if (this.elements.selectedScale.slider) {
            this.elements.selectedScale.slider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.selectedScale.value.textContent = `${Math.round(scale * 100)}%`;
                
                const selectedMesh = selectionController.getSelectedMesh();
                if (selectedMesh) {
                    assetPlacer.updateMeshScale(selectedMesh, scale);
                }
            });
        }
        
        // リセットボタン
        if (this.elements.selectedScale.resetBtn) {
            this.elements.selectedScale.resetBtn.addEventListener('click', () => {
                const selectedMesh = selectionController.getSelectedMesh();
                if (selectedMesh) {
                    this.elements.selectedScale.slider.value = 0.1;
                    this.elements.selectedScale.value.textContent = '10%';
                    assetPlacer.updateMeshScale(selectedMesh, 0.1);
                }
            });
        }
        
        // 50%ボタン
        if (this.elements.selectedScale.halfBtn) {
            this.elements.selectedScale.halfBtn.addEventListener('click', () => {
                const selectedMesh = selectionController.getSelectedMesh();
                if (selectedMesh) {
                    this.elements.selectedScale.slider.value = 0.5;
                    this.elements.selectedScale.value.textContent = '50%';
                    assetPlacer.updateMeshScale(selectedMesh, 0.5);
                }
            });
        }
        
        // 200%ボタン
        if (this.elements.selectedScale.doubleBtn) {
            this.elements.selectedScale.doubleBtn.addEventListener('click', () => {
                const selectedMesh = selectionController.getSelectedMesh();
                if (selectedMesh) {
                    this.elements.selectedScale.slider.value = 1.0;
                    this.elements.selectedScale.value.textContent = '100%';
                    assetPlacer.updateMeshScale(selectedMesh, 1.0);
                }
            });
        }
    }

    /**
     * 選択アセットのスケール調整UIを表示
     * @param {BABYLON.Mesh} mesh - 選択されたメッシュ
     */
    showSelectedAssetScaleUI(mesh) {
        if (this.elements.selectedScale.section && mesh && mesh.metadata && mesh.metadata.isAsset) {
            this.elements.selectedScale.section.style.display = 'block';
            
            // 現在のスケールを取得してスライダーに反映
            const currentScale = mesh.scaling.x; // x, y, z は同じと仮定
            this.elements.selectedScale.slider.value = currentScale;
            this.elements.selectedScale.value.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }

    /**
     * 選択アセットのスケール調整UIを非表示
     */
    hideSelectedAssetScaleUI() {
        if (this.elements.selectedScale.section) {
            this.elements.selectedScale.section.style.display = 'none';
        }
    }
    
    /**
     * 車両スケール調整コントロールを設定
     */
    setupVehicleScaleControls() {
        const vehicleManager = this.app.getManager('vehicle');
        
        if (this.elements.vehicleScale.slider) {
            this.elements.vehicleScale.slider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                this.elements.vehicleScale.value.textContent = `${Math.round(scale * 100)}%`;
                vehicleManager.setVehicleScale(scale);
            });
        }
    }
    
    /**
     * 音楽コントロールを設定
     */
    setupMusicControls() {
        if (this.elements.music.toggleBtn) {
            this.elements.music.toggleBtn.addEventListener('click', () => {
                const audioManager = this.app.getManager('audio');
                if (!audioManager) {
                    console.error('AudioManager not available');
                    return;
                }
                const isPlaying = audioManager.toggleBackgroundMusic();
                this.elements.music.toggleBtn.textContent = isPlaying ? '⏸️ 音楽を停止' : '🎵 音楽を再生';
            });
        }
        
        if (this.elements.music.volumeSlider) {
            this.elements.music.volumeSlider.addEventListener('input', (e) => {
                const audioManager = this.app.getManager('audio');
                if (!audioManager) {
                    console.error('AudioManager not available');
                    return;
                }
                const volume = parseFloat(e.target.value);
                audioManager.setVolume(volume);
                this.elements.music.volumeValue.textContent = `${Math.round(volume * 100)}%`;
            });
        }
    }
    
    /**
     * スケールスライダーの値を復元された設定で更新
     * @param {Object} defaultScales - デフォルトスケール設定
     */
    updateScaleSliders(defaultScales) {
        // バーガースライダーを更新
        if (this.elements.assetScale.cubeSlider && defaultScales[ASSET_TYPES.CUBE] !== undefined) {
            this.elements.assetScale.cubeSlider.value = defaultScales[ASSET_TYPES.CUBE];
            this.elements.assetScale.cubeValue.textContent = `${Math.round(defaultScales[ASSET_TYPES.CUBE] * 100)}%`;
        }
        
        // レコードマシンスライダーを更新
        if (this.elements.assetScale.recordSlider && defaultScales[ASSET_TYPES.RECORD_MACHINE] !== undefined) {
            this.elements.assetScale.recordSlider.value = defaultScales[ASSET_TYPES.RECORD_MACHINE];
            this.elements.assetScale.recordValue.textContent = `${Math.round(defaultScales[ASSET_TYPES.RECORD_MACHINE] * 100)}%`;
        }
        
        // ジュースボックススライダーを更新
        if (this.elements.assetScale.juiceBoxSlider && defaultScales[ASSET_TYPES.JUICE_BOX] !== undefined) {
            this.elements.assetScale.juiceBoxSlider.value = defaultScales[ASSET_TYPES.JUICE_BOX];
            this.elements.assetScale.juiceBoxValue.textContent = `${Math.round(defaultScales[ASSET_TYPES.JUICE_BOX] * 100)}%`;
        }
        
        // マイクデスクスライダーを更新
        if (this.elements.assetScale.mikeDeskSlider && defaultScales[ASSET_TYPES.MIKE_DESK] !== undefined) {
            this.elements.assetScale.mikeDeskSlider.value = defaultScales[ASSET_TYPES.MIKE_DESK];
            this.elements.assetScale.mikeDeskValue.textContent = `${Math.round(defaultScales[ASSET_TYPES.MIKE_DESK] * 100)}%`;
        }
        
        // トロフィースライダーを更新
        if (this.elements.assetScale.trophySlider && defaultScales[ASSET_TYPES.TROPHY] !== undefined) {
            this.elements.assetScale.trophySlider.value = defaultScales[ASSET_TYPES.TROPHY];
            this.elements.assetScale.trophyValue.textContent = `${Math.round(defaultScales[ASSET_TYPES.TROPHY] * 100)}%`;
        }
        
        console.log('スケールスライダーを更新しました:', defaultScales);
    }

    /**
     * 初期値を設定
     */
    setInitialValues() {
        // グリッド設定
        const gridSettings = this.app.getManager('grid').getSettings();
        if (this.elements.gridSizeSelect) {
            this.elements.gridSizeSelect.value = gridSettings.size;
        }
        if (this.elements.showGridCheck) {
            this.elements.showGridCheck.checked = gridSettings.show;
        }
        if (this.elements.snapToGridCheck) {
            this.elements.snapToGridCheck.checked = gridSettings.snapToGrid;
        }
        
        // ライティング設定
        const lightingSettings = this.app.getManager('lighting').getSettings();
        if (this.elements.lighting.ambientIntensity) {
            this.elements.lighting.ambientIntensity.value = lightingSettings.ambient.intensity;
        }
        if (this.elements.lighting.ambientColor) {
            this.elements.lighting.ambientColor.value = lightingSettings.ambient.color;
        }
        
        // カメラ設定
        this.updateCameraDebugControls();
        
        // 音楽設定
        if (this.elements.music.volumeSlider) {
            this.elements.music.volumeSlider.value = 0.1;
        }
        if (this.elements.music.volumeValue) {
            this.elements.music.volumeValue.textContent = '10%';
        }
    }

    /**
     * アセットボタンをリセット
     */
    resetAssetButtons() {
        // 車両ボタンをリセット
        if (this.elements.placeVehicleBtn) {
            this.elements.placeVehicleBtn.classList.remove("active");
        }
        
        // アセットボタンをリセット
        [this.elements.cubeBtn, this.elements.recordBtn, 
         this.elements.juiceBoxBtn, this.elements.mikeDeskBtn].forEach(btn => {
            if (btn) btn.classList.remove("active");
        });
        
        // アップロードアセットボタンもリセット
        document.querySelectorAll('.uploaded-asset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    /**
     * コントロールパネルの表示を切り替え
     */
    toggleControlsPanel() {
        this.controlsPanelVisible = !this.controlsPanelVisible;
        
        if (this.elements.controlsContent) {
            this.elements.controlsContent.style.display = 
                this.controlsPanelVisible ? "block" : "none";
        }
        
        if (this.elements.toggleControlsIcon) {
            this.elements.toggleControlsIcon.textContent = 
                this.controlsPanelVisible ? "−" : "+";
        }
    }

    /**
     * 1人称モードを切り替え
     */
    toggleFirstPersonMode() {
        const cameraManager = this.app.getManager('camera');
        const currentMode = cameraManager.getCurrentMode();
        
        if (currentMode === 'firstPerson') {
            // 通常モードに戻る
            cameraManager.switchCameraMode('isometric');
            this.elements.firstPersonBtn.classList.remove("active");
            this.elements.firstPersonBtn.textContent = "1人称モード";
            this.hideFirstPersonUI();
            this.enablePlacementControls();
        } else {
            // 1人称モードに切り替え
            cameraManager.switchCameraMode('firstPerson');
            this.elements.firstPersonBtn.classList.add("active");
            this.elements.firstPersonBtn.textContent = "通常モード";
            this.showFirstPersonUI();
            this.disablePlacementControls();
        }
    }

    /**
     * 1人称モードUIを表示
     */
    showFirstPersonUI() {
        if (this.firstPersonGuide) {
            this.firstPersonGuide.style.display = "block";
        }
        
        if (!this.cameraPositionDisplay) {
            this.createCameraPositionDisplay();
        }
        this.cameraPositionDisplay.style.display = "block";
        
        // カメラ位置更新を開始
        this.startCameraPositionUpdate();
    }

    /**
     * 1人称モードUIを非表示
     */
    hideFirstPersonUI() {
        if (this.firstPersonGuide) {
            this.firstPersonGuide.style.display = "none";
        }
        
        if (this.cameraPositionDisplay) {
            this.cameraPositionDisplay.style.display = "none";
        }
        
        // カメラ位置更新を停止
        this.stopCameraPositionUpdate();
    }

    /**
     * 配置コントロールを無効化
     */
    disablePlacementControls() {
        const buttons = [
            this.elements.cubeBtn, this.elements.recordBtn,
            this.elements.juiceBoxBtn, this.elements.mikeDeskBtn,
            this.elements.rotateBtn, this.elements.deleteBtn,
            this.elements.exportImageBtn
        ];
        
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }
        });
        
        // グリッドコントロールも無効化
        if (this.elements.gridSizeSelect) this.elements.gridSizeSelect.disabled = true;
        if (this.elements.showGridCheck) this.elements.showGridCheck.disabled = true;
        if (this.elements.snapToGridCheck) this.elements.snapToGridCheck.disabled = true;
    }

    /**
     * 配置コントロールを有効化
     */
    enablePlacementControls() {
        const buttons = [
            this.elements.cubeBtn, this.elements.recordBtn,
            this.elements.juiceBoxBtn, this.elements.mikeDeskBtn,
            this.elements.rotateBtn, this.elements.deleteBtn,
            this.elements.exportImageBtn
        ];
        
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
        });
        
        // グリッドコントロールも有効化
        if (this.elements.gridSizeSelect) this.elements.gridSizeSelect.disabled = false;
        if (this.elements.showGridCheck) this.elements.showGridCheck.disabled = false;
        if (this.elements.snapToGridCheck) this.elements.snapToGridCheck.disabled = false;
    }

    /**
     * 画像をエクスポート
     */
    async exportImage() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15);
            const filename = `3d_room_${timestamp}.png`;
            
            const dataUrl = await this.app.takeScreenshot({ scaling: 0.5 });
            
            // ダウンロードリンクを作成
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log("Image exported:", filename);
            
        } catch (error) {
            this.errorHandler.showError("画像の書き出しに失敗しました: " + error.message);
        }
    }

    /**
     * ヘルプパネルを表示
     */
    showHelpPanel() {
        if (this.elements.helpPanel) {
            this.elements.helpPanel.style.display = "block";
            this.helpPanelVisible = true;
        }
    }

    /**
     * ヘルプパネルを非表示
     */
    hideHelpPanel() {
        if (this.elements.helpPanel) {
            this.elements.helpPanel.style.display = "none";
            this.helpPanelVisible = false;
        }
    }

    /**
     * カメラ情報を更新
     */
    updateCameraInfo() {
        const cameraManager = this.app.getManager('camera');
        const settings = cameraManager.getCameraSettings();
        
        if (!settings || !this.elements.camera.infoDisplay) return;
        
        this.elements.camera.infoDisplay.textContent = 
            `α: ${settings.alpha.toFixed(2)}, β: ${settings.beta.toFixed(2)}, r: ${settings.radius.toFixed(2)}\n` +
            `Target: (${settings.target.x.toFixed(2)}, ${settings.target.y.toFixed(2)}, ${settings.target.z.toFixed(2)})\n` +
            `Pos: (${settings.position.x.toFixed(2)}, ${settings.position.y.toFixed(2)}, ${settings.position.z.toFixed(2)})`;
    }

    /**
     * カメラデバッグコントロールを更新
     */
    updateCameraDebugControls() {
        const cameraManager = this.app.getManager('camera');
        const camera = cameraManager.getActiveCamera();
        
        if (!camera) return;
        
        if (this.elements.camera.alphaSlider) {
            this.elements.camera.alphaSlider.value = camera.alpha;
        }
        if (this.elements.camera.betaSlider) {
            this.elements.camera.betaSlider.value = camera.beta;
        }
        if (this.elements.camera.radiusSlider) {
            this.elements.camera.radiusSlider.value = camera.radius;
        }
        
        if (camera.target) {
            if (this.elements.camera.targetXSlider) {
                this.elements.camera.targetXSlider.value = camera.target.x;
            }
            if (this.elements.camera.targetYSlider) {
                this.elements.camera.targetYSlider.value = camera.target.y;
            }
            if (this.elements.camera.targetZSlider) {
                this.elements.camera.targetZSlider.value = camera.target.z;
            }
        }
        
        this.updateCameraInfo();
    }

    /**
     * カメラ設定をログ出力
     */
    logCameraSettings() {
        const cameraManager = this.app.getManager('camera');
        const settings = cameraManager.getCameraSettings();
        
        if (!settings) return;
        
        console.log("現在のカメラ設定:", settings);
        
        const codeExample = `// カメラ設定
const cameraSettings = {
    alpha: ${settings.alpha.toFixed(4)},
    beta: ${settings.beta.toFixed(4)},
    radius: ${settings.radius.toFixed(4)},
    target: new BABYLON.Vector3(${settings.target.x.toFixed(4)}, ${settings.target.y.toFixed(4)}, ${settings.target.z.toFixed(4)})
};`;
        
        console.log("コード例:");
        console.log(codeExample);
        
        alert("カメラ設定をコンソールに出力しました。F12キーを押してコンソールを確認してください。");
    }

    /**
     * 位置インジケーターを作成
     */
    createPositionIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "position-indicator";
        indicator.style.display = "none";
        document.body.appendChild(indicator);
        
        this.positionIndicator = indicator;
    }

    /**
     * 位置インジケーターを更新
     * @param {BABYLON.Vector3} position - 位置
     * @param {string} additionalInfo - 追加情報
     */
    updatePositionIndicator(position, additionalInfo = "") {
        if (!this.positionIndicator) return;
        
        this.positionIndicator.style.display = "block";
        this.positionIndicator.textContent = 
            `位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
        
        if (additionalInfo) {
            this.positionIndicator.textContent += `\n${additionalInfo}`;
        }
    }

    /**
     * 位置インジケーターを非表示
     */
    hidePositionIndicator() {
        if (this.positionIndicator) {
            this.positionIndicator.style.display = "none";
        }
    }

    /**
     * 1人称モードガイドを作成
     */
    createFirstPersonGuide() {
        const guide = document.createElement("div");
        guide.className = "first-person-guide";
        guide.innerHTML = `
            <h4>1人称モード操作方法</h4>
            <ul>
                <li><strong>W</strong>: カメラの向いている方向へ前進（水平移動）</li>
                <li><strong>S</strong>: カメラの向いている方向から後退（水平移動）</li>
                <li><strong>A</strong>: カメラから見て左方向へ移動（水平移動）</li>
                <li><strong>D</strong>: カメラから見て右方向へ移動（水平移動）</li>
                <li><strong>Space</strong>: 上昇</li>
                <li><strong>C</strong>: 下降</li>
                <li><strong>マウス</strong>: 視点変更（水平移動方向に影響）</li>
                <li><strong>Shift</strong>: 高速移動</li>
                <li><strong>Ctrl</strong>: 低速移動</li>
            </ul>
        `;
        guide.style.display = "none";
        document.body.appendChild(guide);
        
        this.firstPersonGuide = guide;
    }

    /**
     * 車両フォーカスボタンを設定
     */
    setupVehicleFocusButton() {
        const focusBtn = document.getElementById('focusVehicleBtn');
        if (focusBtn) {
            // 初期状態で無効化
            focusBtn.disabled = true;
            focusBtn.style.opacity = '0.5';
            focusBtn.style.cursor = 'not-allowed';
            
            focusBtn.addEventListener('click', () => {
                this.focusOnVehicle();
            });
        }
    }

    /**
     * 車両配置ボタンをアクティブにする
     */
    activateVehiclePlacementButton() {
        this.resetAssetButtons();
        if (this.elements.placeVehicleBtn) {
            this.elements.placeVehicleBtn.classList.add("active");
        }
    }

    /**
     * 配置済み車両にカメラをフォーカス
     */
    focusOnVehicle() {
        const vehicleManager = this.app.getManager('vehicle');
        const cameraManager = this.app.getManager('camera');
        
        if (!vehicleManager || !cameraManager) {
            console.error('VehicleManager or CameraManager not available');
            return;
        }
        
        const placedVehicle = vehicleManager.getPlacedVehicle();
        if (!placedVehicle) {
            this.app.getErrorHandler().showError('車両が配置されていません。先に車両を配置してください。');
            return;
        }
        
        // 既にフォーカス状態の場合は元に戻る
        if (this.isVehicleFocused) {
            this.returnToDefaultCamera();
            return;
        }
        
        // カメラをフォーカス（オルソグラフィックモードでズームイン）
        cameraManager.focusOnMesh(placedVehicle, {
            duration: 1.8,
            radiusMultiplier: 15,  // 大きめの倍率にして、minRadiusで制限
            minRadius: 5,          // 固定距離5まで近づく（かなり近い）
            keepOrthographic: true,  // オルソグラフィックモードを維持
            ease: "power2.inOut",
            onComplete: () => {
                console.log('Vehicle focus completed');
                // フォーカス状態フラグを設定
                this.isVehicleFocused = true;
                // 元に戻るボタンを表示
                this.showReturnToCameraButton();
            }
        });
    }

    /**
     * カテゴリー折りたたみ機能を設定
     */
    setupCategoryToggles() {
        // メインカテゴリー
        const mainHeader = document.getElementById('mainCategoryHeader');
        const mainGrid = document.getElementById('mainAssetGrid');
        
        if (mainHeader && mainGrid) {
            mainHeader.addEventListener('click', () => {
                mainHeader.classList.toggle('collapsed');
                mainGrid.classList.toggle('collapsed');
                
                // トグルアイコンの更新
                const toggle = mainHeader.querySelector('.category-toggle');
                if (toggle) {
                    toggle.textContent = mainHeader.classList.contains('collapsed') ? '+' : '−';
                }
            });
        }
        
        // ファシリティカテゴリー
        const facilityHeader = document.getElementById('facilityCategoryHeader');
        const facilityGrid = document.getElementById('facilityAssetGrid');
        
        if (facilityHeader && facilityGrid) {
            facilityHeader.addEventListener('click', () => {
                facilityHeader.classList.toggle('collapsed');
                facilityGrid.classList.toggle('collapsed');
                
                // トグルアイコンの更新
                const toggle = facilityHeader.querySelector('.category-toggle');
                if (toggle) {
                    toggle.textContent = facilityHeader.classList.contains('collapsed') ? '+' : '−';
                }
            });
        }
    }

    /**
     * カメラ位置表示を作成
     */
    createCameraPositionDisplay() {
        const display = document.createElement("div");
        display.id = "cameraPositionDisplay";
        display.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(display);
        
        this.cameraPositionDisplay = display;
    }

    /**
     * カメラ位置更新を開始
     */
    startCameraPositionUpdate() {
        this.cameraUpdateInterval = setInterval(() => {
            this.updateCameraPositionDisplay();
        }, 100);
    }

    /**
     * カメラ位置更新を停止
     */
    stopCameraPositionUpdate() {
        if (this.cameraUpdateInterval) {
            clearInterval(this.cameraUpdateInterval);
            this.cameraUpdateInterval = null;
        }
    }

    /**
     * カメラ位置表示を更新
     */
    updateCameraPositionDisplay() {
        if (!this.cameraPositionDisplay) return;
        
        const cameraManager = this.app.getManager('camera');
        const camera = cameraManager.getActiveCamera();
        
        if (!camera || cameraManager.getCurrentMode() !== 'firstPerson') return;
        
        const position = camera.position;
        const rotation = camera.rotation;
        const direction = camera.getDirection(BABYLON.Vector3.Forward());
        
        this.cameraPositionDisplay.innerHTML = `
            <div><strong>カメラ位置情報:</strong></div>
            <div>位置: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}, Z=${position.z.toFixed(2)}</div>
            <div>回転: X=${rotation.x.toFixed(2)}, Y=${rotation.y.toFixed(2)}, Z=${rotation.z.toFixed(2)}</div>
            <div>方向: X=${direction.x.toFixed(2)}, Y=${direction.y.toFixed(2)}, Z=${direction.z.toFixed(2)}</div>
        `;
    }

    /**
     * UIを有効化（1人称モード解除時）
     */
    enableUI() {
        this.enablePlacementControls();
    }

    /**
     * UIを無効化（1人称モード時）
     */
    disableUI() {
        this.disablePlacementControls();
        
        // 配置モードを終了
        this.app.getManager('interaction').exitPlacementMode();
        this.resetAssetButtons();
        
        // 選択を解除
        this.app.getManager('selection').deselectAll();
    }


    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing UIManager...");
        
        // インターバルを停止
        this.stopCameraPositionUpdate();
        
        // イベントリスナーを削除
        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.replaceWith(this.elements.deleteBtn.cloneNode(true));
        }
        
        // 他のボタンのイベントリスナーも同様に削除
        if (this.elements.rotateBtn) {
            this.elements.rotateBtn.replaceWith(this.elements.rotateBtn.cloneNode(true));
        }
        
        if (this.elements.firstPersonBtn) {
            this.elements.firstPersonBtn.replaceWith(this.elements.firstPersonBtn.cloneNode(true));
        }
        
        // 作成した要素を削除
        if (this.positionIndicator && this.positionIndicator.parentNode) {
            this.positionIndicator.parentNode.removeChild(this.positionIndicator);
        }
        
        if (this.cameraPositionDisplay && this.cameraPositionDisplay.parentNode) {
            this.cameraPositionDisplay.parentNode.removeChild(this.cameraPositionDisplay);
        }
        
        if (this.firstPersonGuide && this.firstPersonGuide.parentNode) {
            this.firstPersonGuide.parentNode.removeChild(this.firstPersonGuide);
        }
        
        // アニメーションコントロールをクリーンアップ
        if (this.animationControls) {
            this.animationControls.dispose();
            this.animationControls = null;
        }
        
        // 参照をクリア
        this.elements = {};
    }
    
    /**
     * アニメーションコントロールを初期化
     */
    initializeAnimationControls() {
        this.animationControls = new AnimationControls(this);
        this.animationControls.initialize();
    }
    
    /**
     * 元のカメラに戻るボタンを表示
     */
    showReturnToCameraButton() {
        // 既存のボタンがあれば削除
        this.hideReturnToCameraButton();
        
        // ボタンを作成
        const returnBtn = document.createElement('button');
        returnBtn.id = 'returnToCameraBtn';
        returnBtn.innerHTML = '🔙 元のカメラに戻る';
        returnBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background-color: rgba(128, 128, 128, 0.6);
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        `;
        
        // ホバー効果
        returnBtn.addEventListener('mouseenter', () => {
            returnBtn.style.backgroundColor = 'rgba(128, 128, 128, 0.8)';
            returnBtn.style.transform = 'translateX(-50%) translateY(-2px)';
            returnBtn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        });
        
        returnBtn.addEventListener('mouseleave', () => {
            returnBtn.style.backgroundColor = 'rgba(128, 128, 128, 0.6)';
            returnBtn.style.transform = 'translateX(-50%)';
            returnBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
        });
        
        // クリックイベント
        returnBtn.addEventListener('click', () => {
            this.returnToDefaultCamera();
        });
        
        document.body.appendChild(returnBtn);
        
        // フェードインアニメーション
        returnBtn.style.opacity = '0';
        setTimeout(() => {
            returnBtn.style.opacity = '1';
        }, 100);
    }
    
    /**
     * 元のカメラに戻るボタンを非表示
     */
    hideReturnToCameraButton() {
        const returnBtn = document.getElementById('returnToCameraBtn');
        if (returnBtn) {
            returnBtn.remove();
        }
    }
    
    /**
     * デフォルトカメラに戻る
     */
    returnToDefaultCamera() {
        const cameraManager = this.app.getManager('camera');
        if (cameraManager) {
            // フォーカス前の状態に戻る（アニメーション付き）
            cameraManager.returnToPreFocusState();
            
            // フォーカス状態フラグをリセット
            this.isVehicleFocused = false;
            
            // ボタンを非表示
            this.hideReturnToCameraButton();
        }
    }

    /**
     * デバッグモードのキーボードショートカットを設定
     */
    setupDebugShortcuts() {
        let debugMode = false;
        
        document.addEventListener('keydown', (event) => {
            // CMD+D または Ctrl+D でデバッグモードをトグル
            if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
                event.preventDefault();
                debugMode = !debugMode;
                
                // デバッグパネルの表示/非表示を切り替え
                const debugPanels = document.querySelectorAll('.debug-panel');
                debugPanels.forEach(panel => {
                    if (debugMode) {
                        // 要素のタイプに応じて適切なdisplayスタイルを設定
                        if (panel.tagName === 'BUTTON') {
                            panel.style.display = 'inline-block';
                        } else if (panel.tagName === 'DIV' && panel.classList.contains('checkbox-group')) {
                            panel.style.display = 'block';
                        } else {
                            panel.style.display = 'block';
                        }
                        panel.style.setProperty('display', panel.style.display, 'important');
                    } else {
                        panel.style.setProperty('display', 'none', 'important');
                    }
                });
                
                // デバッグモードの状態を通知
                if (debugMode) {
                    console.log('🐛 デバッグモード: ON');
                    this.showDebugNotification('デバッグモード: ON');
                } else {
                    console.log('🐛 デバッグモード: OFF');
                    this.showDebugNotification('デバッグモード: OFF');
                }
            }
        });
    }

    /**
     * デバッグモードの通知を表示
     * @param {string} message - 表示するメッセージ
     */
    showDebugNotification(message) {
        // 既存の通知があれば削除
        const existingNotification = document.getElementById('debugNotification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.id = 'debugNotification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            transition: opacity 0.3s ease-in-out;
        `;
        document.body.appendChild(notification);
        
        // フェードアウトして削除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
}