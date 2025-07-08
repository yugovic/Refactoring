// js/environment/LightingSystem.js
/**
 * 照明と影のシステムを管理するクラス
 */

import { LIGHTING_SETTINGS, SHADOW_SETTINGS } from '../config/constants.js';
import { DEFAULT_SETTINGS } from '../config/default-settings.js';
import { hexToColor3 } from '../utils/color-utils.js';

export class LightingSystem {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // ライト
        this.ambientLight = null;
        this.directionalLight = null;
        this.rimLight = null;  // リムライトを追加
        this.pointLight1 = null;
        this.pointLight2 = null;
        
        // シャドウジェネレーター
        this.shadowGenerator = null;
        
        // 設定
        this.settings = {
            ambient: { ...DEFAULT_SETTINGS.lighting.ambient },
            directional: { ...DEFAULT_SETTINGS.lighting.directional },
            pointLight1: { ...DEFAULT_SETTINGS.lighting.pointLight1 },
            pointLight2: { ...DEFAULT_SETTINGS.lighting.pointLight2 },
            shadow: { ...DEFAULT_SETTINGS.lighting.shadow },
            reduceShininess: DEFAULT_SETTINGS.lighting.reduceShininess
        };
    }

    /**
     * ライティングをセットアップ
     */
    setupLights() {
        try {
            // 環境光を作成
            this.createAmbientLight();
            
            // 方向光源を作成
            this.createDirectionalLight();
            
            // リムライトを作成（Three.jsの例に合わせて）
            this.createRimLight();
            
            // ポイントライトを作成
            this.createPointLights();
            
            // 影の設定
            this.setupShadows();
            
            // メタリック効果を調整
            if (this.settings.reduceShininess) {
                setTimeout(() => {
                    this.adjustMaterialShininess(true);
                }, 1000);
            }
            
            console.log("Lighting system setup complete");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'LightingSystem.setupLights');
        }
    }

    /**
     * 環境光を作成
     */
    createAmbientLight() {
        this.ambientLight = new BABYLON.HemisphericLight(
            "ambientLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        
        // Three.jsの例に合わせて調整（0xfff2e5, 0x080820, 1.1）
        this.ambientLight.intensity = 0.8; // 明度を少し下げる
        this.ambientLight.diffuse = new BABYLON.Color3(1.0, 0.949, 0.898); // #fff2e5 (上からの光)
        this.ambientLight.specular = new BABYLON.Color3(0.1, 0.1, 0.15);
        this.ambientLight.groundColor = new BABYLON.Color3(0.01, 0.01, 0.02); // もっと暗い色に変更（ほぼ黒）
        
        console.log("Ambient light created with warm tone");
    }

    /**
     * 方向光源を作成
     */
    createDirectionalLight() {
        const dirSettings = LIGHTING_SETTINGS.DIRECTIONAL;
        
        this.directionalLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(
                dirSettings.DIRECTION.x,
                dirSettings.DIRECTION.y,
                dirSettings.DIRECTION.z
            ),
            this.scene
        );
        
        this.directionalLight.position = new BABYLON.Vector3(
            this.settings.directional.position.x,
            this.settings.directional.position.y,
            this.settings.directional.position.z
        );
        
        this.directionalLight.intensity = this.settings.directional.intensity;
        this.directionalLight.specular = new BABYLON.Color3(
            dirSettings.SPECULAR.r,
            dirSettings.SPECULAR.g,
            dirSettings.SPECULAR.b
        );
        
        // 影の投影設定
        this.directionalLight.shadowMinZ = 0.1;    // より近くから影を生成
        this.directionalLight.shadowMaxZ = 100;
        this.directionalLight.autoUpdateExtends = false;  // 手動で範囲を設定
        this.directionalLight.shadowOrthoScale = 2.0;     // 影の投影範囲を広げる
        
        // オルソグラフィック投影のサイズを明示的に設定
        this.directionalLight.orthoLeft = -20;
        this.directionalLight.orthoRight = 20;
        this.directionalLight.orthoTop = 20;
        this.directionalLight.orthoBottom = -20;
        
        console.log("Directional light created");
    }

    /**
     * リムライトを作成（Three.jsの例に合わせて）
     */
    createRimLight() {
        // Three.jsの例：rim.position.set(0, 1, 1);
        this.rimLight = new BABYLON.DirectionalLight(
            "rimLight",
            new BABYLON.Vector3(0, -1, -1), // Babylon.jsでは方向ベクトルを使用
            this.scene
        );
        
        this.rimLight.position = new BABYLON.Vector3(0, 1, 1);
        this.rimLight.intensity = 0.8;
        this.rimLight.diffuse = new BABYLON.Color3(1, 1, 1); // 白色
        this.rimLight.specular = new BABYLON.Color3(1, 1, 1);
        
        // 影は生成しない（リムライト効果のため）
        this.rimLight.shadowEnabled = false;
        
        console.log("Rim light created");
    }

    /**
     * ポイントライトを作成
     */
    createPointLights() {
        // ポイントライト1
        const pl1Settings = LIGHTING_SETTINGS.POINT_LIGHTS.LIGHT1;
        this.pointLight1 = new BABYLON.PointLight(
            "pointLight1",
            new BABYLON.Vector3(
                this.settings.pointLight1.position.x,
                this.settings.pointLight1.position.y,
                this.settings.pointLight1.position.z
            ),
            this.scene
        );
        
        this.pointLight1.diffuse = hexToColor3(this.settings.pointLight1.color);
        this.pointLight1.specular = new BABYLON.Color3(0.1, 0.1, 0.2);
        this.pointLight1.intensity = this.settings.pointLight1.intensity;
        this.pointLight1.radius = pl1Settings.RADIUS;
        
        // ポイントライト2
        const pl2Settings = LIGHTING_SETTINGS.POINT_LIGHTS.LIGHT2;
        this.pointLight2 = new BABYLON.PointLight(
            "pointLight2",
            new BABYLON.Vector3(
                this.settings.pointLight2.position.x,
                this.settings.pointLight2.position.y,
                this.settings.pointLight2.position.z
            ),
            this.scene
        );
        
        this.pointLight2.diffuse = hexToColor3(this.settings.pointLight2.color);
        this.pointLight2.specular = new BABYLON.Color3(0.1, 0.1, 0.2);
        this.pointLight2.intensity = this.settings.pointLight2.intensity;
        this.pointLight2.radius = pl2Settings.RADIUS;
        
        console.log("Point lights created");
    }

    /**
     * 影の設定
     */
    setupShadows() {
        console.log('=== 影の設定開始 ===');
        
        try {
            const shadowSettings = SHADOW_SETTINGS;
            
            console.log('影の設定値:', shadowSettings);
            console.log('方向光源:', this.directionalLight ? '存在' : '存在しない');
            
            if (!this.directionalLight) {
                console.error('方向光源が存在しないため、影を生成できません');
                return;
            }
            
            // より基本的な方法でShadowGeneratorを作成
            try {
                this.shadowGenerator = new BABYLON.ShadowGenerator(
                    shadowSettings.RESOLUTION, 
                    this.directionalLight
                );
                
                console.log('ShadowGenerator作成成功');
                
                // ライトの確認
                if (this.shadowGenerator.getLight) {
                    console.log('ShadowGeneratorのライト(getLight):', this.shadowGenerator.getLight());
                }
                
                // シャドウマップの確認
                const shadowMap = this.shadowGenerator.getShadowMap();
                if (shadowMap) {
                    console.log('シャドウマップが正常に作成されました');
                } else {
                    console.warn('シャドウマップの作成に失敗しました');
                }
                
            } catch (error) {
                console.error('ShadowGenerator作成エラー:', error);
                return;
            }
            
            // シャドウマップの設定（ブラーを使用）
            if (shadowSettings.USE_BLUR) {
                this.shadowGenerator.useBlurExponentialShadowMap = true;
                this.shadowGenerator.useExponentialShadowMap = false;  // ブラーと同時使用不可
                this.shadowGenerator.blurScale = shadowSettings.BLUR || 2;
                this.shadowGenerator.blurBoxOffset = 1;
            } else {
                this.shadowGenerator.useExponentialShadowMap = true;
                this.shadowGenerator.useBlurExponentialShadowMap = false;
            }
            
            this.shadowGenerator.usePoissonSampling = false;
            
            // PCFフィルタリング
            if (shadowSettings.USE_PCF) {
                this.shadowGenerator.usePercentageCloserFiltering = true;
                this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
            }
            
            // パラメータ設定
            this.shadowGenerator.bias = shadowSettings.BIAS;
            this.shadowGenerator.normalBias = shadowSettings.NORMAL_BIAS;
            this.shadowGenerator.darkness = this.settings.shadow.darkness || shadowSettings.DARKNESS;
            this.shadowGenerator.depthScale = shadowSettings.DEPTH_SCALE;
            
            // その他の設定（ローポリコンテンツ用に最適化）
            this.shadowGenerator.useContactHardeningShadow = false;
            this.shadowGenerator.useKernelBlur = false;
            this.shadowGenerator.enableSoftTransparentShadow = false;
            this.shadowGenerator.transparencyShadow = false;
            this.shadowGenerator.forceBackFacesOnly = false;  // 両面で影を生成
            this.shadowGenerator.frustumEdgeFalloff = shadowSettings.FRUSTUM_EDGE_FALLOFF || 0;
            
            console.log("Shadow generator設定完了:", {
                resolution: this.shadowGenerator.mapSize,
                darkness: this.shadowGenerator.darkness,
                bias: this.shadowGenerator.bias,
                normalBias: this.shadowGenerator.normalBias,
                useBlurExponentialShadowMap: this.shadowGenerator.useBlurExponentialShadowMap,
                useExponentialShadowMap: this.shadowGenerator.useExponentialShadowMap,
                forceBackFacesOnly: this.shadowGenerator.forceBackFacesOnly
            });
            
            // シャドウマップの確認
            const shadowMap = this.shadowGenerator.getShadowMap();
            console.log('シャドウマップ:', {
                renderTargetTexture: shadowMap ? '作成済み' : '未作成',
                size: shadowMap ? shadowMap.getSize() : 'N/A'
            });
            
            // 新しいメッシュが追加されたときの処理
            this.setupShadowCasterObserver();
            
        } catch (error) {
            console.error('影の設定エラー:', error);
            this.errorHandler.showWarning("影の設定に失敗しました: " + error.message);
        }
    }

    /**
     * シャドウキャスターの監視を設定
     */
    setupShadowCasterObserver() {
        this.scene.onNewMeshAddedObservable.add(mesh => {
            // ユーザーが配置したオブジェクトかチェック
            if (this.isUserPlacedObject(mesh)) {
                this.addShadowCaster(mesh);
            }
        });
    }

    /**
     * ユーザーが配置したオブジェクトかチェック
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isUserPlacedObject(mesh) {
        return mesh.name.startsWith("cube_") || 
               mesh.name.startsWith("recordMachine_") ||
               mesh.name.startsWith("juiceBox_") || 
               mesh.name.startsWith("mikeDesk_") ||
               mesh.name.startsWith("burger_") ||
               mesh.name.startsWith("placed_vehicle_") ||  // 配置済み車両を追加
               mesh.name.startsWith("vehicle_") ||         // ロード直後の車両を追加
               (mesh.parent && (
                   mesh.parent.name.startsWith("recordMachine_") || 
                   mesh.parent.name.startsWith("juiceBox_") ||
                   mesh.parent.name.startsWith("burger_") ||
                   mesh.parent.name.startsWith("mikeDesk_") ||
                   mesh.parent.name.startsWith("placed_vehicle_") || // 車両の子メッシュ
                   mesh.parent.name.startsWith("vehicle_")          // 車両の子メッシュ
               ));
    }

    /**
     * シャドウキャスターを追加
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    addShadowCaster(mesh) {
        if (!this.shadowGenerator) return;
        
        try {
            // 既に登録されている場合は削除
            this.shadowGenerator.removeShadowCaster(mesh);
        } catch (e) {
            // 初回は存在しないのでエラーは無視
        }
        
        // 影を生成するメッシュとして登録
        this.shadowGenerator.addShadowCaster(mesh, true);
        console.log("Added shadow caster:", mesh.name);
        
        // シーンを再レンダリング
        setTimeout(() => {
            this.scene.render();
        }, 100);
    }

    /**
     * シャドウレシーバーを設定
     * @param {Array<BABYLON.Mesh>} receivers - 影を受け取るメッシュの配列
     */
    setShadowReceivers(receivers) {
        console.log('=== シャドウレシーバーの設定 ===');
        
        // 床メッシュの重複をチェック
        const floorMeshes = receivers.filter(mesh => 
            mesh.name.toLowerCase().includes('floor') || 
            mesh.name.toLowerCase().includes('ground')
        );
        console.log(`床メッシュ数: ${floorMeshes.length}`);
        
        receivers.forEach(mesh => {
            if (!mesh.receiveShadows) {
                mesh.receiveShadows = true;
                
                // 床用の最適化
                if (mesh.name === "ground" || mesh.name === "shadowFloor") {
                    mesh.useShadowDepthMaterial = true;
                }
            }
            console.log(`  - ${mesh.name}: receiveShadows=${mesh.receiveShadows}, マテリアル=${mesh.material ? mesh.material.name : 'なし'}, Y位置=${mesh.position.y}`);
        });
        
        console.log(`✅ ${receivers.length}個のシャドウレシーバーを設定完了`);
    }

    /**
     * シャドウキャスターを設定
     * @param {Array<BABYLON.Mesh>} casters - 影を生成するメッシュの配列
     */
    setShadowCasters(casters) {
        if (!this.shadowGenerator) return;
        
        casters.forEach(mesh => {
            this.addShadowCaster(mesh);
        });
        
        console.log(`Set ${casters.length} shadow casters`);
    }

    /**
     * マテリアルの反射を調整
     * @param {boolean} reduce - 反射を抑えるかどうか
     */
    adjustMaterialShininess(reduce) {
        this.scene.meshes.forEach(mesh => {
            if (!mesh.material) return;
            
            if (reduce) {
                // メタリック効果を抑える
                mesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material.specularPower = 1;
                
                // PBRマテリアルの場合
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.1;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.9;
                }
            } else {
                // デフォルトの反射設定に戻す
                mesh.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                mesh.material.specularPower = 64;
                
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.5;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.4;
                }
            }
        });
        
        // 光源の反射も調整
        this.adjustLightSpecular(reduce);
    }

    /**
     * 光源の反射を調整
     * @param {boolean} reduce - 反射を抑えるかどうか
     */
    adjustLightSpecular(reduce) {
        if (this.ambientLight) {
            this.ambientLight.specular = reduce 
                ? new BABYLON.Color3(0.1, 0.1, 0.15) 
                : new BABYLON.Color3(0.2, 0.2, 0.3);
        }
        
        if (this.directionalLight) {
            this.directionalLight.specular = reduce 
                ? new BABYLON.Color3(0.1, 0.1, 0.15) 
                : new BABYLON.Color3(1, 1, 1);
        }
        
        [this.pointLight1, this.pointLight2].forEach(light => {
            if (light) {
                light.specular = reduce 
                    ? new BABYLON.Color3(0.1, 0.1, 0.2) 
                    : new BABYLON.Color3(1, 1, 1);
            }
        });
    }

    /**
     * 設定を更新
     * @param {string} lightType - ライトの種類
     * @param {string} property - プロパティ名
     * @param {any} value - 値
     */
    updateSetting(lightType, property, value) {
        if (!this.settings[lightType]) return;
        
        this.settings[lightType][property] = value;
        
        // 実際のライトに反映
        switch (lightType) {
            case 'ambient':
                this.updateAmbientLight(property, value);
                break;
            case 'directional':
                this.updateDirectionalLight(property, value);
                break;
            case 'pointLight1':
                this.updatePointLight(this.pointLight1, property, value);
                break;
            case 'pointLight2':
                this.updatePointLight(this.pointLight2, property, value);
                break;
            case 'shadow':
                this.updateShadow(property, value);
                break;
        }
    }

    /**
     * 環境光を更新
     */
    updateAmbientLight(property, value) {
        if (!this.ambientLight) return;
        
        if (property === 'intensity') {
            this.ambientLight.intensity = value;
        } else if (property === 'color') {
            this.ambientLight.diffuse = hexToColor3(value);
        }
    }

    /**
     * 方向光を更新
     */
    updateDirectionalLight(property, value) {
        if (!this.directionalLight) return;
        
        if (property === 'intensity') {
            this.directionalLight.intensity = value;
        } else if (property === 'position') {
            this.directionalLight.position = new BABYLON.Vector3(
                value.x, value.y, value.z
            );
            this.updateShadowCaster();
        }
    }

    /**
     * ポイントライトを更新
     */
    updatePointLight(light, property, value) {
        if (!light) return;
        
        if (property === 'intensity') {
            light.intensity = value;
        } else if (property === 'color') {
            light.diffuse = hexToColor3(value);
        } else if (property === 'position') {
            light.position = new BABYLON.Vector3(value.x, value.y, value.z);
        }
    }

    /**
     * 影を更新
     */
    updateShadow(property, value) {
        if (!this.shadowGenerator) return;
        
        if (property === 'darkness') {
            this.shadowGenerator.darkness = value;
        }
    }

    /**
     * シャドウキャスターを更新
     */
    updateShadowCaster() {
        if (!this.shadowGenerator || !this.directionalLight) return;
        
        // 方向光の投影方向を更新
        const lightDirection = new BABYLON.Vector3(
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.x,
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.y,
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.z
        );
        this.directionalLight.direction = lightDirection;
        
        // 影のパラメーターを調整
        const dirLightPosition = this.directionalLight.position;
        const distanceFromCenter = Math.sqrt(
            dirLightPosition.x * dirLightPosition.x + 
            dirLightPosition.z * dirLightPosition.z
        );
        
        const distanceFactor = Math.min(1, 20 / Math.max(10, distanceFromCenter));
        const heightFactor = Math.min(1, 40 / Math.max(20, dirLightPosition.y));
        
        this.shadowGenerator.darkness = this.settings.shadow.darkness * distanceFactor;
        this.shadowGenerator.bias = SHADOW_SETTINGS.BIAS * (1 / heightFactor);
        
        console.log("Shadow caster updated");
    }

    /**
     * 現在の設定を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * シャドウジェネレーターを取得
     * @returns {BABYLON.ShadowGenerator}
     */
    getShadowGenerator() {
        return this.shadowGenerator;
    }

    /**
     * 影の診断情報を出力
     */
    diagnoseShadows() {
        console.log('=== 影の診断開始 ===');
        
        // ShadowGeneratorの存在確認
        if (!this.shadowGenerator) {
            console.error('❌ ShadowGeneratorが存在しません');
            console.log('this.shadowGenerator:', this.shadowGenerator);
            console.log('this.directionalLight:', this.directionalLight);
            return;
        }
        
        console.log('ShadowGeneratorは存在します');
        console.log('ShadowGenerator.light:', this.shadowGenerator.light);
        console.log('ShadowGenerator._light:', this.shadowGenerator._light);
        
        // ライトの確認 - 複数の方法で取得を試みる
        let light = null;
        
        // getLight()メソッドを試す
        if (this.shadowGenerator.getLight && typeof this.shadowGenerator.getLight === 'function') {
            try {
                light = this.shadowGenerator.getLight();
            } catch (e) {
                console.log('getLight()メソッドの呼び出しに失敗:', e);
            }
        }
        
        // それでも取得できない場合は、directionalLightを使用
        if (!light) {
            light = this.directionalLight;
        }
        
        if (!light) {
            console.error('❌ ライトが見つかりません');
            console.log('ShadowGeneratorのプロパティ:', Object.keys(this.shadowGenerator));
            return;
        }
        
        console.log('ライト情報:', {
            名前: light.name || 'N/A',
            タイプ: light.getClassName ? light.getClassName() : 'N/A',
            有効: light.isEnabled ? light.isEnabled() : 'N/A',
            強度: light.intensity !== undefined ? light.intensity : 'N/A',
            位置: light.position || 'N/A',
            方向: light.direction || 'N/A'
        });
        
        // シャドウマップの確認
        const shadowMap = this.shadowGenerator.getShadowMap();
        if (!shadowMap) {
            console.error('❌ シャドウマップが存在しません');
            return;
        }
        
        const renderList = shadowMap.renderList || [];
        console.log('シャドウマップ:', {
            存在: true,
            サイズ: shadowMap.getSize ? shadowMap.getSize() : 'N/A',
            レンダーリスト数: renderList.length
        });
        
        // シャドウキャスターの確認
        if (renderList.length > 0) {
            console.log('シャドウキャスター一覧:');
            renderList.forEach((mesh, index) => {
                if (mesh) {
                    console.log(`  [${index}] ${mesh.name || 'Unnamed'} - 有効: ${mesh.isEnabled ? mesh.isEnabled() : 'N/A'}, 可視: ${mesh.isVisible !== undefined ? mesh.isVisible : 'N/A'}`);
                }
            });
        } else {
            console.warn('⚠️ シャドウキャスターが登録されていません');
        }
        
        // シャドウレシーバーの確認
        console.log('シャドウレシーバー（床・壁）:');
        this.scene.meshes.forEach(mesh => {
            if (mesh.receiveShadows) {
                console.log(`  - ${mesh.name}: receiveShadows=${mesh.receiveShadows}, マテリアル=${mesh.material ? mesh.material.name : 'なし'}`);
            }
        });
        
        // シャドウ設定の確認
        console.log('シャドウ設定:', {
            darkness: this.shadowGenerator.darkness,
            bias: this.shadowGenerator.bias,
            normalBias: this.shadowGenerator.normalBias,
            useExponentialShadowMap: this.shadowGenerator.useExponentialShadowMap,
            useBlurExponentialShadowMap: this.shadowGenerator.useBlurExponentialShadowMap,
            forceBackFacesOnly: this.shadowGenerator.forceBackFacesOnly
        });
        
        console.log('=== 影の診断終了 ===');
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing LightingSystem...");
        
        // シャドウジェネレーターを破棄
        if (this.shadowGenerator) {
            this.shadowGenerator.dispose();
            this.shadowGenerator = null;
        }
        
        // ライトを破棄
        [this.ambientLight, this.directionalLight, this.pointLight1, this.pointLight2]
            .forEach(light => {
                if (light) {
                    light.dispose();
                }
            });
        
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight1 = null;
        this.pointLight2 = null;
    }
}