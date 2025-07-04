// js/assets/vehicle-manager.js
/**
 * 車両選択とロードを管理するクラス
 */

export class VehicleManager {
    constructor(scene, assetLoader, errorHandler) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.errorHandler = errorHandler;
        this.app = null; // 後で設定される
        
        // 利用可能な車両データ
        this.availableVehicles = {
            'cosmosp_race': {
                name: 'Cosmo Sport Race',
                fileName: 'cosmosp_race.glb',
                displayName: 'Cosmo Sport Race'
            },
            'cosmosp': {
                name: 'Cosmo Sport',
                fileName: 'cosmosp.glb',
                displayName: 'Cosmo Sport'
            },
            'r360_mazda': {
                name: 'R360 Mazda',
                fileName: 'r360_mazda.glb',
                displayName: 'R360 Mazda'
            },
            'RX3_race': {
                name: 'RX-3 Race',
                fileName: 'RX3_race.glb',
                displayName: 'RX-3 Race'
            },
            'rx7_sabana_race': {
                name: 'RX-7 Sabana Race',
                fileName: 'rx7_sabana_race.glb',
                displayName: 'RX-7 Sabana Race'
            },
            'rx7_sabana': {
                name: 'RX-7 Sabana',
                fileName: 'rx7_sabana.glb',
                displayName: 'RX-7 Sabana'
            }
        };
        
