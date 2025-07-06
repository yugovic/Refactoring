// js/animation/vehicle-animation.js
/**
 * 車両が部屋の周りを回るアニメーション（滑らかな曲線移動）
 */

export class VehicleAnimation {
    constructor(scene, vehicleManager) {
        this.scene = scene;
        this.vehicleManager = vehicleManager;
        this.animatedVehicle = null;
        this.isRunning = false;
        this.animationSpeed = 1.0;
        this.currentDistance = 0; // 現在の走行距離
        
        // 16×16の経路（角を丸めた四角形）
        this.setupSmoothPath();
    }
    
    /**
     * 滑らかな経路を設定
     */
    setupSmoothPath() {
        // コーナーの半径
        const cornerRadius = 3;
        const halfSize = 8; // 16÷2
        
        // 各辺と角の曲線を含むウェイポイント
        this.waypoints = [];
        
        // 各コーナーに10ポイントずつ配置して滑らかな曲線を作る
        const pointsPerCorner = 10;
        
        // 左下から開始（時計回り）
        // 下辺（左から右へ）
        for (let i = 0; i <= 10; i++) {
            this.waypoints.push({
                x: -halfSize + cornerRadius + (halfSize * 2 - cornerRadius * 2) * i / 10,
                z: -halfSize
            });
        }
        
        // 右下コーナー
        for (let i = 1; i < pointsPerCorner; i++) {
            const angle = -Math.PI / 2 + (Math.PI / 2) * i / pointsPerCorner;
            this.waypoints.push({
                x: halfSize - cornerRadius + cornerRadius * Math.cos(angle),
                z: -halfSize + cornerRadius + cornerRadius * Math.sin(angle)
            });
        }
        
        // 右辺（下から上へ）
        for (let i = 1; i <= 10; i++) {
            this.waypoints.push({
                x: halfSize,
                z: -halfSize + cornerRadius + (halfSize * 2 - cornerRadius * 2) * i / 10
            });
        }
        
        // 右上コーナー
        for (let i = 1; i < pointsPerCorner; i++) {
            const angle = 0 + (Math.PI / 2) * i / pointsPerCorner;
            this.waypoints.push({
                x: halfSize - cornerRadius + cornerRadius * Math.cos(angle),
                z: halfSize - cornerRadius + cornerRadius * Math.sin(angle)
            });
        }
        
        // 上辺（右から左へ）
        for (let i = 1; i <= 10; i++) {
            this.waypoints.push({
                x: halfSize - cornerRadius - (halfSize * 2 - cornerRadius * 2) * i / 10,
                z: halfSize
            });
        }
        
        // 左上コーナー
        for (let i = 1; i < pointsPerCorner; i++) {
            const angle = Math.PI / 2 + (Math.PI / 2) * i / pointsPerCorner;
            this.waypoints.push({
                x: -halfSize + cornerRadius + cornerRadius * Math.cos(angle),
                z: halfSize - cornerRadius + cornerRadius * Math.sin(angle)
            });
        }
        
        // 左辺（上から下へ）
        for (let i = 1; i <= 10; i++) {
            this.waypoints.push({
                x: -halfSize,
                z: halfSize - cornerRadius - (halfSize * 2 - cornerRadius * 2) * i / 10
            });
        }
        
        // 左下コーナー
        for (let i = 1; i < pointsPerCorner; i++) {
            const angle = Math.PI + (Math.PI / 2) * i / pointsPerCorner;
            this.waypoints.push({
                x: -halfSize + cornerRadius + cornerRadius * Math.cos(angle),
                z: -halfSize + cornerRadius + cornerRadius * Math.sin(angle)
            });
        }
        
        // 各セグメントの距離を計算
        this.segments = [];
        this.totalDistance = 0;
        
        for (let i = 0; i < this.waypoints.length; i++) {
            const current = this.waypoints[i];
            const next = this.waypoints[(i + 1) % this.waypoints.length];
            const distance = Math.sqrt(
                Math.pow(next.x - current.x, 2) + 
                Math.pow(next.z - current.z, 2)
            );
            
            this.segments.push({
                start: current,
                end: next,
                distance: distance,
                startDistance: this.totalDistance
            });
            
            this.totalDistance += distance;
        }
        
        console.log(`経路設定完了: ${this.waypoints.length}個のウェイポイント、総距離: ${this.totalDistance.toFixed(2)}m`);
    }
    
