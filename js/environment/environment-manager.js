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

        // 建物のマテリアル（レンガ風の色）
        const buildingMaterial = new BABYLON.StandardMaterial(`${name}_material`, this.scene);
        buildingMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.5);
        buildingMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        mainBuilding.material = buildingMaterial;

        // 基礎部分を作成
        const foundation = BABYLON.MeshBuilder.CreateBox(
            `${name}_foundation`,
            {
                width: 4.2,
                height: 0.5,
                depth: 3.2
            },
            this.scene
        );
        const foundationMaterial = new BABYLON.StandardMaterial(`${name}_foundationMat`, this.scene);
        foundationMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        foundation.material = foundationMaterial;
        foundation.position.y = -2.75;
        foundation.parent = mainBuilding;

        // 窓を作成
        this.createWindows(mainBuilding, name);

        // ドアを作成
        this.createDoor(mainBuilding, name);

        // 屋根を作成（改良版）
        const roof = BABYLON.MeshBuilder.CreateCylinder(
            `${name}_roof`, 
            {
                diameterTop: 0,
                diameterBottom: 5.5,
                height: 2.5,
                tessellation: 4
            }, 
            this.scene
        );

        // 屋根のマテリアル（瓦風の濃い赤茶色）
        const roofMaterial = new BABYLON.StandardMaterial(`${name}_roofMaterial`, this.scene);
        roofMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.15, 0.1);
        roofMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        roof.material = roofMaterial;

        // 屋根を建物の上に配置
        roof.position.y = 4.25;
        roof.rotation.y = Math.PI / 4; // 45度回転

        // 煙突を作成
        const chimney = BABYLON.MeshBuilder.CreateBox(
            `${name}_chimney`,
            {
                width: 0.6,
                height: 2.0,
                depth: 0.6
            },
            this.scene
        );
        const chimneyMaterial = new BABYLON.StandardMaterial(`${name}_chimneyMat`, this.scene);
        chimneyMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        chimney.material = chimneyMaterial;
        chimney.position.x = 1.2;
        chimney.position.y = 5.0;
        chimney.position.z = 0;
        chimney.parent = mainBuilding;

        // 親子関係を設定
        roof.parent = mainBuilding;

        // 位置、スケール、回転を設定
        mainBuilding.position = new BABYLON.Vector3(config.position.x, config.position.y + 3.0, config.position.z);
        mainBuilding.scaling = new BABYLON.Vector3(config.scale.x, config.scale.y, config.scale.z);
        
        if (config.rotation) {
            mainBuilding.rotation.y = config.rotation.y;
        }

        // すべてのパーツを選択不可に設定
        mainBuilding.isPickable = false;
        roof.isPickable = false;
        foundation.isPickable = false;
        chimney.isPickable = false;

        // すべてのパーツが影を受ける設定
        mainBuilding.receiveShadows = true;
        roof.receiveShadows = true;
        foundation.receiveShadows = true;
        chimney.receiveShadows = true;
        
        // 窓とドアも影を受ける
        mainBuilding.getChildMeshes().forEach(child => {
            child.receiveShadows = true;
            child.isPickable = false;
        });

        console.log(`🏠 建物作成: ${name} at (${config.position.x}, ${config.position.z})`);

        return mainBuilding;
    }

    /**
     * 建物に窓を作成
     * @param {BABYLON.Mesh} building - 建物メッシュ
     * @param {string} name - 建物の名前
     */
    createWindows(building, name) {
        const windowMaterial = new BABYLON.StandardMaterial(`${name}_windowMat`, this.scene);
        windowMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.4);
        windowMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.15, 0.2);
        windowMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        
        // 前面の窓（2つ）
        for (let i = 0; i < 2; i++) {
            const frontWindow = BABYLON.MeshBuilder.CreateBox(
                `${name}_frontWindow${i}`,
                {
                    width: 0.8,
                    height: 1.2,
                    depth: 0.1
                },
                this.scene
            );
            frontWindow.material = windowMaterial;
            frontWindow.position.x = i === 0 ? -0.8 : 0.8;
            frontWindow.position.y = 1.0;
            frontWindow.position.z = 1.51;
            frontWindow.parent = building;
        }
        
        // 側面の窓（各側面に1つずつ）
        for (let side = 0; side < 2; side++) {
            const sideWindow = BABYLON.MeshBuilder.CreateBox(
                `${name}_sideWindow${side}`,
                {
                    width: 0.1,
                    height: 1.2,
                    depth: 0.8
                },
                this.scene
            );
            sideWindow.material = windowMaterial;
            sideWindow.position.x = side === 0 ? 2.01 : -2.01;
            sideWindow.position.y = 1.0;
            sideWindow.position.z = 0;
            sideWindow.parent = building;
        }
    }

    /**
     * 建物にドアを作成
     * @param {BABYLON.Mesh} building - 建物メッシュ
     * @param {string} name - 建物の名前
     */
    createDoor(building, name) {
        const door = BABYLON.MeshBuilder.CreateBox(
            `${name}_door`,
            {
                width: 1.0,
                height: 2.0,
                depth: 0.1
            },
            this.scene
        );
        
        const doorMaterial = new BABYLON.StandardMaterial(`${name}_doorMat`, this.scene);
        doorMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.15);
        doorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        door.material = doorMaterial;
        
        door.position.x = 0;
        door.position.y = -2.0;
        door.position.z = 1.51;
        door.parent = building;
        
        // ドアノブ
        const doorKnob = BABYLON.MeshBuilder.CreateSphere(
            `${name}_doorKnob`,
            {
                diameter: 0.1,
                segments: 8
            },
            this.scene
        );
        const knobMaterial = new BABYLON.StandardMaterial(`${name}_knobMat`, this.scene);
        knobMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.3);
        knobMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        doorKnob.material = knobMaterial;
        
        doorKnob.position.x = 0.35;
        doorKnob.position.y = 0;
        doorKnob.position.z = 0.1;
        doorKnob.parent = door;
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