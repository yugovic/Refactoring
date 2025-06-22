// js/interaction/InteractionManager.js
/**
 * ユーザーインタラクションを管理するクラス
 */

import { ASSET_TYPES } from '../config/constants.js';
import { snapPositionToGrid, calculateRayFloorIntersection } from '../utils/math-utils.js';
import { PRESET_COLORS } from '../utils/color-utils.js';

export class InteractionManager {
    constructor(app, errorHandler) {
        this.app = app;
        this.errorHandler = errorHandler;
        
        // マネージャーの参照
        this.scene = null;
        this.canvas = null;
        this.camera = null;
        this.gridSystem = null;
        this.assetPlacer = null;
        this.selectionController = null;
        this.uploadManager = null;
        
        // インタラクション状態
        this.currentMode = null;
        this.isPlacing = false;
        this.isDragging = false;
        
        // ドラッグ用
        this.startingPoint = null;
        this.currentMesh = null;
        this.originalPosition = null;
        
        // プレビューメッシュ
        this.previewMesh = null;
        
        // イベントハンドラー
        this.onPointerDown = null;
        this.onPointerUp = null;
        this.onPointerMove = null;
    }

    /**
     * インタラクションシステムを初期化
     */
    initialize() {
        // マネージャーの参照を取得
        this.scene = this.app.getScene();
        this.canvas = this.app.getManager('scene').getCanvas();
        this.camera = this.app.getManager('camera');
        this.gridSystem = this.app.getManager('grid');
        this.assetPlacer = this.app.getManager('assetPlacer');
        this.selectionController = this.app.getManager('selection');
        this.uploadManager = this.app.getManager('upload');
        
        // イベントハンドラーを設定
        this.setupEventHandlers();
        
        console.log("InteractionManager initialized");
    }

    /**
     * イベントハンドラーを設定
     */
    setupEventHandlers() {
        // 既存のイベントリスナーを削除
        this.removeEventHandlers();
        
        // ポインターダウン
        this.onPointerDown = (evt, pickResult) => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerDown(pickResult);
        };
        
