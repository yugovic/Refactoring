// js/environment/texture-manager.js
/**
 * ルームのテクスチャーを管理するクラス
 */

export class TextureManager {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // メモリ管理設定
        this.maxCacheSize = 30; // 最大キャッシュ数
        this.cacheAccessTime = new Map(); // キャッシュへのアクセス時間を記録
        
        // テクスチャープリセット定義
        this.TEXTURE_PRESETS = {
            floor: {
                default: {
                    name: 'デフォルト',
                    type: 'color',
                    color: '#CCCCCC',
                    specular: '#000000'
                },
                concreteTexture: {
                    name: 'コンクリート（画像）',
                    type: 'image',
                    url: './assets/Texture/TextureConcreat.jpg',
                    scale: 0.125
                },
                woodLight: {
                    name: '明るい木目',
                    type: 'procedural',
                    baseColor: '#DEB887',
                    pattern: 'wood',
                    scale: 5
                },
                woodDark: {
                    name: '暗い木目',
                    type: 'procedural',
                    baseColor: '#8B4513',
                    pattern: 'wood',
                    scale: 5
                },
                tileWhite: {
                    name: '白タイル',
                    type: 'procedural',
                    baseColor: '#F0F0F0',
                    pattern: 'tile',
                    scale: 10
                },
                tileGray: {
                    name: 'グレータイル',
                    type: 'procedural',
                    baseColor: '#808080',
                    pattern: 'tile',
                    scale: 10
                },
                carpet: {
                    name: 'カーペット',
                    type: 'procedural',
                    baseColor: '#8B6969',
                    pattern: 'noise',
                    scale: 20
                },
                concrete: {
                    name: 'コンクリート',
                    type: 'color',
                    color: '#A0A0A0',
                    specular: '#202020'
                },
                marble: {
                    name: '大理石',
                    type: 'procedural',
                    baseColor: '#EEEEEE',
                    pattern: 'marble',
                    scale: 3
                }
            },
            wall: {
                default: {
                    name: 'デフォルト',
                    type: 'color',
                    color: '#E0E0E0',
                    specular: '#000000',
                    alpha: 0.8
                },
                paintWhite: {
                    name: '白い壁',
                    type: 'color',
                    color: '#FFFFFF',
                    specular: '#050505',
                    alpha: 0.9
                },
                paintBeige: {
                    name: 'ベージュ',
                    type: 'color',
                    color: '#F5DEB3',
                    specular: '#050505',
                    alpha: 0.9
                },
                paintGray: {
                    name: 'グレー',
                    type: 'color',
                    color: '#B0B0B0',
                    specular: '#050505',
                    alpha: 0.9
                },
                concreteTexture: {
                    name: 'コンクリート（画像）',
                    type: 'image',
                    url: './assets/Texture/TextureConcreat.jpg',
                    scale: 0.125,
                    alpha: 0.9
                },
                brick: {
                    name: 'レンガ',
                    type: 'procedural',
                    baseColor: '#B22222',
                    pattern: 'brick',
                    scale: 8,
                    alpha: 0.9
                },
                woodPanel: {
                    name: '木目パネル',
                    type: 'procedural',
                    baseColor: '#DEB887',
                    pattern: 'wood',
                    scale: 3,
                    alpha: 0.9
                },
                concrete: {
                    name: 'コンクリート',
                    type: 'color',
                    color: '#808080',
                    specular: '#101010',
                    alpha: 0.9
                },
                wallpaper: {
                    name: 'ストライプ壁紙',
                    type: 'procedural',
                    baseColor: '#E6E6FA',
                    pattern: 'stripe',
                    scale: 10,
                    alpha: 0.9
                }
            }
        };
        
        // 現在の選択
        this.currentFloorTexture = 'default';
        this.currentWallTexture = 'default';
        
