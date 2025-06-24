/**
 * collision-detector.js
 * アセット間の衝突判定を管理するクラス
 * 保守性と拡張性を重視した設計
 */

export class CollisionDetector {
    constructor(scene) {
        this.scene = scene;
        this.placedAssets = new Map(); // アセットID -> メッシュのマップ
        this.collisionMargin = 0.05; // 衝突判定のマージン（5cm）
        this.debugMode = false;
        this.debugMeshes = [];
    }

    /**
     * 配置済みアセットを登録
     * @param {BABYLON.Mesh} mesh - 登録するメッシュ
     */
    registerAsset(mesh) {
        if (!mesh || !mesh.name) {
            console.warn("無効なメッシュが登録されようとしました");
            return;
        }

        // メッシュIDをキーとして保存
        this.placedAssets.set(mesh.uniqueId, mesh);
        console.log(`🔵 アセット登録: ${mesh.name} (ID: ${mesh.uniqueId})`);
        
        // デバッグモードの場合、バウンディングボックスを表示
        if (this.debugMode) {
            this.showDebugBoundingBox(mesh);
        }
    }

    /**
     * 配置済みアセットを削除
     * @param {BABYLON.Mesh} mesh - 削除するメッシュ
     */
    unregisterAsset(mesh) {
        if (!mesh) return;
        
        this.placedAssets.delete(mesh.uniqueId);
        console.log(`🔴 アセット削除: ${mesh.name} (ID: ${mesh.uniqueId})`);
        
        // デバッグメッシュも削除
        this.removeDebugBoundingBox(mesh);
    }

    /**
     * 指定位置に配置可能かチェック
     * @param {BABYLON.Mesh} testMesh - チェックするメッシュ
     * @param {BABYLON.Vector3} position - 配置予定位置
     * @param {BABYLON.Mesh} excludeMesh - 除外するメッシュ（ドラッグ中の自身など）
     * @returns {{canPlace: boolean, collisions: Array}} 配置可否と衝突情報
     */
    checkPlacement(testMesh, position, excludeMesh = null) {
        const result = {
            canPlace: true,
            collisions: []
        };

        // テストメッシュのバウンディングボックスを取得
        const testBounds = this.getMeshBounds(testMesh, position);
        if (!testBounds) {
            console.warn("テストメッシュのバウンディングボックスが取得できません");
            return result;
        }

        // マージンを適用
        testBounds.min.subtractInPlace(new BABYLON.Vector3(this.collisionMargin, 0, this.collisionMargin));
        testBounds.max.addInPlace(new BABYLON.Vector3(this.collisionMargin, 0, this.collisionMargin));

        // 全ての配置済みアセットとチェック
        for (const [id, placedMesh] of this.placedAssets) {
            // 除外メッシュはスキップ
            if (excludeMesh && placedMesh.uniqueId === excludeMesh.uniqueId) {
                continue;
            }

            // 削除済みメッシュはスキップ
            if (placedMesh.isDisposed()) {
                this.placedAssets.delete(id);
                continue;
            }

            // 衝突チェック
            const placedBounds = this.getMeshBounds(placedMesh);
            if (this.checkBoundsIntersection(testBounds, placedBounds)) {
                result.canPlace = false;
                result.collisions.push({
                    mesh: placedMesh,
                    name: placedMesh.name,
                    bounds: placedBounds
                });
            }
        }

        if (!result.canPlace) {
            console.log(`⚠️ 衝突検出: ${result.collisions.length}個のアセットと衝突`);
        }

        return result;
    }

    /**
     * メッシュのワールド座標でのバウンディングボックスを取得
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {BABYLON.Vector3} overridePosition - 位置のオーバーライド
     * @returns {{min: BABYLON.Vector3, max: BABYLON.Vector3}} バウンディングボックス
     */
    getMeshBounds(mesh, overridePosition = null) {
        if (!mesh || !mesh.getBoundingInfo) {
            return null;
        }

        // 位置を一時的に変更する場合
        const originalPosition = mesh.position.clone();
        if (overridePosition) {
            mesh.position.copyFrom(overridePosition);
            mesh.computeWorldMatrix(true);
        }

        // バウンディング情報を取得
        const boundingInfo = mesh.getBoundingInfo();
        const boundingBox = boundingInfo.boundingBox;
        
        // ワールド座標でのバウンディングボックスを取得
        const worldMin = boundingBox.minimumWorld.clone();
        const worldMax = boundingBox.maximumWorld.clone();

        // 位置を元に戻す
        if (overridePosition) {
            mesh.position.copyFrom(originalPosition);
            mesh.computeWorldMatrix(true);
        }

        return {
            min: worldMin,
            max: worldMax,
            center: worldMin.add(worldMax).scale(0.5),
            size: worldMax.subtract(worldMin)
        };
    }