        // ポインターアップ
        this.onPointerUp = () => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerUp();
        };
        
        // ポインター移動
        this.onPointerMove = (evt) => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerMove();
        };
        
        // イベントを登録
        this.scene.onPointerDown = this.onPointerDown;
        this.scene.onPointerUp = this.onPointerUp;
        this.scene.onPointerMove = this.onPointerMove;
    }
    
    /**
     * イベントハンドラーを削除
     */
    removeEventHandlers() {
        // イベントリスナーを削除
        if (this.scene) {
            this.scene.onPointerDown = null;
            this.scene.onPointerUp = null;
            this.scene.onPointerMove = null;
        }
    }

    /**
     * ポインターダウン処理
     * @param {BABYLON.PickingInfo} pickResult
     */
    handlePointerDown(pickResult) {
        console.log("=== PointerDown イベント ===");
        console.log("配置モード状態:", {
            isPlacing: this.isPlacing,
            currentMode: this.currentMode,
            hit: pickResult.hit,
            meshName: pickResult.hit ? pickResult.pickedMesh.name : "no mesh"
        });
        
        if (this.isPlacing) {
            console.log("配置処理を開始します");
            this.handlePlacement(pickResult);
        } else {
            console.log("選択処理を開始します");
            this.handleSelection(pickResult);
        }
    }

    /**
     * 配置処理
     * @param {BABYLON.PickingInfo} _pickResult - 使用しない（実際はシーンから直接ピッキング）
     */
    async handlePlacement(_pickResult) {
        console.log("=== 配置処理開始 ===");
        
        // マウス位置でピッキングを実行（プレビューメッシュを除外）
        let pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => !mesh.name.startsWith('preview_'), // プレビューメッシュを除外
            false,
            this.camera.getActiveCamera()
        );
        
        if (!pickInfo.hit || !pickInfo.pickedPoint) {
            console.log("エラー: ピッキングに失敗しました");
            this.errorHandler.showError("配置できません。有効な場所をクリックしてください。");
            // 車両配置モードの場合は解除
            if (this.currentMode === 'vehicle') {
                console.log("部屋外クリックにより車両配置モードを解除");
                this.exitPlacementMode();
            }
            return;
        }
        
        // スカイボックスや背景要素をクリックした場合
        const pickedMeshName = pickInfo.pickedMesh.name.toLowerCase();
        if (pickedMeshName === 'skybox' || 
            pickedMeshName.includes('background') || 
            pickedMeshName.includes('sky')) {
            console.log("背景要素クリックを検出");
            // 車両配置モードの場合は解除
            if (this.currentMode === 'vehicle') {
                console.log("背景クリックにより車両配置モードを解除");
                this.exitPlacementMode();
            }
            return;
        }
        
        // 配置済みアセットの子メッシュをチェック
        let targetMesh = pickInfo.pickedMesh;
        
        // 車両の子メッシュかどうかをチェック（車両は特別な名前パターンを持つ）
        const isVehiclePart = targetMesh.name.includes("cosmo") || 
                             targetMesh.name.includes("rx") || 
                             targetMesh.name.includes("r360") ||
                             targetMesh.name.includes("_primitive") ||
                             (targetMesh.parent && targetMesh.parent.name && targetMesh.parent.name.startsWith("placed_vehicle_"));
        
        if (targetMesh.metadata && (targetMesh.metadata.isPartOfAsset || targetMesh.metadata.parentAsset || targetMesh.metadata.isPartOfVehicle) || isVehiclePart) {
            console.log("配置済みアセットまたは車両の子メッシュを検出。床を再ピックします。", {
                meshName: targetMesh.name,
                isVehiclePart: isVehiclePart,
                metadata: targetMesh.metadata,
                parentName: targetMesh.parent?.name
            });
            // 配置済みアセットを無視して再度レイキャスト
            const ray = this.scene.createPickingRay(
                this.scene.pointerX,
                this.scene.pointerY,
                BABYLON.Matrix.Identity(),
                this.camera.getActiveCamera()
            );
            
            const predicate = (mesh) => {
                // 車両の名前パターンチェック
                const isVehicleRelated = mesh.name.includes("cosmo") || 
                                       mesh.name.includes("rx") || 
                                       mesh.name.includes("r360") ||
                                       mesh.name.includes("_primitive") ||
                                       mesh.name.startsWith("placed_vehicle_");
                
                // 配置済みアセットとその子メッシュ、車両を除外
                return !mesh.metadata?.isAsset && 
                       !mesh.metadata?.isPartOfAsset && 
                       !mesh.metadata?.parentAsset &&
                       !mesh.metadata?.isVehicle &&
                       !mesh.metadata?.isPartOfVehicle &&
                       !isVehicleRelated &&
                       mesh.isPickable &&
                       mesh.isVisible;
            };
            
            pickInfo = this.scene.pickWithRay(ray, predicate);
            
            if (!pickInfo.hit || !pickInfo.pickedPoint) {
                console.log("エラー: 床の再ピッキングに失敗しました");
                this.errorHandler.showError("配置できません。床または壁をクリックしてください。");
                return;
            }
            targetMesh = pickInfo.pickedMesh;
        }
        
        // 環境要素（木や建物など）をチェック
        if (targetMesh.name.includes("tree") || 
            targetMesh.name.includes("building") ||
            targetMesh.name.includes("environment") ||
            (targetMesh.metadata && targetMesh.metadata.isEnvironmentObject)) {
            console.log("環境要素クリックを検出:", targetMesh.name);
            // 車両配置モードの場合は解除
            if (this.currentMode === 'vehicle') {
                console.log("環境要素クリックにより車両配置モードを解除");
                this.exitPlacementMode();
            }
            return;
        }
        
        // 配置可能な場所かチェック
        const meshName = targetMesh.name.toLowerCase();
        const isFloor = meshName.includes("floor") || 
                       meshName.includes("ground") ||
                       (targetMesh.metadata && targetMesh.metadata.isFloor);
        const isWall = meshName.includes("wall");
        const isPlaceableSurface = targetMesh.metadata && targetMesh.metadata.isPlaceableSurface;
        
        console.log("ピッキング結果:", {
            meshName: targetMesh.name,
            meshNameLower: meshName,
            isFloor,
            isWall,
            isPlaceableSurface,
            position: pickInfo.pickedPoint.toString(),
            metadata: targetMesh.metadata,
            parentName: targetMesh.parent?.name,
            meshId: targetMesh.id
        });
        
        // 車両配置モードの場合は床のみチェック
        if (this.currentMode === 'vehicle') {
            if (!isFloor) {
                console.log("エラー: 車両は床にのみ配置できます。メッシュ名:", meshName);
                this.errorHandler.showError("車両は床にのみ配置できます。");
                
                // 既に車両が配置されている場合（再配置時）のみ配置モードを解除
                const vehicleManager = this.app.getManager('vehicle');
                if (vehicleManager && vehicleManager.getPlacedVehicle()) {
                    console.log("床以外クリックにより車両再配置モードを解除");
                    this.exitPlacementMode();
                } else {
                    console.log("初期配置中のため車両配置モードを維持");
                }
                return;
            }
        } else {
            // 通常のアセット配置の場合
            if (!isFloor && !isWall && !isPlaceableSurface) {
                console.log("エラー: 配置不可能な場所です");
                this.errorHandler.showError("配置できません。床、壁、または配置可能なサーフェスをクリックしてください。");
                return;
            }
        }
        
        console.log("ヒットしたオブジェクト:", {
            name: pickInfo.pickedMesh?.name,
            position: pickInfo.pickedPoint?.clone()
        });
        
        const hitPoint = pickInfo.pickedPoint.clone();
        
        console.log("配置前の位置:", hitPoint.toString());
        
        // グリッドスナップが有効な場合は位置をスナップ
        if (this.gridSystem.isSnapEnabled()) {
            const gridSize = this.gridSystem.getGridSize();
            console.log(`グリッドスナップ有効 (サイズ: ${gridSize})`);
            const snappedPosition = snapPositionToGrid(hitPoint, gridSize);
            console.log("スナップ前:", hitPoint.toString());
            console.log("スナップ後:", snappedPosition.toString());
            hitPoint.copyFrom(snappedPosition);
        } else {
            console.log("グリッドスナップ無効");
        }
        
        // 法線を取得
        let normal = null;
        try {
            normal = pickInfo.getNormal(true) || new BABYLON.Vector3(0, 1, 0);
        } catch (e) {
            console.warn("法線の取得に失敗しました。デフォルト値を使用します。", e);
            normal = new BABYLON.Vector3(0, 1, 0);
        }
        
        console.log("法線ベクトル:", normal.toString());
        
        // 壁に配置する場合の処理
        const isWallPlacement = Math.abs(normal.y) < 0.7;
        console.log(`配置タイプ: ${isWallPlacement ? '壁' : '床'}`);
        
        // 車両配置モードの場合は特別な処理
        if (this.currentMode === 'vehicle') {
            // 車両は必ず床に配置（Y座標を固定）
            console.log(`車両配置: Y座標調整前 -> ${hitPoint.y}`);
            hitPoint.y = 0.01; // 床の高さに固定
            console.log(`車両配置: Y座標調整後 -> ${hitPoint.y}`);
        } else {
            // AssetPlacerに壁の法線を設定
            if (isWallPlacement) {
                this.assetPlacer.setWallNormal(normal);
            }
            
            // 位置を調整
            if (isWallPlacement) {
                const offset = 0.1;  // 壁から少し離す
                console.log(`壁配置: オフセット適用前 -> ${hitPoint.toString()}`);
                hitPoint.x += normal.x * offset;
                hitPoint.z += normal.z * offset;
                
                // 壁の高さを調整（床から1.2m上）
                hitPoint.y = 1.2;
                console.log(`壁配置: オフセット適用後 -> ${hitPoint.toString()}`);
            } else {
                // 床配置の場合は少し上に配置
                console.log(`床配置: Y座標調整前 -> ${hitPoint.y}`);
                hitPoint.y += 0.01;
                console.log(`床配置: Y座標調整後 -> ${hitPoint.y}`);
            }
        }
        
        // 境界チェック
        const boundary = await import('../config/constants.js').then(m => m.ROOM_BOUNDARY);
        if (hitPoint.x < boundary.MIN_X || hitPoint.x > boundary.MAX_X ||
            hitPoint.z < boundary.MIN_Z || hitPoint.z > boundary.MAX_Z) {
            console.error("配置位置が部屋の境界外です:", hitPoint.toString());
            this.errorHandler.showError("配置位置が部屋の外です。部屋の中に配置してください。");
            return;
        }
        
        console.log("=== アセット配置実行 ===");
        console.log("配置タイプ:", this.currentMode);
        console.log("最終位置:", hitPoint.toString());
        
        let placedMesh = null;
        
        // アップロードされたアセットの配置をチェック
        const activeAssetId = this.uploadManager.getActiveAssetId();
        console.log("アクティブアセットID:", activeAssetId);
        console.log("配置モード:", this.currentMode);
        
        if (this.currentMode === 'vehicle') {
            // 車両を配置
            const vehicleManager = this.app.getManager('vehicle');
            placedMesh = vehicleManager.placeVehicle(hitPoint);
            if (!placedMesh) {
                this.errorHandler.showError("車両の配置に失敗しました。");
                return;
            }
        } else if (this.currentMode === 'uploaded_asset' && activeAssetId) {
            console.log("アップロードアセットを配置:", activeAssetId);
            try {
                placedMesh = await this.uploadManager.placeUploadedAsset(activeAssetId, hitPoint);
            } catch (error) {
                console.error("アップロードアセット配置エラー:", error);
                this.errorHandler.showError(`アセットの配置に失敗しました: ${error.message}`);
                return;
            }
        } else if (this.currentMode !== 'uploaded_asset') {
            // 通常のアセットを配置
            placedMesh = this.assetPlacer.placeAsset(this.currentMode, hitPoint);
        } else {
            console.error("アップロードアセットが選択されていません");
            this.errorHandler.showError("アセットが選択されていません。");
            return;
        }
        
        if (placedMesh) {
            console.log("アセット配置成功:", placedMesh.name);
        } else {
            console.error("アセット配置失敗");
        }
        
        // 配置モードを終了
        this.exitPlacementMode();
    }

    /**
     * 選択処理
     * @param {BABYLON.PickingInfo} pickResult
     */
    handleSelection(pickResult) {
        if (pickResult.hit) {
            const pickedMeshName = pickResult.pickedMesh.name.toLowerCase();
            
            // スカイボックスや背景要素をクリックした場合は選択解除
            if (pickedMeshName === 'skybox' || 
                pickedMeshName.includes('background') || 
                pickedMeshName.includes('sky')) {
                console.log("背景要素クリックにより選択を解除");
                this.selectionController.deselectAll();
                
                // カメラコントロールを有効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera) {
                    activeCamera.attachControl(this.canvas, true);
                }
                return;
            }
            
            // 環境要素をクリックした場合も選択解除
            if (pickResult.pickedMesh.name.includes("tree") || 
                pickResult.pickedMesh.name.includes("building") ||
                pickResult.pickedMesh.name.includes("environment") ||
                (pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.isEnvironmentObject)) {
                console.log("環境要素クリックにより選択を解除");
                this.selectionController.deselectAll();
                
                // カメラコントロールを有効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera) {
                    activeCamera.attachControl(this.canvas, true);
                }
                return;
            }
            
            const selectedMesh = this.selectionController.selectFromPickResult(pickResult);
            
            if (selectedMesh) {
                // ドラッグ開始
                this.currentMesh = selectedMesh;
                this.originalPosition = selectedMesh.position.clone();
                
                // 床との交点を計算
                const ground = this.app.getManager('room').getGround();
                const floorY = ground ? ground.position.y : 0;
                const ray = this.scene.createPickingRay(
                    this.scene.pointerX, 
                    this.scene.pointerY, 
                    BABYLON.Matrix.Identity(), 
                    this.camera.getActiveCamera()
                );
                
                this.startingPoint = calculateRayFloorIntersection(ray, floorY);
                this.isDragging = true;
                
                // カメラコントロールを無効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera) {
                    activeCamera.detachControl(this.canvas);
                }
            } else {
                // 選択解除
                this.selectionController.deselectAll();
                
                // カメラコントロールを有効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera && !this.selectionController.hasSelection()) {
                    activeCamera.attachControl(this.canvas, true);
                }
            }
        } else {
            // 何もヒットしなかった場合（部屋の外をクリック）も選択解除
            console.log("部屋外クリックにより選択を解除");
            this.selectionController.deselectAll();
            
            // カメラコントロールを有効化
            const activeCamera = this.camera.getActiveCamera();
            if (activeCamera) {
                activeCamera.attachControl(this.canvas, true);
            }
        }
    }

    /**
     * ポインターアップ処理
     */
    handlePointerUp() {
        if (this.currentMesh && this.isDragging) {
            // 部屋の境界チェック
            const roomBoundary = this.app.getManager('room').getRoomBoundary();
            const isInside = this.isPositionInsideRoom(this.currentMesh.position, roomBoundary);
            
            if (!isInside) {
                // 元の位置に戻す
                if (this.originalPosition) {
                    this.currentMesh.position.copyFrom(this.originalPosition);
                }
                this.errorHandler.showError("オブジェクトを配置できません。部屋の中に配置してください。");
            } else {
                // グリッドスナップ
                if (this.gridSystem.isSnapEnabled()) {
                    const gridSize = this.gridSystem.getGridSize();
                    this.currentMesh.position.x = Math.round(this.currentMesh.position.x / gridSize) * gridSize;
                    this.currentMesh.position.z = Math.round(this.currentMesh.position.z / gridSize) * gridSize;
                }
            }
        }
        
        // ドラッグ終了
        this.isDragging = false;
        this.startingPoint = null;
        this.currentMesh = null;
        this.originalPosition = null;
        
        // カメラコントロールを有効化（選択中でない場合）
        if (!this.selectionController.hasSelection()) {
            const activeCamera = this.camera.getActiveCamera();
            if (activeCamera) {
                activeCamera.attachControl(this.canvas, true);
            }
        }
    }

    /**
     * ポインター移動処理
     */
    handlePointerMove() {
        if (this.isDragging && this.startingPoint && this.currentMesh) {
            this.handleDragging();
        } else if (this.isPlacing) {
            // プレビュー更新を非同期で実行（エラーを無視）
            this.updatePreview().catch(error => {
                console.warn("プレビュー更新エラー:", error);
            });
        }
    }

    /**
     * ドラッグ処理
     */
    handleDragging() {
        // 床との交点を計算
        const ground = this.app.getManager('room').getGround();
        const floorY = ground ? ground.position.y : 0;
        const ray = this.scene.createPickingRay(
            this.scene.pointerX, 
            this.scene.pointerY, 
            BABYLON.Matrix.Identity(), 
            this.camera.getActiveCamera()
        );
        
        const current = calculateRayFloorIntersection(ray, floorY);
        
        if (!current) return;
        
        const diff = current.subtract(this.startingPoint);
        
        // 新しい位置を計算
        this.currentMesh.position.x += diff.x;
        this.currentMesh.position.z += diff.z;
        
        this.startingPoint = current;
    }

    /**
     * プレビューを更新
     */
    async updatePreview() {
        const pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            null, // プレビュー時はフィルターなし（より寛容なピッキング）
            false,
            this.camera.getActiveCamera()
        );
        
        if (!pickInfo.hit || !pickInfo.pickedPoint) {
            this.hidePreview();
            return;
        }
        
        // プレビューメッシュがピッキングされた場合は、プレビューを維持
        const meshName = pickInfo.pickedMesh.name.toLowerCase();
        if (meshName.startsWith('preview_')) {
            return;
        }
        
        // 配置可能な場所かチェック
        const isFloor = meshName.includes("floor") || 
                       meshName.includes("ground") ||
                       (pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.isFloor);
        const isWall = meshName.includes("wall");
        const isPlaceableSurface = pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.isPlaceableSurface;
        
        if (!isFloor && !isWall && !isPlaceableSurface) {
            this.hidePreview();
            return;
        }
        
        // プレビュー位置を計算
        let position = pickInfo.pickedPoint.clone();
        if (this.gridSystem.isSnapEnabled()) {
            position = snapPositionToGrid(position, this.gridSystem.getGridSize());
        }
        
        // 法線を取得
        let normal = null;
        try {
            normal = pickInfo.getNormal(true) || new BABYLON.Vector3(0, 1, 0);
        } catch (e) {
            normal = new BABYLON.Vector3(0, 1, 0);
        }
        
        const isWallHit = Math.abs(normal.y) < 0.7;
        
        // 車両配置モードの場合
        if (this.currentMode === 'vehicle') {
            // 床のみに配置可能
            if (!isFloor) {
                this.hidePreview();
                return;
            }
            
            // 床配置用の位置調整（初期値はピッキングポイント + 小さなオフセット）
            position.y = pickInfo.pickedPoint.y + 0.01; // 床から少し浮かせる（バウンディングボックス調整前の初期値）
            
            // 統合プレビューシステムを使用
            await this.showPreview(position, null);
            
            // 垂直ヘルパーを表示
            const color = this.getPreviewColor();
            this.gridSystem.showVerticalHelper(position, color);
            return;
        }
        
        // 位置調整
        if (isWallHit) {
            const offset = 0.1;
            position.x += normal.x * offset;
            position.z += normal.z * offset;
        } else {
            position.y = pickInfo.pickedPoint.y + 0.1;
        }
        
        // プレビューメッシュを作成または更新
        await this.showPreview(position, isWallHit ? normal : null);
        
        // 垂直ヘルパーを表示
        if (!isWallHit) {
            const color = this.getPreviewColor();
            this.gridSystem.showVerticalHelper(position, color);
        } else {
            this.gridSystem.hideVerticalHelper();
        }
    }

    /**
     * プレビューを表示
     * @param {BABYLON.Vector3} position - 位置
     * @param {BABYLON.Vector3|null} wallNormal - 壁の法線
     */
    async showPreview(position, wallNormal) {
        if (!this.previewMesh) {
            await this.createPreviewMesh();
        }
        
        if (this.previewMesh) {
            this.previewMesh.position = position;
            
            // 車両の高さ調整が必要な場合
            if (this.previewMesh.metadata && this.previewMesh.metadata.needsHeightAdjustment) {
                // ワールドマトリックスを強制的に更新
                this.previewMesh.computeWorldMatrix(true);
                
                // 子メッシュのワールドマトリックスも更新
                if (this.previewMesh.getChildMeshes) {
                    this.previewMesh.getChildMeshes().forEach(child => {
                        child.computeWorldMatrix(true);
                    });
                }
                
                // バウンディング情報を更新
                this.previewMesh.refreshBoundingInfo();
                
                const boundingInfo = this.previewMesh.getBoundingInfo();
                if (boundingInfo) {
                    const minY = boundingInfo.boundingBox.minimumWorld.y;
                    const maxY = boundingInfo.boundingBox.maximumWorld.y;
                    
                    // 車両プレビューの場合、詳細なログを出力
                    if (this.previewMesh.metadata.isVehiclePreview) {
                        console.log("車両プレビューの高さ調整:", {
                            meshName: this.previewMesh.name,
                            currentPosition: this.previewMesh.position.y,
                            targetFloorY: position.y,
                            boundingMinY: minY,
                            boundingMaxY: maxY,
                            needsAdjustment: minY < position.y
                        });
                    }
                    
                    if (minY < position.y) {
                        // 車両が床にめり込んでいる場合、持ち上げる
                        const offset = position.y - minY;
                        this.previewMesh.position.y += offset;
                        
                        if (this.previewMesh.metadata.isVehiclePreview) {
                            console.log(`車両プレビューを ${offset.toFixed(3)} 単位持ち上げました`);
                        }
                    }
                }
            }
            
            // 壁配置の場合は回転
            if (wallNormal) {
                const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                    new BABYLON.Vector3(0, 0, 1),
                    wallNormal,
                    new BABYLON.Quaternion()
                );
                this.previewMesh.rotationQuaternion = rotationQuaternion;
            } else {
                this.previewMesh.rotation = BABYLON.Vector3.Zero();
                this.previewMesh.rotationQuaternion = null;
            }
        }
    }

    /**
     * プレビューメッシュを作成
     */
    async createPreviewMesh() {
        this.cleanupPreview();
        
        let mesh = null;
        
        switch (this.currentMode) {
            case ASSET_TYPES.CUBE:
                // バーガーのプレビュー
                if (this.app.getManager('assetLoader').isModelAvailable('burger')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('burger', 'preview_burger');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.BURGER);
                }
                break;
                
            case ASSET_TYPES.RECORD_MACHINE:
                if (this.app.getManager('assetLoader').isModelAvailable('recordMachine')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('recordMachine', 'preview_recordMachine');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.RECORD);
                }
                break;
                
            case ASSET_TYPES.JUICE_BOX:
                if (this.app.getManager('assetLoader').isModelAvailable('juiceBox')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('juiceBox', 'preview_juiceBox');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.JUICE_BOX);
                }
                break;
                
            case ASSET_TYPES.MIKE_DESK:
                mesh = BABYLON.MeshBuilder.CreateCylinder("preview_mikeDesk", { 
                    diameterTop: 0, 
                    diameterBottom: 0.6,
                    height: 0.9,
                    tessellation: 4
                }, this.scene);
                
                const material = new BABYLON.StandardMaterial("previewMaterial", this.scene);
                material.diffuseColor = PRESET_COLORS.MIKE_DESK;
                material.alpha = 0.5;
                mesh.material = material;
                break;
                
            case ASSET_TYPES.TROPHY:
                if (this.app.getManager('assetLoader').isModelAvailable('trophy')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('trophy', 'preview_trophy');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(new BABYLON.Color3(0.8, 0.7, 0.1)); // 金色
                }
                break;
                
            case 'uploaded_asset':
                // アップロードアセットのプレビュー
                const activeAssetId = this.uploadManager.getActiveAssetId();
                if (activeAssetId) {
                    const assetInfo = this.uploadManager.getAssetInfo(activeAssetId);
                    if (assetInfo) {
                        try {
                            mesh = await this.uploadManager.loadMeshFromUrl(
                                assetInfo.url, 
                                'preview_uploaded', 
                                assetInfo.originalFileName
                            );
                            if (mesh) {
                                mesh.setEnabled(true);
                                const scale = assetInfo.scale;
                                mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                                this.makeTransparent(mesh);
                            }
                        } catch (error) {
                            console.warn("アップロードアセットプレビューの作成に失敗:", error);
                            mesh = this.createSimplePreview(new BABYLON.Color3(0.7, 0.5, 0.3));
                        }
                    }
                } else {
                    mesh = this.createSimplePreview(new BABYLON.Color3(0.7, 0.5, 0.3));
                }
                break;
                
            case 'vehicle':
                // 車両プレビュー
                const vehicleManager = this.app.getManager('vehicle');
                if (vehicleManager && vehicleManager.getCurrentVehicleMesh()) {
                    const currentVehicle = vehicleManager.getCurrentVehicleMesh();
                    mesh = currentVehicle.clone(`preview_vehicle_${vehicleManager.getSelectedVehicle().name}`);
                    mesh.setEnabled(true);
                    
                    // 車両のスケールを適用
                    const scale = vehicleManager.getVehicleScale();
                    mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                    
                    // 親メッシュのバウンディングボックスを子メッシュから再計算
                    // VehicleManagerのrecalculateParentBoundingメソッドを直接呼び出すのではなく、
                    // ここで同じロジックを実装（メソッドが車両マネージャー内でしか動作しない可能性があるため）
                    this.recalculateVehiclePreviewBounding(mesh);
                    
                    // バウンディング情報を更新
                    mesh.refreshBoundingInfo();
                    
                    // 車両の高さ調整（後でshowPreviewで位置が設定された後に調整される）
                    mesh.metadata = mesh.metadata || {};
                    mesh.metadata.needsHeightAdjustment = true;
                    mesh.metadata.isVehiclePreview = true; // 車両プレビューであることを明示
                    
                    this.makeTransparent(mesh);
                } else {
                    // 車両が選択されていない場合はシンプルなプレビュー
                    mesh = this.createSimplePreview(new BABYLON.Color3(0.5, 0.5, 0.7));
                }
                break;
        }
        
        if (mesh) {
            mesh.isPickable = false;
            mesh.checkCollisions = false;
            
            if (mesh.getChildMeshes) {
                mesh.getChildMeshes().forEach(child => {
                    child.isPickable = false;
                });
            }
            
            this.previewMesh = mesh;
        }
    }

    /**
     * シンプルなプレビューを作成
     * @param {BABYLON.Color3} color - 色
     * @returns {BABYLON.Mesh}
     */
    createSimplePreview(color) {
        const mesh = BABYLON.MeshBuilder.CreateBox("preview_simple", { size: 0.2 }, this.scene);
        const material = new BABYLON.StandardMaterial("previewMaterial", this.scene);
        material.diffuseColor = color;
        material.alpha = 0.5;
        mesh.material = material;
        return mesh;
    }

    /**
     * メッシュを半透明にする
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    makeTransparent(mesh) {
        if (mesh.material) {
            mesh.material.alpha = 0.5;
        }
        
        if (mesh.getChildMeshes) {
            mesh.getChildMeshes().forEach(childMesh => {
                if (childMesh.material) {
                    childMesh.material.alpha = 0.5;
                }
            });
        }
    }

    /**
     * プレビューを非表示
     */
    hidePreview() {
        if (this.previewMesh) {
            this.previewMesh.isVisible = false;
        }
        this.gridSystem.hideVerticalHelper();
    }

    /**
     * プレビューをクリーンアップ
     */
    cleanupPreview() {
        if (this.previewMesh) {
            this.previewMesh.dispose();
            this.previewMesh = null;
        }
        
        // 残っているプレビューメッシュも削除
        const previewMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.startsWith("preview")
        );
        
        previewMeshes.forEach(mesh => mesh.dispose());
    }

    /**
     * 車両プレビューメッシュのバウンディングボックスを再計算
     * @param {BABYLON.AbstractMesh} vehicleMesh - 車両メッシュ
     */
    recalculateVehiclePreviewBounding(vehicleMesh) {
        try {
            const childMeshes = vehicleMesh.getChildMeshes ? vehicleMesh.getChildMeshes() : [];
            
            if (childMeshes.length === 0) {
                console.log(`車両プレビュー ${vehicleMesh.name} に子メッシュがありません`);
                return;
            }

            // 子メッシュの中でジオメトリを持つものを探す
            const meshesWithGeometry = childMeshes.filter(child => 
                child.geometry && child.getVerticesData && child.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            );

            if (meshesWithGeometry.length === 0) {
                console.log(`車両プレビュー ${vehicleMesh.name} の子メッシュにジオメトリが見つかりません`);
                return;
            }

            // 各子メッシュのワールド座標でのバウンディングボックスを計算
            let globalMin = null;
            let globalMax = null;

            meshesWithGeometry.forEach((child) => {
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
                }
            });

            if (globalMin && globalMax) {
                // 親メッシュの逆変換マトリックスを使用して正確な変換を行う
                vehicleMesh.computeWorldMatrix(true);
                const parentWorldMatrix = vehicleMesh.getWorldMatrix();
                const inverseMatrix = parentWorldMatrix.clone().invert();
                
                // ワールド座標からローカル座標への正確な変換
                const localMin = BABYLON.Vector3.TransformCoordinates(globalMin, inverseMatrix);
                const localMax = BABYLON.Vector3.TransformCoordinates(globalMax, inverseMatrix);
                
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
                vehicleMesh.setBoundingInfo(new BABYLON.BoundingInfo(boundingMin, boundingMax));
                
                console.log(`車両プレビュー ${vehicleMesh.name} のバウンディングを再計算完了`);
            }

        } catch (error) {
            console.error(`車両プレビュー ${vehicleMesh.name} のバウンディング再計算中にエラー:`, error);
        }
    }

    /**
     * プレビューの色を取得
     * @returns {BABYLON.Color3}
     */
    getPreviewColor() {
        switch (this.currentMode) {
            case ASSET_TYPES.CUBE:
                return PRESET_COLORS.BURGER;
            case ASSET_TYPES.RECORD_MACHINE:
                return PRESET_COLORS.RECORD;
            case ASSET_TYPES.JUICE_BOX:
                return PRESET_COLORS.JUICE_BOX;
            case ASSET_TYPES.MIKE_DESK:
                return PRESET_COLORS.MIKE_DESK;
            case 'uploaded_asset':
                return new BABYLON.Color3(0.7, 0.5, 0.3);
            case 'vehicle':
                return new BABYLON.Color3(0.5, 0.5, 0.7);
            default:
                return new BABYLON.Color3(0, 0.7, 1);
        }
    }

    /**
     * 車両配置モードを設定
     */
    setVehiclePlacementMode() {
        console.log('=== 車両配置モード設定 ===');
        this.exitPlacementMode();
        this.currentMode = 'vehicle';
        this.isPlacing = true;
        this.selectionController.deselectAll();
        
        console.log('車両配置モードを開始しました');
    }

    /**
     * 現在のモードを取得
     * @returns {string|null}
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * 配置モードを設定
     * @param {string} mode - アセットタイプ
     */
    setPlacementMode(mode) {
        console.log(`=== 配置モード設定: ${mode} ===`);
        
        // アップロードアセット以外の場合は既存の配置モードを終了
        if (mode !== 'uploaded_asset') {
            this.exitPlacementMode();
        } else {
            // アップロードアセットの場合はプレビューのみクリーンアップ
            this.cleanupPreview();
            this.gridSystem.hideVerticalHelper();
        }
        
        this.currentMode = mode;
        this.isPlacing = true;
        
        // 選択を解除
        this.selectionController.deselectAll();
        
        console.log(`配置モード設定完了:`, {
            currentMode: this.currentMode,
            isPlacing: this.isPlacing
        });
    }

    /**
     * 配置モードを終了
     */
    exitPlacementMode() {
        this.isPlacing = false;
        this.currentMode = null;
        this.cleanupPreview();
        this.gridSystem.hideVerticalHelper();
        
        // 車両プレビューは統合システムでクリーンアップされるため、個別の処理は不要
        
        // アップロードマネージャーの配置モードもリセット
        if (this.uploadManager) {
            this.uploadManager.resetPlacementMode();
        }
    }

    /**
     * モードをリセット
     */
    resetMode() {
        this.exitPlacementMode();
        this.selectionController.deselectAll();
    }

    /**
     * 現在のモードを取得
     * @returns {string|null}
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * 配置中かどうか
     * @returns {boolean}
     */
    isInPlacementMode() {
        return this.isPlacing;
    }

    /**
     * 位置が部屋の内側かチェック
     * @param {BABYLON.Vector3} position - 位置
     * @param {Object} roomBoundary - 部屋の境界
     * @returns {boolean}
     */
    isPositionInsideRoom(position, roomBoundary) {
        return position.x > roomBoundary.MIN_X && 
               position.x < roomBoundary.MAX_X && 
               position.z > roomBoundary.MIN_Z && 
               position.z < roomBoundary.MAX_Z;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing InteractionManager...");
        
        // イベントハンドラーを削除
        if (this.scene) {
            this.scene.onPointerDown = null;
            this.scene.onPointerUp = null;
            this.scene.onPointerMove = null;
        }
        
        // プレビューをクリーンアップ
        this.cleanupPreview();
        
        // 状態をリセット
        this.resetMode();
    }
}