    /**
     * アニメーションを開始
     */
    async start() {
        if (this.isRunning) {
            console.log("アニメーションは既に実行中です");
            return;
        }
        
        console.log("🚗 車両アニメーションを開始中...");
        
        try {
            // デフォルトの車両タイプを使用
            const vehicleType = 'cosmosp';
            const vehicleInfo = this.vehicleManager.availableVehicles[vehicleType];
            
            if (!vehicleInfo) {
                console.error(`車両タイプ ${vehicleType} が見つかりません`);
                return;
            }
            
            // 車両をロード
            const mesh = await this.vehicleManager.loadVehicleAsset(vehicleInfo);
            
            if (mesh) {
                // クローンを作成
                this.animatedVehicle = mesh.clone(`animated_${vehicleType}`);
                
                // 元のメッシュを削除（重要：クローン後に削除）
                mesh.dispose();
                console.log("🗑️ 元の車両メッシュを削除しました");
                
                // スケール設定
                this.animatedVehicle.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
                
                // 高さを設定（床から少し浮かせる）
                this.animatedVehicle.position.y = 0.1;
                
                // 子メッシュも含めて可視化
                this.animatedVehicle.setEnabled(true);
                this.animatedVehicle.isVisible = true;
                this.animatedVehicle.isPickable = false;
                
                this.animatedVehicle.getChildMeshes().forEach(childMesh => {
                    childMesh.setEnabled(true);
                    childMesh.isVisible = true;
                    childMesh.isPickable = false;
                });
                
                // メタデータを設定
                this.animatedVehicle.metadata = {
                    isAnimatedVehicle: true,
                    isPickable: false
                };
                
                // 初期位置を設定
                this.updateVehiclePosition();
                
                // アニメーションループを開始
                this.startAnimationLoop();
                this.isRunning = true;
                
                console.log("✅ 車両アニメーションが開始されました");
            }
            
        } catch (error) {
            console.error("❌ 車両アニメーションの開始に失敗:", error);
        }
    }
    
    /**
     * 車両の位置を更新（滑らかな補間）
     */
    updateVehiclePosition() {
        if (!this.animatedVehicle) return;
        
        // 現在の距離を経路の総距離で正規化
        const normalizedDistance = this.currentDistance % this.totalDistance;
        
        // 現在のセグメントを見つける
        let currentSegment = null;
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            if (normalizedDistance >= segment.startDistance && 
                normalizedDistance < segment.startDistance + segment.distance) {
                currentSegment = segment;
                break;
            }
        }
        
        // 最後のセグメントの特殊処理
        if (!currentSegment) {
            currentSegment = this.segments[this.segments.length - 1];
        }
        
        // セグメント内での進行度（0-1）
        const segmentProgress = (normalizedDistance - currentSegment.startDistance) / currentSegment.distance;
        
        // 位置を線形補間
        const x = currentSegment.start.x + (currentSegment.end.x - currentSegment.start.x) * segmentProgress;
        const z = currentSegment.start.z + (currentSegment.end.z - currentSegment.start.z) * segmentProgress;
        
        this.animatedVehicle.position.x = x;
        this.animatedVehicle.position.z = z;
        
        // 進行方向を計算（少し先を見る）
        const lookAheadDistance = 0.5;
        const lookAheadNormalized = (normalizedDistance + lookAheadDistance) % this.totalDistance;
        
        // 先読み位置のセグメントを見つける
        let lookAheadSegment = null;
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            if (lookAheadNormalized >= segment.startDistance && 
                lookAheadNormalized < segment.startDistance + segment.distance) {
                lookAheadSegment = segment;
                break;
            }
        }
        
        if (!lookAheadSegment) {
            lookAheadSegment = this.segments[0];
        }
        
        const lookAheadProgress = (lookAheadNormalized - lookAheadSegment.startDistance) / lookAheadSegment.distance;
        const lookAheadX = lookAheadSegment.start.x + (lookAheadSegment.end.x - lookAheadSegment.start.x) * lookAheadProgress;
        const lookAheadZ = lookAheadSegment.start.z + (lookAheadSegment.end.z - lookAheadSegment.start.z) * lookAheadProgress;
        
        // 向きを設定
        const dirX = lookAheadX - x;
        const dirZ = lookAheadZ - z;
        if (dirX !== 0 || dirZ !== 0) {
            this.animatedVehicle.rotation.y = Math.atan2(dirX, dirZ);
        }
    }
    
    /**
     * アニメーションループを開始
     */
    startAnimationLoop() {
        this.scene.registerBeforeRender(() => {
            if (!this.isRunning || !this.animatedVehicle) return;
            
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
            const speed = 10; // 単位: メートル/秒
            
            // 距離を更新
            this.currentDistance += speed * deltaTime * this.animationSpeed;
            
            // 位置を更新
            this.updateVehiclePosition();
        });
    }
    
    /**
     * アニメーションを停止
     */
    stop() {
        this.isRunning = false;
        console.log("🛑 車両アニメーションを停止しました");
    }
    
    /**
     * アニメーションを再開
     */
    resume() {
        if (this.animatedVehicle) {
            this.isRunning = true;
            console.log("▶️ 車両アニメーションを再開しました");
        }
    }
    
    /**
     * 速度を設定
     * @param {number} speed - 速度倍率（0.1～3.0）
     */
    setSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(speed, 3.0));
        console.log(`⚡ アニメーション速度を ${this.animationSpeed}x に設定`);
    }
    
    /**
     * 表示/非表示を切り替え
     * @param {boolean} visible 
     */
    setVisible(visible) {
        if (this.animatedVehicle) {
            this.animatedVehicle.setEnabled(visible);
            this.animatedVehicle.getChildMeshes().forEach(childMesh => {
                childMesh.setEnabled(visible);
            });
        }
    }
    
    /**
     * アニメーションをクリーンアップ
     */
    dispose() {
        this.stop();
        if (this.animatedVehicle) {
            this.animatedVehicle.dispose();
            this.animatedVehicle = null;
        }
        console.log("🗑️ 車両アニメーションをクリーンアップしました");
    }
}