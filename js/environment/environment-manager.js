// js/environment/EnvironmentManager.js
/**
 * 環境装飾オブジェクト（木、建物など）を管理するクラス
 */

import { ENVIRONMENT_OBJECTS } from '../config/constants.js';

export class EnvironmentManager {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // 環境オブジェクトのリスト
        this.environmentObjects = [];
        
        // 影の設定
        this.shadowGenerator = null;
    }

    /**
     * 環境マネージャーを初期化
     */
    initialize() {
        try {
            console.log("🌲 環境オブジェクト作成開始...");
            
            // 木を作成
            this.createTrees();
            
            // 建物を作成
            this.createBuildings();
            
            console.log(`✅ 環境オブジェクト作成完了: ${this.environmentObjects.length}個`);
            
        } catch (error) {
            this.errorHandler.handleError(error, 'EnvironmentManager.initialize');
        }
    }

    /**
     * シャドウジェネレーターを設定
     * @param {BABYLON.ShadowGenerator} shadowGenerator
     */
    setShadowGenerator(shadowGenerator) {
        this.shadowGenerator = shadowGenerator;
        
        // 既存の環境オブジェクトに影を適用
        this.environmentObjects.forEach(obj => {
            this.setupShadow(obj);
        });
    }

    /**
     * 木を作成
     */
    createTrees() {
        ENVIRONMENT_OBJECTS.TREES.forEach((treeConfig, index) => {
            try {
                const tree = this.createTree(`tree_${index}`, treeConfig);
                this.environmentObjects.push(tree);
            } catch (error) {
                console.warn(`⚠️ 木${index}の作成に失敗:`, error);
            }
        });
    }

    /**
     * 単一の木を作成
     * @param {string} name - 木の名前
     * @param {Object} config - 木の設定
     * @returns {BABYLON.Mesh}
     */
    createTree(name, config) {
        // 幹を作成
        const trunk = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_trunk`, 
            {
                diameterTop: 0.3,
                diameterBottom: 0.5,
                height: 3.0,
                tessellation: 8
            }, 
            this.scene
        );

        // 幹のマテリアル（茶色）
        const trunkMaterial = new BABYLON.StandardMaterial(`${name}_trunkMaterial`, this.scene);
        trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
        trunkMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        trunk.material = trunkMaterial;

        // 葉の部分を作成（球体）
        const foliage = BABYLON.MeshBuilder.CreateSphere(
            `${name}_foliage`, 
            {
                diameter: 4.0,
                segments: 8
            }, 
            this.scene
        );

        // 葉のマテリアル（緑色）
        const foliageMaterial = new BABYLON.StandardMaterial(`${name}_foliageMaterial`, this.scene);
        foliageMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.2);
        foliageMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        foliage.material = foliageMaterial;

        // 葉を幹の上に配置
        foliage.position.y = 3.5;

        // 親子関係を設定
        foliage.parent = trunk;

        // 位置とスケールを設定
        trunk.position = new BABYLON.Vector3(config.position.x, config.position.y, config.position.z);
        trunk.scaling = new BABYLON.Vector3(config.scale.x, config.scale.y, config.scale.z);

        // 木を選択不可に設定
        trunk.isPickable = false;
        foliage.isPickable = false;

        // 影を受ける設定
        trunk.receiveShadows = true;
        foliage.receiveShadows = true;

        console.log(`🌳 木作成: ${name} at (${config.position.x}, ${config.position.z})`);

        return trunk;
    }

    /**
     * 建物を作成
     */
    createBuildings() {
        ENVIRONMENT_OBJECTS.BUILDINGS.forEach((buildingConfig, index) => {
            try {
                const building = this.createBuilding(`building_${index}`, buildingConfig);
                this.environmentObjects.push(building);
            } catch (error) {
                console.warn(`⚠️ 建物${index}の作成に失敗:`, error);
            }
        });
    }

    /**
     * 単一の建物を作成
     * @param {string} name - 建物の名前
     * @param {Object} config - 建物の設定
     * @returns {BABYLON.Mesh}
     */
    createBuilding(name, config) {
        // メインの建物部分
        const mainBuilding = BABYLON.MeshBuilder.CreateBox(
            `${name}_main`, 
            {
                width: 4.0,
                height: 6.0,
                depth: 3.0
            }, 
            this.scene
        );

        // 建物のマテリアル（グレー）
        const buildingMaterial = new BABYLON.StandardMaterial(`${name}_material`, this.scene);
        buildingMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.8);
        buildingMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        mainBuilding.material = buildingMaterial;

        // 屋根を作成
        const roof = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_roof`, 
            {
                diameterTop: 0,
                diameterBottom: 5.0,
                height: 2.0,
                tessellation: 4
            }, 
            this.scene
        );

        // 屋根のマテリアル（赤茶色）
        const roofMaterial = new BABYLON.StandardMaterial(`${name}_roofMaterial`, this.scene);
        roofMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.2, 0.1);
        roofMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        roof.material = roofMaterial;

        // 屋根を建物の上に配置
        roof.position.y = 4.0;
        roof.rotation.y = Math.PI / 4; // 45度回転

        // 親子関係を設定
        roof.parent = mainBuilding;

        // 位置、スケール、回転を設定
        mainBuilding.position = new BABYLON.Vector3(config.position.x, config.position.y + 3.0, config.position.z);
        mainBuilding.scaling = new BABYLON.Vector3(config.scale.x, config.scale.y, config.scale.z);
        
        if (config.rotation) {
            mainBuilding.rotation.y = config.rotation.y;
        }

        // 建物を選択不可に設定
        mainBuilding.isPickable = false;
        roof.isPickable = false;

        // 影を受ける設定
        mainBuilding.receiveShadows = true;
        roof.receiveShadows = true;

        console.log(`🏠 建物作成: ${name} at (${config.position.x}, ${config.position.z})`);

        return mainBuilding;
    }

    /**
     * 影を設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupShadow(mesh) {
        if (!this.shadowGenerator) return;
        
        try {
            this.shadowGenerator.addShadowCaster(mesh, true);
            
            // 子メッシュにも影を設定
            if (mesh.getChildMeshes) {
                mesh.getChildMeshes().forEach(child => {
                    this.shadowGenerator.addShadowCaster(child, true);
                });
            }
        } catch (error) {
            console.warn("影の設定に失敗:", error);
        }
    }

    /**
     * 環境オブジェクトの可視性を切り替え
     * @param {boolean} visible - 表示するかどうか
     */
    setVisibility(visible) {
        this.environmentObjects.forEach(obj => {
            obj.setEnabled(visible);
        });
        
        console.log(`🔄 環境オブジェクト表示切り替え: ${visible ? '表示' : '非表示'}`);
    }

    /**
     * 環境オブジェクトの数を取得
     * @returns {number}
     */
    getObjectCount() {
        return this.environmentObjects.length;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing EnvironmentManager...");
        
        this.environmentObjects.forEach(obj => {
            if (obj && obj._scene) {
                obj.dispose();
            }
        });
        
        this.environmentObjects = [];
        this.shadowGenerator = null;
    }
}