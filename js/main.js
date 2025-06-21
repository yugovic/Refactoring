// js/main.js
/**
 * アプリケーションのエントリーポイント
 */

import { App } from './core/app.js';

// グローバル変数としてアプリケーションインスタンスを保持（デバッグ用）
window.app = null;

// パフォーマンス監視のインターバルID
let performanceMonitorInterval = null;

// ソースコード最終更新日時（手動で更新）
const SOURCE_LAST_UPDATED = '2025/06/21 11:30';

/**
 * アプリケーションを起動
 */
async function startApplication() {
    try {
        // キャンバス要素を取得
        const canvas = document.getElementById("renderCanvas");
        
        if (!canvas) {
            throw new Error("Canvas element 'renderCanvas' not found");
        }

        // アプリケーションインスタンスを作成
        const app = new App(canvas);
        
        // グローバル変数に保存（デバッグ用）
        window.app = app;
        
        // 初期化
        await app.initialize();
        
        // アプリケーションを開始
        app.start();
        
        // パフォーマンス監視（開発環境のみ）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            startPerformanceMonitoring(app);
        }
        
        console.log("Application started successfully");
        
    } catch (error) {
        console.error("Failed to start application:", error);
        
        // エラーメッセージを表示
        showStartupError(error.message);
    }
}

/**
 * 起動エラーを表示
 * @param {string} message - エラーメッセージ
 */
function showStartupError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
        max-width: 400px;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">起動エラー</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            margin-top: 10px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background-color: white;
            color: red;
            cursor: pointer;
        ">ページを再読み込み</button>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * ソースコード更新日時を取得
 * @returns {string} 更新日時の文字列
 */
function getSourceUpdateTime() {
    return SOURCE_LAST_UPDATED;
}

/**
 * パフォーマンス監視を開始（開発用）
 * @param {App} app - アプリケーションインスタンス
 */
