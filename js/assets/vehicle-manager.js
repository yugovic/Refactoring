// js/assets/vehicle-manager.js
/**
 * 車両選択とロードを管理するクラス
 */

export class VehicleManager {
    constructor(scene, assetLoader, errorHandler) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.errorHandler = errorHandler;
        
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
        
        if (vehicleInfo && currentVehicleName) {
            if (this.selectedVehicle) {
                vehicleInfo.style.display = 'block';
                currentVehicleName.textContent = this.selectedVehicle.displayName;
            } else {
                vehicleInfo.style.display = 'none';
                currentVehicleName.textContent = '車両が選択されていません';
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
            
            // 位置を設定
            clonedMesh.position = position.clone();
            
            // スケールを設定
            clonedMesh.scaling = new BABYLON.Vector3(this.vehicleScale, this.vehicleScale, this.vehicleScale);
            
            // メッシュを有効化
            clonedMesh.setEnabled(true);
            
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

            console.log(`Placed vehicle ${this.selectedVehicle.displayName} at position:`, position);
            
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
        this.previewMesh.position = position.clone();
        this.previewMesh.scaling = new BABYLON.Vector3(this.vehicleScale, this.vehicleScale, this.vehicleScale);
        this.previewMesh.setEnabled(true);

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