// js/assets/UploadManager.js
/**
 * GLBファイルのアップロードと管理を行うクラス
 */

export class UploadManager {
    constructor(scene, assetPlacer, errorHandler) {
        this.scene = scene;
        this.assetPlacer = assetPlacer;
        this.errorHandler = errorHandler;
        
        // InteractionManagerの参照（後で設定される）
        this.interactionManager = null;
        
        // アップロードされたアセットの管理
        this.uploadedAssets = new Map(); // key: assetId, value: { name, url, blob, info }
        this.uploadCounter = 0;
        
        // ファイル制限
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedExtensions = ['.glb', '.gltf'];
        
        // UI要素
        this.fileInput = null;
        this.uploadBtn = null;
        this.statusDiv = null;
        this.assetsList = null;
        
        // 配置状態
        this.activeAssetId = null;
    }
    
    /**
     * InteractionManagerの参照を設定
     * @param {InteractionManager} interactionManager 
     */
    setInteractionManager(interactionManager) {
        this.interactionManager = interactionManager;
    }

    /**
     * アップロードマネージャーを初期化
     */
    initialize() {
        try {
            // DOM要素を取得
            this.fileInput = document.getElementById('glbFileInput');
            this.uploadBtn = document.getElementById('uploadBtn');
            this.statusDiv = document.getElementById('uploadStatus');
            this.assetsList = document.getElementById('uploadedAssetsList');
            
            if (!this.fileInput || !this.uploadBtn || !this.statusDiv || !this.assetsList) {
                throw new Error('アップロード機能の必要なDOM要素が見つかりません');
            }
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            console.log("UploadManager initialized successfully");
            
        } catch (error) {
            this.errorHandler.handleError(error, 'UploadManager.initialize');
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // アップロードボタンクリック
        this.uploadBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // ファイル選択時
        this.fileInput.addEventListener('change', (event) => {
            const files = Array.from(event.target.files);
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });
        
        // ドラッグ&ドロップ対応
        this.setupDragAndDrop();
    }

    /**
     * ドラッグ&ドロップ機能を設定
     */
    setupDragAndDrop() {
        const uploadSection = document.querySelector('.upload-section');
        if (!uploadSection) return;
        
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        });
        
        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.style.backgroundColor = '';
        });
        
        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.backgroundColor = '';
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                this.allowedExtensions.some(ext => 
                    file.name.toLowerCase().endsWith(ext)
                )
            );
            
            if (files.length > 0) {
                this.handleFileUpload(files);
            } else {
                this.showStatus('GLBまたはGLTFファイルのみアップロード可能です', 'error');
            }
        });
    }

    /**
     * ファイルアップロードを処理
     * @param {File[]} files - アップロードするファイル
     */
    async handleFileUpload(files) {
        this.showStatus('ファイルを処理中...', 'loading');
        
        try {
            let successCount = 0;
            
            for (const file of files) {
                // ファイルバリデーション
                const validation = this.validateFile(file);
                if (!validation.isValid) {
                    this.showStatus(`${file.name}: ${validation.error}`, 'error');
                    continue;
                }
                
                // ファイルを処理
                const result = await this.processFile(file);
                if (result.success) {
                    successCount++;
                    console.log(`✅ アップロード成功: ${file.name}`);
                } else {
                    this.showStatus(`${file.name}: ${result.error}`, 'error');
                }
            }
            
            if (successCount > 0) {
                this.showStatus(`${successCount}個のファイルをアップロードしました`, 'success');
                this.updateAssetsList();
            }
            
            // ファイル入力をリセット
            this.fileInput.value = '';
            
        } catch (error) {
            this.showStatus('アップロード中にエラーが発生しました', 'error');
            this.errorHandler.handleError(error, 'UploadManager.handleFileUpload');
        }
    }

    /**
     * ファイルをバリデーション
     * @param {File} file - バリデーションするファイル
     * @returns {Object} バリデーション結果
     */
    validateFile(file) {
        // ファイルサイズチェック
        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `ファイルサイズが大きすぎます (最大: ${Math.round(this.maxFileSize / 1024 / 1024)}MB)`
            };
        }
        
        // 拡張子チェック
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.allowedExtensions.includes(extension)) {
            return {
                isValid: false,
                error: `サポートされていないファイル形式です (対応: ${this.allowedExtensions.join(', ')})`
            };
        }
        
        return { isValid: true };
    }

    /**
     * ファイルを処理してアセットとして登録
     * @param {File} file - 処理するファイル
     * @returns {Promise<Object>} 処理結果
     */
    async processFile(file) {
        try {
            // ファイルをBlobURLに変換
            const blob = new Blob([file], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            // アセットIDを生成
            const assetId = `uploaded_${this.uploadCounter++}`;
            const displayName = file.name.replace(/\.[^/.]+$/, ""); // 拡張子を除去
            
            // メッシュをテストロード（バリデーション目的）
            try {
                await this.testLoadMesh(url, file.name);
            } catch (loadError) {
                URL.revokeObjectURL(url);
                throw new Error('3Dモデルの読み込みに失敗しました');
            }
            
            // アセット情報を保存
            const assetInfo = {
                id: assetId,
                name: displayName,
                originalFileName: file.name,
                url: url,
                blob: blob,
                size: file.size,
                uploadTime: Date.now(),
                scale: 0.1 // デフォルトスケール（10%）
            };
            
            this.uploadedAssets.set(assetId, assetInfo);
            
            console.log(`📦 アセット登録: ${displayName} (${assetId})`);
            
            return {
                success: true,
                assetId: assetId,
                name: displayName
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * メッシュのテストロード
     * @param {string} url - テストするURL
     * @param {string} filename - ファイル名（拡張子判定用）
     * @returns {Promise<void>}
     */
    async testLoadMesh(url, filename) {
        return new Promise((resolve, reject) => {
            // ファイル拡張子を取得
            const extension = filename.toLowerCase().split('.').pop();
            const fileExtension = extension === 'gltf' ? '.gltf' : '.glb';
            
            BABYLON.SceneLoader.ImportMesh(
                "",
                "",
                url,
                this.scene,
                (meshes) => {
                    if (meshes.length === 0) {
                        reject(new Error('有効なメッシュが見つかりません'));
                        return;
                    }
                    
                    // テスト用なので即座に削除
                    meshes.forEach(mesh => mesh.dispose());
                    resolve();
                },
                null, // onProgress
                (scene, message) => {
                    reject(new Error(`ロードエラー: ${message}`));
                },
                fileExtension // ファイル拡張子を明示的に指定
            );
        });
    }

    /**
     * アップロードされたアセットを配置用にロード
     * @param {string} assetId - アセットID
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {Promise<BABYLON.Mesh>} 配置されたメッシュ
     */
    async placeUploadedAsset(assetId, position) {
        const assetInfo = this.uploadedAssets.get(assetId);
        if (!assetInfo) {
            throw new Error(`アセットが見つかりません: ${assetId}`);
        }
        
        try {
            const timestamp = Date.now();
            const instanceName = `${assetInfo.name}_${timestamp}`;
            
            // メッシュをロード
            const mesh = await this.loadMeshFromUrl(assetInfo.url, instanceName, assetInfo.originalFileName);
            
            // 位置を設定
            mesh.position = position.clone();
            
            // スケールを適用 (AssetPlacerのデフォルトスケールを優先)
            const scale = this.assetPlacer.getUploadedAssetScale(assetId) || assetInfo.scale;
            mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
            
            // インタラクション設定
            this.setupMeshInteraction(mesh, assetId);
            
            // 床面に配置
            this.assetPlacer.positionAssetOnFloor(mesh, position);
            
            // 影を設定
            this.assetPlacer.setupShadow(mesh);
            
            console.log(`🎯 アップロードアセット配置: ${instanceName} at (${position.x.toFixed(2)}, ${position.z.toFixed(2)})`);
            
            return mesh;
            
        } catch (error) {
            throw new Error(`アセットの配置に失敗: ${error.message}`);
        }
    }

    /**
     * URLからメッシュをロード
     * @param {string} url - ロードするURL
     * @param {string} name - メッシュ名
     * @param {string} filename - ファイル名（拡張子判定用）
     * @returns {Promise<BABYLON.Mesh>} ロードされたメッシュ
     */
    async loadMeshFromUrl(url, name, filename) {
        return new Promise((resolve, reject) => {
            // ファイル拡張子を取得
            const extension = filename.toLowerCase().split('.').pop();
            const fileExtension = extension === 'gltf' ? '.gltf' : '.glb';
            
            BABYLON.SceneLoader.ImportMesh(
                "",
                "",
                url,
                this.scene,
                (meshes) => {
                    if (meshes.length === 0) {
                        reject(new Error('メッシュが見つかりません'));
                        return;
                    }
                    
                    // 適切な親メッシュを取得
                    let mainMesh = meshes[0];
                    const rootMesh = meshes.find(mesh => mesh.parent === null);
                    if (rootMesh) {
                        mainMesh = rootMesh;
                    }
                    
                    mainMesh.name = name;
                    resolve(mainMesh);
                },
                null, // onProgress
                (scene, message) => {
                    reject(new Error(`ロードエラー: ${message}`));
                },
                fileExtension // ファイル拡張子を明示的に指定
            );
        });
    }

    /**
     * メッシュのインタラクションを設定
     * @param {BABYLON.Mesh} mesh - 設定するメッシュ
     * @param {string} assetId - 元のアセットID
     */
    setupMeshInteraction(mesh, assetId) {
        // メインメッシュの設定
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.renderingGroupId = 0;
        
        // 子メッシュの設定
        const childMeshes = mesh.getChildMeshes();
        childMeshes.forEach((childMesh, index) => {
            childMesh.isPickable = true;
            childMesh.receiveShadows = true;
            
            // ユニークな名前を設定
            childMesh.name = `${mesh.name}_child${index}_${childMesh.name}`;
            
            // 親メッシュへの参照を設定
            childMesh.metadata = {
                parentAsset: mesh,
                isChildMesh: true,
                parentName: mesh.name,
                isUploadedAsset: true,
                originalAssetId: assetId
            };
        });
        
        // メッシュのメタデータを設定
        mesh.metadata = {
            isAsset: true,
            canMove: true,
            assetName: mesh.name,
            placementTime: Date.now(),
            isUploadedAsset: true,
            originalAssetId: assetId
        };
    }

    /**
     * アセットリストUIを更新
     */
    updateAssetsList() {
        if (!this.assetsList) return;
        
        // リストをクリア
        this.assetsList.innerHTML = '';
        
        if (this.uploadedAssets.size === 0) {
            this.assetsList.innerHTML = '<div class="no-assets">GLBファイルをアップロードしてください</div>';
            return;
        }
        
        // アセットボタンを作成
        this.uploadedAssets.forEach((assetInfo, assetId) => {
            const assetContainer = document.createElement('div');
            assetContainer.className = 'uploaded-asset-item';
            
            // 配置ボタン
            const assetButton = document.createElement('button');
            assetButton.className = 'uploaded-asset-btn';
            assetButton.textContent = assetInfo.name;
            assetButton.title = `${assetInfo.originalFileName} (${(assetInfo.size / 1024 / 1024).toFixed(2)}MB)`;
            
            // クリックで配置モードに
            assetButton.addEventListener('click', () => {
                this.activateAssetPlacement(assetId, assetButton);
            });
            
            // スケール調整スライダー
            const scaleContainer = document.createElement('div');
            scaleContainer.className = 'scale-control-container';
            
            const scaleLabel = document.createElement('label');
            scaleLabel.textContent = `サイズ: ${Math.round(assetInfo.scale * 100)}%`;
            scaleLabel.className = 'scale-label';
            
            const scaleSlider = document.createElement('input');
            scaleSlider.type = 'range';
            scaleSlider.min = '0.01';
            scaleSlider.max = '2.0';
            scaleSlider.step = '0.01';
            scaleSlider.value = assetInfo.scale;
            scaleSlider.className = 'scale-slider';
            
            // スライダー変更時の処理
            scaleSlider.addEventListener('input', (e) => {
                const newScale = parseFloat(e.target.value);
                assetInfo.scale = newScale;
                scaleLabel.textContent = `サイズ: ${Math.round(newScale * 100)}%`;
                
                // 既に配置されたこのアセットのメッシュのスケールを更新
                this.assetPlacer.updateUploadedAssetTypeScale(assetId, newScale);
            });
            
            scaleContainer.appendChild(scaleLabel);
            scaleContainer.appendChild(scaleSlider);
            
            // 削除ボタン
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-asset-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'アセットを削除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeAsset(assetId);
            });
            
            assetContainer.appendChild(assetButton);
            assetContainer.appendChild(scaleContainer);
            assetContainer.appendChild(deleteBtn);
            this.assetsList.appendChild(assetContainer);
        });
    }

    /**
     * アセットの配置モードを有効化
     * @param {string} assetId - アセットID
     * @param {HTMLElement} button - クリックされたボタン
     */
    activateAssetPlacement(assetId, button) {
        console.log(`🎯 activateAssetPlacement呼び出し: ${assetId}`);
        const assetInfo = this.uploadedAssets.get(assetId);
        if (!assetInfo) {
            console.error(`❌ アセット情報が見つかりません: ${assetId}`);
            return;
        }
        console.log(`✅ アセット情報取得成功: ${assetInfo.name}`);
        
        // 他のボタンを非アクティブに
        document.querySelectorAll('.uploaded-asset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 既存のアセットボタンも非アクティブに
        document.querySelectorAll('#cubeBtn, #recordBtn, #juiceBoxBtn, #mikeDeskBtn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 選択されたボタンをアクティブに
        button.classList.add('active');
        this.activeAssetId = assetId;
        console.log(`📝 activeAssetId設定: ${this.activeAssetId}`);
        
        // InteractionManagerに配置モードを設定
        if (this.interactionManager) {
            this.interactionManager.setPlacementMode('uploaded_asset');
            console.log(`📍 InteractionManagerに配置モード設定: uploaded_asset`);
        }
        
        this.showStatus(`${assetInfo.name}の配置モード`, 'info');
        
        console.log(`📍 配置モード有効: ${assetInfo.name}`);
    }

    /**
     * 配置済みアセットのスケールを更新
     * @param {string} assetId - アセットID
     * @param {number} newScale - 新しいスケール値
     */
    updatePlacedAssetsScale(assetId, newScale) {
        // シーン内の全メッシュを検索して、このアセットIDのものを更新
        this.scene.meshes.forEach(mesh => {
            if (mesh.metadata && 
                mesh.metadata.isUploadedAsset && 
                mesh.metadata.originalAssetId === assetId) {
                mesh.scaling = new BABYLON.Vector3(newScale, newScale, newScale);
                console.log(`🔄 メッシュスケール更新: ${mesh.name} -> ${Math.round(newScale * 100)}%`);
            }
        });
    }

    /**
     * アセットを削除
     * @param {string} assetId - アセットID
     */
    removeAsset(assetId) {
        const assetInfo = this.uploadedAssets.get(assetId);
        if (!assetInfo) return;
        
        // 確認ダイアログ
        if (!confirm(`アセット "${assetInfo.name}" を削除しますか？`)) {
            return;
        }
        
        // URLを解放
        if (assetInfo.url) {
            URL.revokeObjectURL(assetInfo.url);
        }
        
        // アセット情報を削除
        this.uploadedAssets.delete(assetId);
        
        // アクティブなアセットだった場合はクリア
        if (this.activeAssetId === assetId) {
            this.activeAssetId = null;
        }
        
        // UIを更新
        this.updateAssetsList();
        
        this.showStatus(`"${assetInfo.name}" を削除しました`, 'info');
        
        console.log(`🗑️ アセット削除: ${assetInfo.name}`);
    }

    /**
     * 現在アクティブなアセットIDを取得
     * @returns {string|null} アクティブなアセットID
     */
    getActiveAssetId() {
        console.log(`🔍 getActiveAssetId呼び出し: ${this.activeAssetId}`);
        return this.activeAssetId;
    }

    /**
     * 配置モードをリセット
     */
    resetPlacementMode() {
        console.log(`🔄 resetPlacementMode呼び出し - 前の値: ${this.activeAssetId}`);
        this.activeAssetId = null;
        document.querySelectorAll('.uploaded-asset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        console.log(`🔄 resetPlacementMode完了 - 新しい値: ${this.activeAssetId}`);
    }

    /**
     * ステータスメッセージを表示
     * @param {string} message - メッセージ
     * @param {string} type - メッセージタイプ
     */
    showStatus(message, type = 'info') {
        if (!this.statusDiv) return;
        
        this.statusDiv.textContent = message;
        this.statusDiv.className = `upload-status ${type}`;
        
        // 自動的にクリア（エラー以外）
        if (type !== 'error') {
            setTimeout(() => {
                if (this.statusDiv) {
                    this.statusDiv.textContent = '';
                    this.statusDiv.className = 'upload-status';
                }
            }, 3000);
        }
    }

    /**
     * アップロード済みアセットの一覧を取得
     * @returns {Map} アセット一覧
     */
    getUploadedAssets() {
        return new Map(this.uploadedAssets);
    }

    /**
     * 特定のアセット情報を取得
     * @param {string} assetId - アセットID
     * @returns {Object|null} アセット情報
     */
    getAssetInfo(assetId) {
        return this.uploadedAssets.get(assetId) || null;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing UploadManager...");
        
        // すべてのBlobURLを解放
        this.uploadedAssets.forEach(assetInfo => {
            if (assetInfo.url) {
                URL.revokeObjectURL(assetInfo.url);
            }
        });
        
        this.uploadedAssets.clear();
        this.activeAssetId = null;
    }
}