    /**
     * 2つのバウンディングボックスが交差しているかチェック
     * @param {Object} boundsA - バウンディングボックスA
     * @param {Object} boundsB - バウンディングボックスB
     * @returns {boolean} 交差している場合true
     */
    checkBoundsIntersection(boundsA, boundsB) {
        // AABBの交差判定
        return !(
            boundsA.max.x < boundsB.min.x || boundsA.min.x > boundsB.max.x ||
            boundsA.max.y < boundsB.min.y || boundsA.min.y > boundsB.max.y ||
            boundsA.max.z < boundsB.min.z || boundsA.min.z > boundsB.max.z
        );
    }

    /**
     * 衝突マージンを設定
     * @param {number} margin - マージン（メートル単位）
     */
    setCollisionMargin(margin) {
        this.collisionMargin = Math.max(0, margin);
        console.log(`衝突マージン設定: ${this.collisionMargin}m`);
    }

    /**
     * デバッグモードの切り替え
     * @param {boolean} enabled - 有効/無効
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        
        if (enabled) {
            // 全てのアセットのバウンディングボックスを表示
            for (const [id, mesh] of this.placedAssets) {
                this.showDebugBoundingBox(mesh);
            }
        } else {
            // 全てのデバッグメッシュを削除
            this.clearDebugMeshes();
        }
    }

    /**
     * デバッグ用バウンディングボックスを表示
     * @param {BABYLON.Mesh} mesh - 対象メッシュ
     */
    showDebugBoundingBox(mesh) {
        const bounds = this.getMeshBounds(mesh);
        if (!bounds) return;

        // バウンディングボックスのサイズと位置を計算
        const size = bounds.size;
        const center = bounds.center;

        // デバッグ用ボックスを作成
        const debugBox = BABYLON.MeshBuilder.CreateBox(
            `debug_bounds_${mesh.uniqueId}`,
            { width: size.x, height: size.y, depth: size.z },
            this.scene
        );

        debugBox.position = center;
        debugBox.isPickable = false;
        
        // ワイヤーフレームマテリアル
        const material = new BABYLON.StandardMaterial(`debug_mat_${mesh.uniqueId}`, this.scene);
        material.wireframe = true;
        material.emissiveColor = new BABYLON.Color3(1, 0, 0);
        material.disableLighting = true;
        debugBox.material = material;

        // メタデータを設定
        debugBox.metadata = {
            isDebugMesh: true,
            targetMeshId: mesh.uniqueId
        };

        this.debugMeshes.push(debugBox);
    }

    /**
     * デバッグ用バウンディングボックスを削除
     * @param {BABYLON.Mesh} mesh - 対象メッシュ
     */
    removeDebugBoundingBox(mesh) {
        this.debugMeshes = this.debugMeshes.filter(debugMesh => {
            if (debugMesh.metadata && debugMesh.metadata.targetMeshId === mesh.uniqueId) {
                debugMesh.dispose();
                return false;
            }
            return true;
        });
    }

    /**
     * 全てのデバッグメッシュをクリア
     */
    clearDebugMeshes() {
        this.debugMeshes.forEach(mesh => mesh.dispose());
        this.debugMeshes = [];
    }

    /**
     * 配置済みアセットの数を取得
     * @returns {number} アセット数
     */
    getAssetCount() {
        return this.placedAssets.size;
    }

    /**
     * 全てクリア
     */
    clear() {
        this.placedAssets.clear();
        this.clearDebugMeshes();
        console.log("🧹 衝突検出システムをクリアしました");
    }
}