function startPerformanceMonitoring(app) {
    const perfDiv = document.createElement("div");
    perfDiv.id = "performanceMonitor";
    perfDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 300px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #00ff00;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 100;
        border-radius: 4px;
        pointer-events: none;
    `;
    document.body.appendChild(perfDiv);
    
    // 既存のインターバルをクリア
    if (performanceMonitorInterval) {
        clearInterval(performanceMonitorInterval);
    }
    
    // 1秒ごとに更新
    performanceMonitorInterval = setInterval(() => {
        try {
            const stats = app.getPerformanceStats();
            if (stats) {
                perfDiv.innerHTML = `
                    FPS: ${stats.fps.toFixed(1)}<br>
                    Active Meshes: ${stats.activeMeshes}<br>
                    Total Meshes: ${stats.totalMeshes}<br>
                    Vertices: ${stats.totalVertices.toLocaleString()}<br>
                    Draw Calls: ${stats.drawCalls}<br>
                    <hr style="margin: 5px 0; border-color: #333;">
                    Source Updated: ${getSourceUpdateTime()}
                `;
            }
        } catch (error) {
            console.error("Performance monitoring error:", error);
            // エラーが発生した場合は監視を停止
            stopPerformanceMonitoring();
        }
    }, 1000);
}

/**
 * パフォーマンス監視を停止
 */
function stopPerformanceMonitoring() {
    if (performanceMonitorInterval) {
        clearInterval(performanceMonitorInterval);
        performanceMonitorInterval = null;
    }
    
    const perfDiv = document.getElementById("performanceMonitor");
    if (perfDiv) {
        perfDiv.remove();
    }
}

/**
 * アプリケーションのクリーンアップ
 */
function cleanup() {
    // パフォーマンス監視を停止
    stopPerformanceMonitoring();
    
    if (window.app) {
        window.app.dispose();
        window.app = null;
    }
}

// ページアンロード時のクリーンアップ
window.addEventListener("beforeunload", cleanup);

// グローバルエラーハンドリング
window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    
    // アプリケーションのエラーハンドラーが利用可能な場合は使用
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().handleCriticalError(
            event.error,
            'window.error'
        );
    }
});

// 未処理のPromiseエラー
window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().handleError(
            new Error(event.reason),
            'window.unhandledrejection'
        );
    }
});

// DOMContentLoadedで開始
document.addEventListener("DOMContentLoaded", startApplication);

// =============================================================================
// デバッグ用のグローバル関数（ブラウザコンソールから使用可能）
// =============================================================================

/**
 * バウンディングボックス表示の切り替え
 * @param {boolean} visible - 表示するかどうか
 */
window.toggleBoundingBoxes = function(visible = true) {
    if (!window.app) {
        console.error("アプリケーションが初期化されていません");
        return;
    }
    
    const assetPlacer = window.app.getManager('assetPlacer');
    if (assetPlacer && assetPlacer.toggleBoundingBoxVisibility) {
        const count = assetPlacer.toggleBoundingBoxVisibility(visible);
        console.log(`バウンディングボックス表示切り替え: ${visible ? 'ON' : 'OFF'} (${count}個)`);
        return count;
    } else {
        console.error("AssetPlacerが見つかりません");
    }
};

/**
 * 全アセットのバウンディング情報を表示
 */
window.logAllBounding = function() {
    if (!window.app) {
        console.error("アプリケーションが初期化されていません");
        return;
    }
    
    const assetPlacer = window.app.getManager('assetPlacer');
    if (assetPlacer && assetPlacer.logAllBoundingInfo) {
        assetPlacer.logAllBoundingInfo();
    } else {
        console.error("AssetPlacerが見つかりません");
    }
};

/**
 * バウンディング問題の診断
 */
window.diagnoseBounding = function() {
    if (!window.app) {
        console.error("アプリケーションが初期化されていません");
        return;
    }
    
    const assetPlacer = window.app.getManager('assetPlacer');
    if (assetPlacer && assetPlacer.diagnoseBoundingIssues) {
        return assetPlacer.diagnoseBoundingIssues();
    } else {
        console.error("AssetPlacerが見つかりません");
    }
};

/**
 * 車両のバウンディング情報を表示
 */
window.logVehicleBounding = function() {
    if (!window.app) {
        console.error("アプリケーションが初期化されていません");
        return;
    }
    
    const vehicleManager = window.app.getManager('vehicle');
    if (vehicleManager) {
        const placedVehicle = vehicleManager.getPlacedVehicle();
        if (placedVehicle && vehicleManager.logVehicleBoundingInfo) {
            vehicleManager.logVehicleBoundingInfo(placedVehicle);
        } else {
            console.log("配置済み車両が見つかりません");
        }
    } else {
        console.error("VehicleManagerが見つかりません");
    }
};

/**
 * デバッグヘルプを表示
 */
window.debugHelp = function() {
    console.log("=== 🔧 バウンディング調査用デバッグコマンド ===");
    console.log("window.toggleBoundingBoxes(true)  - バウンディングボックス表示をON");
    console.log("window.toggleBoundingBoxes(false) - バウンディングボックス表示をOFF");
    console.log("window.logAllBounding()           - 全アセットのバウンディング情報表示");
    console.log("window.diagnoseBounding()         - バウンディング問題の診断");
    console.log("window.logVehicleBounding()       - 車両のバウンディング情報表示");
    console.log("window.debugHelp()                - このヘルプを表示");
    console.log("\n使用例:");
    console.log("1. 車両を配置する");
    console.log("2. window.logVehicleBounding() で詳細情報を確認");
    console.log("3. window.toggleBoundingBoxes(true) でバウンディングボックスを表示");
    console.log("4. window.diagnoseBounding() で問題を診断");
};

// 初回ヘルプ表示
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log("🔧 バウンディング調査用デバッグ関数が利用可能です。window.debugHelp() でヘルプを表示できます。");
    }, 2000);
});