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
    TROPHY: "./assets/Basic/TrophyFree.glb",
    BACKGROUND_360: "./assets/BackGroundTest360",
    FLARE_TEXTURE: "https://assets.babylonjs.com/textures/flare.png",
    BACKGROUND_MUSIC: "./assets/Music/Cruise_by_the_Sea.mp3"
};

// 360度背景設定
export const BACKGROUND_360_SETTINGS = {
    DIAMETER: 100,              // スカイボックスの直径
    FLIP_Y: true,              // Y軸（上下）を反転するか
    FLIP_X: false,             // X軸（左右）を反転するか
    ROTATION_Y: 0,             // Y軸回転（ラジアン）
    ROTATION_X: 0,             // X軸回転（ラジアン）
    ROTATION_Z: 0,             // Z軸回転（ラジアン）
    BRIGHTNESS: 0.3,           // 明度調整（0-2）
    CONTRAST: 1.0,             // コントラスト調整（0-2）
    SATURATION: 1.0,           // 彩度調整（0-2）
    HUE_SHIFT: 0,              // 色相シフト（0-360度）
    WRAP_MODE: 'MIRROR'        // テクスチャラップモード（'CLAMP', 'MIRROR', 'WRAP'）
};

// アセットタイプ
export const ASSET_TYPES = {
    CUBE: 'cube',       // バーガー
    RECORD_MACHINE: 'recordMachine',   // レコードマシン
    JUICE_BOX: 'juiceBox',
    MIKE_DESK: 'mikeDesk',
    TROPHY: 'trophy',   // トロフィー
    // 環境装飾オブジェクト
    TREE: 'tree',
    BUILDING: 'building'
};

// モデルのスケール設定
export const MODEL_SCALES = {
    ROOM: { x: 0.1, y: 0.1, z: 0.1 },           // 部屋のスケール (10%)
    BURGER: { x: 0.1, y: 0.1, z: 0.1 },         // バーガーのスケール (10%)
    RECORD_MACHINE: { x: 0.1, y: 0.1, z: 0.1 }, // レコードマシンのスケール (10%)
    JUICE_BOX: { x: 0.1, y: 0.1, z: 0.1 },      // ジュースボックスのスケール (10%)
    TROPHY: { x: 0.1, y: 0.1, z: 0.1 },         // トロフィーのスケール (10%)
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
    RESOLUTION: 1024,           // シャドウマップの解像度を上げて品質向上
    USE_BLUR: true,            // ブラーを使用するか
    USE_PCF: false,            // PCFフィルタリングを無効化（パフォーマンス優先）
    BIAS: 0.005,               // シャドウのバイアスを増やしてアクネを防ぐ
    NORMAL_BIAS: 0.001,        // 法線バイアスも増やす
    DEPTH_SCALE: 50,           // 深度スケール
    DARKNESS: 0,               // 影の暗さ（初期値0）
    BLUR: 2,                   // ブラーの強度
    FRUSTUM_EDGE_FALLOFF: 0   // フラスタムエッジのフォールオフを無効化
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

// 環境装飾オブジェクト設定
export const ENVIRONMENT_OBJECTS = {
    TREES: [
        { position: { x: 15, y: 0, z: 8 }, scale: { x: 0.8, y: 1.2, z: 0.8 } },
        { position: { x: -12, y: 0, z: -15 }, scale: { x: 1.0, y: 1.1, z: 1.0 } },
        { position: { x: 18, y: 0, z: -10 }, scale: { x: 0.9, y: 1.3, z: 0.9 } },
        { position: { x: -20, y: 0, z: 12 }, scale: { x: 1.1, y: 1.0, z: 1.1 } }
    ],
    BUILDINGS: [
        { position: { x: -25, y: 0, z: -8 }, scale: { x: 2.0, y: 1.5, z: 1.8 }, rotation: { y: 0.3 } },
        { position: { x: 22, y: 0, z: 15 }, scale: { x: 1.5, y: 2.0, z: 1.2 }, rotation: { y: -0.8 } },
        { position: { x: 12, y: 0, z: -22 }, scale: { x: 1.8, y: 1.8, z: 2.2 }, rotation: { y: 1.2 } }
    ]
};