        this.selectedVehicle = null;
        this.currentVehicleMesh = null;
        this.placedVehicleMesh = null; // 配置済み車両
        this.modal = null;
        this.isLoading = false;
        this.previewMesh = null; // プレビュー用メッシュ
        this.vehicleScale = 0.1; // デフォルトスケール 10%
    }

    /**
     * VehicleManagerを初期化
     */
    initialize() {
        this.initializeModal();
        console.log('VehicleManager initialized successfully');
    }
    
    /**
     * Appインスタンスを設定
     * @param {App} app 
     */
    setApp(app) {
        this.app = app;
    }

    /**
     * モーダルを初期化
     */
    initializeModal() {
        console.log('VehicleManager: Initializing modal...');
        this.modal = document.getElementById('vehicleModal');
        
        console.log('Modal element found:', this.modal);
        
        if (!this.modal) {
            console.error('Vehicle modal not found in DOM');
            return;
        }

        // 車両選択イベントリスナーを設定
        const vehicleItems = this.modal.querySelectorAll('.vehicle-item');
        vehicleItems.forEach(item => {
            item.addEventListener('click', () => {
                const vehicleKey = item.dataset.vehicle;
                this.selectVehicle(vehicleKey);
            });
        });

        // モーダル背景クリックで閉じる
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        });
    }

    /**
     * 車両選択モーダルを表示
     */
    showModal() {
        console.log('VehicleManager: showModal called');
        console.log('Modal element:', this.modal);
        
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('Modal should now be visible');
        } else {
            console.error('Modal element not found');
        }
    }

    /**
     * 車両選択モーダルを非表示
     */
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * 車両アセットをロード
     * @param {Object} vehicle 
     * @returns {Promise<BABYLON.AbstractMesh>}
     */
    async loadVehicleAsset(vehicle) {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                "assets/Cars/", 
                vehicle.fileName, 
                this.scene,
                (meshes) => {
                    console.log(`Vehicle ${vehicle.displayName} meshes loaded:`, meshes.length);
                    console.log('Loaded meshes:', meshes.map(mesh => ({
                        name: mesh.name,
                        id: mesh.id,
                        position: mesh.position,
                        scaling: mesh.scaling
                    })));
                    
                    if (meshes.length > 0) {
                        const rootMesh = meshes[0];
                        rootMesh.name = `vehicle_${vehicle.name}`;
                        
                        // メッシュプロパティを設定
                        rootMesh.isPickable = true;
                        rootMesh.checkCollisions = true;
                        
                        // デフォルトスケールを適用
                        rootMesh.scaling = new BABYLON.Vector3(this.vehicleScale, this.vehicleScale, this.vehicleScale);
                        
                        // ロード直後にバウンディングを再計算
                        this.recalculateParentBounding(rootMesh);
                        rootMesh.refreshBoundingInfo();
                        
                        resolve(rootMesh);
                    } else {
                        reject(new Error("No meshes loaded for vehicle"));
                    }
                },
                null,
                (scene, message) => {
                    console.error(`Failed to load vehicle ${vehicle.displayName}:`, message);
                    reject(new Error(`Failed to load vehicle: ${message}`));
                }
            );
        });
    }

    /**
     * 車両を選択
     * @param {string} vehicleKey 
     */
    async selectVehicle(vehicleKey) {
        try {
            const vehicle = this.availableVehicles[vehicleKey];
            if (!vehicle) {
                throw new Error(`Vehicle ${vehicleKey} not found`);
            }

            this.isLoading = true;
            console.log(`Loading vehicle: ${vehicle.displayName}`);

            // 既存の車両メッシュを削除
            if (this.currentVehicleMesh) {
                this.currentVehicleMesh.dispose();
                this.currentVehicleMesh = null;
            }

            // 車両アセットをロード
            const mesh = await this.loadVehicleAsset(vehicle);
            
            if (mesh) {
                // ロードしたメッシュを使用
                this.currentVehicleMesh = mesh;
                
                // 車両を非表示にしておく（配置時まで）
                this.currentVehicleMesh.setEnabled(false);
                
                this.selectedVehicle = vehicle;
                
                // UIを更新
                this.updateVehicleInfo();
                
                // モーダルを閉じる
                this.hideModal();
                
                console.log(`Vehicle ${vehicle.displayName} selected and ready for placement`);
                
                // 車両選択後、自動的に配置モードを有効にする
                const interactionManager = this.app?.getManager?.('interaction');
                if (interactionManager) {
                    interactionManager.setPlacementMode('vehicle');
                    console.log('Vehicle placement mode activated automatically');
                }
                
                // UIの車両配置ボタンもアクティブにする
                const uiManager = this.app?.getManager?.('ui');
                if (uiManager) {
                    uiManager.activateVehiclePlacementButton();
                }
                
                console.log(`Vehicle ${vehicle.displayName} loaded successfully`);
            } else {
                throw new Error(`Failed to load vehicle mesh for ${vehicle.displayName}`);
            }

        } catch (error) {
            console.error('Error loading vehicle:', error);
            this.errorHandler.handleError(error, 'VehicleManager.selectVehicle');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 車両情報UIを更新
     */
    updateVehicleInfo() {
        const vehicleInfo = document.getElementById('vehicleInfo');
        const currentVehicleName = document.getElementById('currentVehicleName');
        const focusVehicleBtn = document.getElementById('focusVehicleBtn');
        
        if (vehicleInfo && currentVehicleName) {
            if (this.selectedVehicle) {
                vehicleInfo.style.display = 'block';
                currentVehicleName.textContent = this.selectedVehicle.displayName;
            } else {
                vehicleInfo.style.display = 'none';
                currentVehicleName.textContent = '車両が選択されていません';
            }
        }
        
        // フォーカスボタンの有効/無効を制御
        if (focusVehicleBtn) {
            if (this.placedVehicleMesh) {
                focusVehicleBtn.disabled = false;
                focusVehicleBtn.style.opacity = '1';
                focusVehicleBtn.style.cursor = 'pointer';
            } else {
                focusVehicleBtn.disabled = true;
                focusVehicleBtn.style.opacity = '0.5';
                focusVehicleBtn.style.cursor = 'not-allowed';
            }
        }
    }

    /**
     * 車両を配置
     * @param {BABYLON.Vector3} position 
     * @returns {BABYLON.AbstractMesh|null}
     */
    placeVehicle(position) {
        if (!this.currentVehicleMesh || !this.selectedVehicle) {
            console.warn('No vehicle selected for placement');
            return null;
        }

        try {
            // 既存の配置済み車両を削除
            if (this.placedVehicleMesh) {
                console.log('Removing existing placed vehicle');
                this.placedVehicleMesh.dispose();
                this.placedVehicleMesh = null;
            }

            // 車両メッシュをクローン
            const clonedMesh = this.currentVehicleMesh.clone(`placed_vehicle_${this.selectedVehicle.name}`);
            
            // スケールを設定（位置調整前に設定）
            clonedMesh.scaling = new BABYLON.Vector3(this.vehicleScale, this.vehicleScale, this.vehicleScale);
            
            // 位置を設定
            clonedMesh.position = position.clone();
            
            // メッシュを有効化
            clonedMesh.setEnabled(true);
            
            // ワールドマトリックスを強制的に更新
            clonedMesh.computeWorldMatrix(true);
            
            // 子メッシュのワールドマトリックスも更新
            const childMeshes = clonedMesh.getChildMeshes();
            childMeshes.forEach(child => {
                child.computeWorldMatrix(true);
            });
            
            // 車両タイプを識別するためのメタデータを設定
            clonedMesh.metadata = {
                type: 'vehicle',
                vehicleType: this.selectedVehicle.name,
                originalScale: this.vehicleScale,
                isPlacedAsset: true,
                isVehicle: true,
                isAsset: true,
                placementTime: Date.now()
            };
            
            // 親メッシュのバウンディングを子メッシュから再計算
            this.recalculateParentBounding(clonedMesh);
            
            // バウンディング情報を強制更新
            clonedMesh.refreshBoundingInfo();
            
            // 車両の底が床に接するように高さを調整
            const boundingInfo = clonedMesh.getBoundingInfo();
            if (boundingInfo) {
                const minY = boundingInfo.boundingBox.minimumWorld.y;
                if (minY < position.y) {
                    // 車両が床にめり込んでいる場合、持ち上げる
                    const offset = position.y - minY;
                    clonedMesh.position.y += offset;
                    console.log(`車両の高さを調整: +${offset.toFixed(3)}`);
                }
            }

            // バウンディング情報をログ出力
            this.logVehicleBoundingInfo(clonedMesh);

            // 子メッシュにも親アセットの参照を設定
            if (clonedMesh.getChildMeshes) {
                const childMeshes = clonedMesh.getChildMeshes();
                childMeshes.forEach(child => {
                    child.metadata = {
                        ...child.metadata,
                        parentAsset: clonedMesh,
                        isPartOfVehicle: true,
                        isPartOfAsset: true  // この行を追加
                    };
                    // 子メッシュも選択可能にする
                    child.isPickable = true;
                });
                console.log(`Set parentAsset metadata for ${childMeshes.length} child meshes`);
            }

            // 配置済み車両として保存
            this.placedVehicleMesh = clonedMesh;

            // 影の設定
            this.setupVehicleShadows(clonedMesh);

            console.log(`Placed vehicle ${this.selectedVehicle.displayName} at position:`, position);
            
            // フォーカスボタンを有効化するためにUI更新
            this.updateVehicleInfo();
            
            return clonedMesh;

        } catch (error) {
            console.error('Error placing vehicle:', error);
            this.errorHandler.handleError(error, 'VehicleManager.placeVehicle');
            return null;
        }
    }

    /**
     * 配置済み車両を取得
     * @returns {BABYLON.AbstractMesh|null}
     */
    getPlacedVehicle() {
        return this.placedVehicleMesh;
    }

    /**
     * プレビューを表示
     * @param {BABYLON.Vector3} position 
     */
    showPreview(position) {
        if (!this.currentVehicleMesh) return;

        // 既存のプレビューを削除
        this.hidePreview();

        // プレビューメッシュを作成
        this.previewMesh = this.currentVehicleMesh.clone(`preview_vehicle_${this.selectedVehicle.name}`);
        this.previewMesh.scaling = new BABYLON.Vector3(this.vehicleScale, this.vehicleScale, this.vehicleScale);
        this.previewMesh.position = position.clone();
        this.previewMesh.setEnabled(true);
        
        // バウンディング情報を更新
        this.previewMesh.refreshBoundingInfo();
        
        // プレビューの高さも調整
        const boundingInfo = this.previewMesh.getBoundingInfo();
        if (boundingInfo) {
            const minY = boundingInfo.boundingBox.minimumWorld.y;
            if (minY < position.y) {
                const offset = position.y - minY;
                this.previewMesh.position.y += offset;
            }
        }

        // プレビュー用に半透明にする
        this.makePreviewTransparent(this.previewMesh);
        
        // ピッキング無効（子メッシュも含む）
        this.previewMesh.isPickable = false;
        if (this.previewMesh.getChildMeshes) {
            this.previewMesh.getChildMeshes().forEach(child => {
                child.isPickable = false;
            });
        }
    }

    /**
     * プレビューを非表示
     */
    hidePreview() {
        if (this.previewMesh) {
            this.previewMesh.dispose();
            this.previewMesh = null;
        }
    }

    /**
     * メッシュを半透明にする（プレビュー用）
     * @param {BABYLON.AbstractMesh} mesh 
     */
    makePreviewTransparent(mesh) {
        // 全ての子メッシュを含めて半透明にする
        const allMeshes = [mesh];
        if (mesh.getChildMeshes) {
            allMeshes.push(...mesh.getChildMeshes());
        }

        allMeshes.forEach(childMesh => {
            if (childMesh.material) {
                // マテリアルをクローンして半透明にする
                const originalMaterial = childMesh.material;
                const previewMaterial = originalMaterial.clone(`preview_${originalMaterial.name}`);
                previewMaterial.alpha = 0.5;
                
                // エミッシブカラーを設定してハイライト効果
                if (previewMaterial.emissiveColor) {
                    previewMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1.0);
                }
                
                childMesh.material = previewMaterial;
            }
        });
    }

    /**
     * 配置済み車両を取得
     * @returns {BABYLON.AbstractMesh|null}
     */
    getPlacedVehicle() {
        return this.placedVehicleMesh;
    }

    /**
     * 車両が選択されているかチェック
     * @returns {boolean}
     */
    hasSelectedVehicle() {
        return this.selectedVehicle !== null && this.currentVehicleMesh !== null;
    }

    /**
     * 現在選択されている車両を取得
     * @returns {Object|null}
     */
    getSelectedVehicle() {
        return this.selectedVehicle;
    }

    /**
     * 現在の車両メッシュを取得
     * @returns {BABYLON.AbstractMesh|null}
     */
    getCurrentVehicleMesh() {
        return this.currentVehicleMesh;
    }

    /**
     * ローディング状態を取得
     * @returns {boolean}
     */
    isLoadingVehicle() {
        return this.isLoading;
    }

    /**
     * 利用可能な車両リストを取得
     * @returns {Object}
     */
    getAvailableVehicles() {
        return this.availableVehicles;
    }

    /**
     * 車両をリセット
     */
    resetVehicle() {
        if (this.currentVehicleMesh) {
            this.currentVehicleMesh.dispose();
            this.currentVehicleMesh = null;
        }
        
        this.selectedVehicle = null;
        this.updateVehicleInfo();
    }

    /**
     * 車両のスケールを設定
     * @param {number} scale 
     */
    setVehicleScale(scale) {
        this.vehicleScale = scale;
        
        // 現在の車両メッシュのスケールを更新
        if (this.currentVehicleMesh) {
            this.currentVehicleMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        }
        
        // 配置済み車両のスケールを更新
        if (this.placedVehicleMesh) {
            this.placedVehicleMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
            this.placedVehicleMesh.metadata.originalScale = scale;
        }
        
        // プレビューメッシュのスケールを更新
        if (this.previewMesh) {
            this.previewMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        }
    }
    
    /**
     * 現在の車両スケールを取得
     * @returns {number}
     */
    getVehicleScale() {
        return this.vehicleScale;
    }

    /**
     * 親メッシュのバウンディングを子メッシュから再計算
     * @param {BABYLON.AbstractMesh} parentMesh - 親メッシュ
     */
    recalculateParentBounding(parentMesh) {
        try {
            const childMeshes = parentMesh.getChildMeshes ? parentMesh.getChildMeshes() : [];
            
            if (childMeshes.length === 0) {
                console.log(`車両 ${parentMesh.name} に子メッシュがありません - バウンディング再計算をスキップ`);
                return;
            }

            console.log(`🔄 車両 ${parentMesh.name} のバウンディングを再計算中... (子メッシュ: ${childMeshes.length}個)`);

            // 子メッシュの中でジオメトリを持つものを探す
            const meshesWithGeometry = childMeshes.filter(child => 
                child.geometry && child.getVerticesData && child.getVerticesData(BABYLON.VertexBuffer.PositionKind)
            );

            if (meshesWithGeometry.length === 0) {
                console.log(`車両 ${parentMesh.name} の子メッシュにジオメトリが見つかりません`);
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
                // 親メッシュの逆変換マトリックスを使用して正確な変換を行う
                parentMesh.computeWorldMatrix(true);
                const parentWorldMatrix = parentMesh.getWorldMatrix();
                const inverseMatrix = parentWorldMatrix.clone().invert();
                
                // ワールド座標からローカル座標への正確な変換
                const localMin = BABYLON.Vector3.TransformCoordinates(globalMin, inverseMatrix);
                const localMax = BABYLON.Vector3.TransformCoordinates(globalMax, inverseMatrix);
                
                console.log(`  変換前ワールド座標: Min(${globalMin.x.toFixed(3)}, ${globalMin.y.toFixed(3)}, ${globalMin.z.toFixed(3)})`);
                console.log(`  変換後ローカル座標: Min(${localMin.x.toFixed(3)}, ${localMin.y.toFixed(3)}, ${localMin.z.toFixed(3)})`)

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
                
                console.log(`✅ 車両 ${parentMesh.name} のバウンディングを再計算完了:`);
                console.log(`  新しいローカル範囲: (${boundingMin.x.toFixed(3)}, ${boundingMin.y.toFixed(3)}, ${boundingMin.z.toFixed(3)}) - 
                    (${boundingMax.x.toFixed(3)}, ${boundingMax.y.toFixed(3)}, ${boundingMax.z.toFixed(3)})`);
                console.log(`  新しいワールド範囲: (${globalMin.x.toFixed(3)}, ${globalMin.y.toFixed(3)}, ${globalMin.z.toFixed(3)}) - 
                    (${globalMax.x.toFixed(3)}, ${globalMax.y.toFixed(3)}, ${globalMax.z.toFixed(3)})`);
                    
                // バウンディング半径も計算
                const center = boundingMin.add(boundingMax).scale(0.5);
                const radius = BABYLON.Vector3.Distance(center, boundingMax);
                console.log(`  計算された半径: ${radius.toFixed(3)}`);

            } else {
                console.warn(`車両 ${parentMesh.name} のバウンディング再計算に失敗 - 有効な子メッシュがありません`);
            }

        } catch (error) {
            console.error(`❌ 車両 ${parentMesh.name} のバウンディング再計算中にエラー:`, error);
        }
    }

    /**
     * 車両の影を設定
     * @param {BABYLON.AbstractMesh} vehicleMesh - 車両メッシュ
     */
    setupVehicleShadows(vehicleMesh) {
        try {
            // LightingSystemを取得
            const lightingSystem = this.app?.getManager?.('lighting');
            if (!lightingSystem || !lightingSystem.getShadowGenerator()) {
                console.warn('影の設定をスキップ: ShadowGeneratorが利用できません');
                return;
            }

            // 親メッシュをシャドウキャスターとして追加
            lightingSystem.addShadowCaster(vehicleMesh);
            
            // 子メッシュもシャドウキャスターとして追加
            const childMeshes = vehicleMesh.getChildMeshes();
            childMeshes.forEach(child => {
                // ジオメトリを持つメッシュのみシャドウキャスターとして追加
                if (child.geometry && child.isVisible) {
                    lightingSystem.addShadowCaster(child);
                }
            });

            console.log(`車両 ${vehicleMesh.name} を影キャスターとして設定`);
            
            // デバッグ用: 車両配置後に影の診断を実行
            setTimeout(() => {
                console.log('=== 車両配置後の影診断 ===');
                lightingSystem.diagnoseShadows();
                
                // 床が影を受け取るようになっているか確認
                const ground = this.scene.getMeshByName('defaultGround') || this.scene.getMeshByName('floor');
                if (ground) {
                    console.log(`床メッシュ ${ground.name} - receiveShadows: ${ground.receiveShadows}`);
                    if (!ground.receiveShadows) {
                        console.warn('⚠️ 床が影を受け取る設定になっていません！');
                    }
                }
            }, 500);

        } catch (error) {
            console.error('車両の影設定中にエラー:', error);
        }
    }

    /**
     * 車両のバウンディング情報をログに出力
     * @param {BABYLON.AbstractMesh} vehicleMesh - 車両メッシュ
     */
    logVehicleBoundingInfo(vehicleMesh) {
        try {
            console.log(`🚗 車両バウンディング情報 [${vehicleMesh.name}]:`);
            
            // 車両のスケール情報
            const scale = vehicleMesh.scaling;
            console.log(`  スケール: (${scale.x.toFixed(3)}, ${scale.y.toFixed(3)}, ${scale.z.toFixed(3)}) - ${Math.round(scale.x * 100)}%`);
            console.log(`  位置: (${vehicleMesh.position.x.toFixed(3)}, ${vehicleMesh.position.y.toFixed(3)}, ${vehicleMesh.position.z.toFixed(3)})`);
            
            // メインメッシュのバウンディング情報
            const boundingInfo = vehicleMesh.getBoundingInfo();
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
            const childMeshes = vehicleMesh.getChildMeshes ? vehicleMesh.getChildMeshes() : [];
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
            console.log(`    選択可能: ${vehicleMesh.isPickable}`);
            console.log(`    有効: ${vehicleMesh.isEnabled()}`);
            console.log(`    可視: ${vehicleMesh.visibility}`);
            console.log(`    ジオメトリ有り: ${!!vehicleMesh.geometry}`);
            
        } catch (error) {
            console.error(`❌ 車両バウンディング情報の取得に失敗 [${vehicleMesh.name}]:`, error);
        }
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        if (this.currentVehicleMesh) {
            this.currentVehicleMesh.dispose();
        }
        
        if (this.placedVehicleMesh) {
            this.placedVehicleMesh.dispose();
        }
        
        this.hidePreview();
        
        this.currentVehicleMesh = null;
        this.placedVehicleMesh = null;
        this.selectedVehicle = null;
        this.scene = null;
        this.assetLoader = null;
        this.errorHandler = null;
    }
}