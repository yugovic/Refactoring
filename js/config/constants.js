// js/config/constants.js
/**
 * アプリケーション全体で使用する定数
 */

// アセットのURL
export const ASSET_URLS = {
    ROOM: "./assets/RoomEmpty.glb",
    BURGER: "./assets/Burger.glb",
    RECORD_MACHINE: "./assets/RecordMachine.glb",
    JUICE_BOX: "./assets/juice_boxv3.glb",
    FLARE_TEXTURE: "https://assets.babylonjs.com/textures/flare.png"
};

// アセットタイプ
export const ASSET_TYPES = {
    CUBE: 'cube',       // バーガー
    RECORD_MACHINE: 'recordMachine',   // レコードマシン
    JUICE_BOX: 'juiceBox',
    MIKE_DESK: 'mikeDesk'
};

// モデルのスケール設定
export const MODEL_SCALES = {
    ROOM: { x: 0.1, y: 0.1, z: 0.1 },           // 部屋のスケール (10%)
    BURGER: { x: 0.1, y: 0.1, z: 0.1 },         // バーガーのスケール (10%)
    RECORD_MACHINE: { x: 0.1, y: 0.1, z: 0.1 }, // レコードマシンのスケール (10%)
    JUICE_BOX: { x: 0.1, y: 0.1, z: 0.1 },      // ジュースボックスのスケール (10%)
    DEFAULT: { x: 0.1, y: 0.1, z: 0.1 }         // デフォルトスケール (10%)
};

// 部屋の境界
export const ROOM_BOUNDARY = {
    MIN_X: -9,
    MAX_X: 9,
    MIN_Z: -9,
    MAX_Z: 9,
    MIN_Y: 0.1,  // 床面より少し上
    MAX_Y: 5.0   // 天井の高さ
};

// カメラ設定
export const CAMERA_SETTINGS = {
    // デフォルトカメラ設定（アイソメトリック）
    DEFAULT: {
        ALPHA: -Math.PI / 4,    // -45度
        BETA: Math.PI / 4,      // 45度
        RADIUS: 20,             // 最大値に設定
        TARGET: { x: 0, y: 1, z: 0 }  // Y座標を上げて画面中央に表示
    },
    
    // カメラ制限
    LIMITS: {
        MIN_RADIUS: 10,
        MAX_RADIUS: 25,
        MIN_BETA: 0.1,
        MAX_BETA: Math.PI / 2,
        MIN_Z: 0.01,
        MAX_Z: 1000
    },
    
    // 1人称カメラ設定
    FIRST_PERSON: {
        EYE_HEIGHT: 1.6,  // 人間の平均的な目線の高さ（メートル）
        SPEED: 0.2,
        ANGULAR_SENSIBILITY: 500,
        INERTIA: 0.5,
        ELLIPSOID: { x: 0.5, y: 0.8, z: 0.5 }  // 人間の体の大きさ
    }
};

// グリッド設定
export const GRID_SETTINGS = {
    SIZE: 2,  // グリッドのサイズ
    MAJOR_UNIT_FREQUENCY: 5,
    MINOR_UNIT_VISIBILITY: 0.45,
    OPACITY: 0.5,
    COLORS: {
        MAIN: { r: 0.2, g: 0.8, b: 0.8 },
        SECONDARY: { r: 0.2, g: 0.4, b: 0.8 }
    }
};

// 照明設定
export const LIGHTING_SETTINGS = {
    AMBIENT: {
        INTENSITY: 0.6,
        DIFFUSE: { r: 0.7, g: 0.8, b: 1.0 },
        SPECULAR: { r: 0.1, g: 0.1, b: 0.15 },
        GROUND_COLOR: { r: 0.2, g: 0.2, b: 0.3 }
    },
    DIRECTIONAL: {
        INTENSITY: 1.0,
        POSITION: { x: -20, y: 40, z: -20 },
        DIRECTION: { x: -0.329292799969871, y: -0.768349381992783325, z: -0.548821299944517 },
        SPECULAR: { r: 0.1, g: 0.1, b: 0.15 }
    },
    POINT_LIGHTS: {
        LIGHT1: {
            POSITION: { x: 5, y: 8, z: 5 },
            DIFFUSE: { r: 0.2, g: 0.4, b: 0.8 },
            INTENSITY: 0.3,
            RADIUS: 20
        },
        LIGHT2: {
            POSITION: { x: -5, y: 8, z: -5 },
            DIFFUSE: { r: 0.8, g: 0.2, b: 0.5 },
            INTENSITY: 0.3,
            RADIUS: 20
        }
    },
    SHADOW: {
        GENERATOR_SIZE: 1024,
        DARKNESS: 0.3,
        BLUR: 2
    }
};