        // キャッシュされたテクスチャー
        this.textureCache = new Map();
    }
    
    /**
     * 床のテクスチャーを変更
     * @param {string} textureKey - テクスチャーキー
     * @param {BABYLON.Mesh} floorMesh - 床メッシュ
     */
    applyFloorTexture(textureKey, floorMesh) {
        try {
            const textureConfig = this.TEXTURE_PRESETS.floor[textureKey];
            if (!textureConfig) {
                console.error(`Floor texture not found: ${textureKey}`);
                return;
            }
            
            console.log(`Applying floor texture: ${textureConfig.name}`);
            
            // マテリアルを作成または取得
            const material = this.createMaterial(`floor_${textureKey}`, textureConfig, false);
            
            // 床に適用
            if (floorMesh) {
                floorMesh.material = material;
                this.currentFloorTexture = textureKey;
                console.log(`✅ Floor texture applied: ${textureConfig.name}`);
            }
            
        } catch (error) {
            this.errorHandler.handleError(error, 'TextureManager.applyFloorTexture');
        }
    }
    
    /**
     * 壁のテクスチャーを変更
     * @param {string} textureKey - テクスチャーキー
     * @param {Array<BABYLON.Mesh>} wallMeshes - 壁メッシュの配列
     */
    applyWallTexture(textureKey, wallMeshes) {
        try {
            const textureConfig = this.TEXTURE_PRESETS.wall[textureKey];
            if (!textureConfig) {
                console.error(`Wall texture not found: ${textureKey}`);
                return;
            }
            
            console.log(`Applying wall texture: ${textureConfig.name}`);
            
            // マテリアルを作成または取得
            const material = this.createMaterial(`wall_${textureKey}`, textureConfig, true);
            
            // すべての壁に適用
            if (wallMeshes && wallMeshes.length > 0) {
                wallMeshes.forEach(wall => {
                    wall.material = material;
                });
                this.currentWallTexture = textureKey;
                console.log(`✅ Wall texture applied to ${wallMeshes.length} walls: ${textureConfig.name}`);
            }
            
        } catch (error) {
            this.errorHandler.handleError(error, 'TextureManager.applyWallTexture');
        }
    }
    
    /**
     * マテリアルを作成
     * @param {string} materialName - マテリアル名
     * @param {Object} config - テクスチャー設定
     * @param {boolean} isWall - 壁かどうか
     * @returns {BABYLON.Material}
     */
    createMaterial(materialName, config, isWall) {
        // キャッシュから取得
        if (this.textureCache.has(materialName)) {
            // アクセス時間を更新
            this.cacheAccessTime.set(materialName, Date.now());
            return this.textureCache.get(materialName);
        }
        
        // キャッシュサイズチェック
        if (this.textureCache.size >= this.maxCacheSize) {
            this.cleanupOldestTextures();
        }
        
        const material = new BABYLON.StandardMaterial(materialName, this.scene);
        
        if (config.type === 'color') {
            // 単色マテリアル
            material.diffuseColor = BABYLON.Color3.FromHexString(config.color);
            if (config.specular) {
                material.specularColor = BABYLON.Color3.FromHexString(config.specular);
            }
        } else if (config.type === 'procedural') {
            // プロシージャルテクスチャー
            const texture = this.createProceduralTexture(materialName + '_texture', config);
            material.diffuseTexture = texture;
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        } else if (config.type === 'image') {
            // 画像テクスチャー
            const texture = new BABYLON.Texture(config.url, this.scene);
            texture.uScale = config.scale || 1;
            texture.vScale = config.scale || 1;
            material.diffuseTexture = texture;
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        }
        
        // 壁の場合は透明度を設定
        if (isWall && config.alpha !== undefined) {
            material.alpha = config.alpha;
            material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        }
        
        // 影を受ける設定
        material.receiveShadows = true;
        
        // キャッシュに保存
        this.textureCache.set(materialName, material);
        this.cacheAccessTime.set(materialName, Date.now());
        
        return material;
    }
    
    /**
     * プロシージャルテクスチャーを作成
     * @param {string} textureName - テクスチャー名
     * @param {Object} config - テクスチャー設定
     * @returns {BABYLON.Texture}
     */
    createProceduralTexture(textureName, config) {
        const textureSize = 512;
        const dynamicTexture = new BABYLON.DynamicTexture(textureName, textureSize, this.scene, false);
        const ctx = dynamicTexture.getContext();
        
        // ベースカラーを設定
        const baseColor = config.baseColor;
        
        switch (config.pattern) {
            case 'wood':
                this.generateWoodPattern(ctx, textureSize, baseColor);
                break;
            case 'tile':
                this.generateTilePattern(ctx, textureSize, baseColor);
                break;
            case 'brick':
                this.generateBrickPattern(ctx, textureSize, baseColor);
                break;
            case 'marble':
                this.generateMarblePattern(ctx, textureSize, baseColor);
                break;
            case 'stripe':
                this.generateStripePattern(ctx, textureSize, baseColor);
                break;
            case 'noise':
                this.generateNoisePattern(ctx, textureSize, baseColor);
                break;
            default:
                ctx.fillStyle = baseColor;
                ctx.fillRect(0, 0, textureSize, textureSize);
        }
        
        dynamicTexture.update();
        dynamicTexture.uScale = config.scale || 1;
        dynamicTexture.vScale = config.scale || 1;
        dynamicTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        dynamicTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        
        return dynamicTexture;
    }
    
    /**
     * 木目パターンを生成
     */
    generateWoodPattern(ctx, size, baseColor) {
        const baseRGB = this.hexToRgb(baseColor);
        
        // 木目の縞模様
        for (let y = 0; y < size; y++) {
            const variation = Math.sin(y * 0.05) * 30;
            const r = Math.max(0, Math.min(255, baseRGB.r + variation));
            const g = Math.max(0, Math.min(255, baseRGB.g + variation));
            const b = Math.max(0, Math.min(255, baseRGB.b + variation));
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(0, y, size, 1);
        }
        
        // 木目の節を追加
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = Math.random() * 20 + 10;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgb(${baseRGB.r * 0.6}, ${baseRGB.g * 0.6}, ${baseRGB.b * 0.6})`;
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
    
    /**
     * タイルパターンを生成
     */
    generateTilePattern(ctx, size, baseColor) {
        const tileSize = size / 8;
        const groutWidth = 4;
        const baseRGB = this.hexToRgb(baseColor);
        
        // タイルを描画
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);
        
        // グラウト（目地）を描画
        ctx.strokeStyle = `rgb(${baseRGB.r * 0.7}, ${baseRGB.g * 0.7}, ${baseRGB.b * 0.7})`;
        ctx.lineWidth = groutWidth;
        
        for (let i = 0; i <= 8; i++) {
            // 垂直線
            ctx.beginPath();
            ctx.moveTo(i * tileSize, 0);
            ctx.lineTo(i * tileSize, size);
            ctx.stroke();
            
            // 水平線
            ctx.beginPath();
            ctx.moveTo(0, i * tileSize);
            ctx.lineTo(size, i * tileSize);
            ctx.stroke();
        }
    }
    
    /**
     * レンガパターンを生成
     */
    generateBrickPattern(ctx, size, baseColor) {
        const brickWidth = size / 8;
        const brickHeight = size / 16;
        const mortarWidth = 3;
        const baseRGB = this.hexToRgb(baseColor);
        
        // 背景（モルタル）
        ctx.fillStyle = `rgb(${baseRGB.r * 0.5}, ${baseRGB.g * 0.5}, ${baseRGB.b * 0.5})`;
        ctx.fillRect(0, 0, size, size);
        
        // レンガを描画
        for (let row = 0; row < 16; row++) {
            const offset = row % 2 === 0 ? 0 : brickWidth / 2;
            
            for (let col = -1; col < 9; col++) {
                const x = col * brickWidth + offset;
                const y = row * brickHeight;
                
                // レンガの色にランダムな変化を加える
                const variation = (Math.random() - 0.5) * 20;
                const r = Math.max(0, Math.min(255, baseRGB.r + variation));
                const g = Math.max(0, Math.min(255, baseRGB.g + variation));
                const b = Math.max(0, Math.min(255, baseRGB.b + variation));
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(
                    x + mortarWidth / 2,
                    y + mortarWidth / 2,
                    brickWidth - mortarWidth,
                    brickHeight - mortarWidth
                );
            }
        }
    }
    
    /**
     * 大理石パターンを生成
     */
    generateMarblePattern(ctx, size, baseColor) {
        const baseRGB = this.hexToRgb(baseColor);
        
        // ベース色で塗りつぶし
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, size, size);
        
        // 大理石の筋を描画
        ctx.strokeStyle = `rgba(${baseRGB.r * 0.8}, ${baseRGB.g * 0.8}, ${baseRGB.b * 0.8}, 0.3)`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            const startX = Math.random() * size;
            const startY = Math.random() * size;
            ctx.moveTo(startX, startY);
            
            // 曲線を描く
            for (let j = 0; j < 5; j++) {
                const cpX = Math.random() * size;
                const cpY = Math.random() * size;
                const endX = Math.random() * size;
                const endY = Math.random() * size;
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
            }
            
            ctx.stroke();
        }
    }
    
    /**
     * ストライプパターンを生成
     */
    generateStripePattern(ctx, size, baseColor) {
        const stripeWidth = size / 16;
        const baseRGB = this.hexToRgb(baseColor);
        
        // ストライプを描画
        for (let i = 0; i < 16; i++) {
            if (i % 2 === 0) {
                ctx.fillStyle = baseColor;
            } else {
                ctx.fillStyle = `rgb(${baseRGB.r * 0.9}, ${baseRGB.g * 0.9}, ${baseRGB.b * 0.9})`;
            }
            ctx.fillRect(i * stripeWidth, 0, stripeWidth, size);
        }
    }
    
    /**
     * ノイズパターンを生成（カーペット用）
     */
    generateNoisePattern(ctx, size, baseColor) {
        const baseRGB = this.hexToRgb(baseColor);
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 40;
            data[i] = Math.max(0, Math.min(255, baseRGB.r + noise));
            data[i + 1] = Math.max(0, Math.min(255, baseRGB.g + noise));
            data[i + 2] = Math.max(0, Math.min(255, baseRGB.b + noise));
            data[i + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * HEXカラーをRGBに変換
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
    }
    
    /**
     * 現在の床テクスチャーを取得
     */
    getCurrentFloorTexture() {
        return this.currentFloorTexture;
    }
    
    /**
     * 現在の壁テクスチャーを取得
     */
    getCurrentWallTexture() {
        return this.currentWallTexture;
    }
    
    /**
     * テクスチャープリセットを取得
     */
    getTexturePresets() {
        return this.TEXTURE_PRESETS;
    }
    
    /**
     * 最も古いテクスチャーをクリーンアップ
     */
    cleanupOldestTextures() {
        try {
            // アクセス時間でソートして最も古いものから削除
            const sortedEntries = Array.from(this.cacheAccessTime.entries())
                .sort((a, b) => a[1] - b[1]);
            
            // 最大キャッシュサイズの20%を削除
            const deleteCount = Math.ceil(this.maxCacheSize * 0.2);
            
            for (let i = 0; i < deleteCount && i < sortedEntries.length; i++) {
                const [materialName] = sortedEntries[i];
                const material = this.textureCache.get(materialName);
                
                if (material) {
                    console.log(`🗑️ テクスチャーキャッシュをクリーンアップ: ${materialName}`);
                    
                    // テクスチャーを破棄
                    if (material.diffuseTexture) {
                        material.diffuseTexture.dispose();
                    }
                    material.dispose();
                    
                    // キャッシュから削除
                    this.textureCache.delete(materialName);
                    this.cacheAccessTime.delete(materialName);
                }
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'TextureManager.cleanupOldestTextures');
        }
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        // すべてのテクスチャーを破棄
        this.textureCache.forEach((material, key) => {
            if (material.diffuseTexture) {
                material.diffuseTexture.dispose();
            }
            material.dispose();
        });
        
        // キャッシュをクリア
        this.textureCache.clear();
        this.cacheAccessTime.clear();
        
        console.log('✅ TextureManager: すべてのリソースを破棄しました');
    }
}