// シャドウ設定（独立したエクスポート）
export const SHADOW_SETTINGS = {
    RESOLUTION: 1024,           // シャドウマップの解像度
    USE_BLUR: true,            // ブラーを使用するか
    USE_PCF: true,             // PCFフィルタリングを使用するか
    BIAS: 0.00001,             // シャドウのバイアス
    NORMAL_BIAS: 0.000001,     // 法線バイアス
    DEPTH_SCALE: 50,           // 深度スケール
    DARKNESS: 0.3,             // 影の暗さ
    BLUR: 2                    // ブラーの強度
};

// プリセット色
export const PRESET_COLORS = {
    MIKE_DESK: new BABYLON.Color3(0.5, 0.3, 0.2),  // 茶色
    GRID_MAIN: new BABYLON.Color3(0.2, 0.8, 0.8),
    GRID_SECONDARY: new BABYLON.Color3(0.2, 0.4, 0.8),
    SELECTION_HIGHLIGHT: new BABYLON.Color3(0, 1, 0),
    WALL_OPACITY: 0.8
};

// アニメーション設定
export const ANIMATION_SETTINGS = {
    ROTATION_SPEED: Math.PI / 2,  // 90度回転
    ROTATION_DURATION: 300,       // ミリ秒
    PLACEMENT_DURATION: 200       // ミリ秒
};

// UI設定
export const UI_SETTINGS = {
    CONTROLS_WIDTH: 280,          // コントロールパネルの幅
    BUTTON_HEIGHT: 35,            // ボタンの高さ
    PANEL_PADDING: 15,            // パネルのパディング
    ANIMATION_DURATION: 300,      // UIアニメーションの時間
    ERROR_DISPLAY_TIME: 5000,     // エラー表示時間
    SUCCESS_DISPLAY_TIME: 2000,   // 成功メッセージ表示時間
    PARTICLE_EFFECT: {
        COUNT: 50,                // パーティクル数
        MIN_LIFETIME: 0.3,        // 最小寿命
        MAX_LIFETIME: 0.8,        // 最大寿命
        EMIT_RATE: 100,           // 放出レート
        UPDATE_SPEED: 0.016       // 更新速度
    }
};

// デバッグ設定
export const DEBUG_SETTINGS = {
    SHOW_BOUNDARY_HELPER: false,  // 境界ヘルパーを表示
    SHOW_CAMERA_INFO: false,      // カメラ情報を表示
    LOG_PERFORMANCE: false,       // パフォーマンスログを出力
    LOG_INTERACTIONS: true,       // インタラクションログを出力
    SHOW_MESH_NAMES: false,       // メッシュ名を表示
    SHOW_WIREFRAME: false         // ワイヤーフレーム表示
};

// パフォーマンス設定
export const PERFORMANCE_SETTINGS = {
    OPTIMIZE_SHADOWS: true,       // 影の最適化
    USE_INSTANCING: true,         // インスタンシングを使用
    MERGE_MESHES: false,          // メッシュのマージ
    USE_LOD: false,               // LOD（Level of Detail）を使用
    ANTIALIASING_SAMPLES: 4       // アンチエイリアシングサンプル数
};

// ファイル設定
export const FILE_SETTINGS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024,  // 最大ファイルサイズ（50MB）
    ALLOWED_EXTENSIONS: ['.glb', '.gltf', '.babylon'],
    TEXTURE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
    EXPORT_QUALITY: 0.95         // エクスポート画質
};

// ネットワーク設定
export const NETWORK_SETTINGS = {
    TIMEOUT: 30000,              // タイムアウト時間（30秒）
    RETRY_COUNT: 3,              // リトライ回数
    RETRY_DELAY: 1000           // リトライ間隔（ミリ秒）
};