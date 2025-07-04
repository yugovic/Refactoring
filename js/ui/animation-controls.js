// js/ui/animation-controls.js
/**
 * 車両アニメーションコントロールのUI管理
 */

export class AnimationControls {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.app = uiManager.app;
        this.elements = {};
        this.isPlaying = true;
        this.isVisible = true;
    }

    /**
     * コントロールを初期化
     */
    initialize() {
        // DOM要素を取得
        this.collectDOMElements();
        
        // イベントリスナーを設定
        this.setupEventListeners();
        
        // コントロールパネルを表示
        this.show();
        
        console.log("AnimationControls initialized");
    }

    /**
     * DOM要素を収集
     */
    collectDOMElements() {
        this.elements = {
            panel: document.getElementById('animationControls'),
            playPauseBtn: document.getElementById('animationPlayPauseBtn'),
            toggleBtn: document.getElementById('animationToggleBtn'),
            speedSlider: document.getElementById('animationSpeedSlider'),
            speedValue: document.getElementById('animationSpeedValue')
        };
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 再生/一時停止ボタン
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        
        // 表示/非表示ボタン
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.addEventListener('click', () => {
                this.toggleVisibility();
            });
        }
        
        // 速度スライダー
        if (this.elements.speedSlider) {
            this.elements.speedSlider.addEventListener('input', (e) => {
                this.updateSpeed(parseFloat(e.target.value));
            });
        }
    }

    /**
     * 再生/一時停止を切り替え
     */
    togglePlayPause() {
        const vehicleAnimation = this.app.getManager('vehicleAnimation');
        if (!vehicleAnimation) return;
        
        if (this.isPlaying) {
            vehicleAnimation.stop();
            this.elements.playPauseBtn.textContent = '▶ 再生';
            this.isPlaying = false;
        } else {
            vehicleAnimation.resume();
            this.elements.playPauseBtn.textContent = '⏸ 一時停止';
            this.isPlaying = true;
        }
    }

    /**
     * 表示/非表示を切り替え
     */
    toggleVisibility() {
        const vehicleAnimation = this.app.getManager('vehicleAnimation');
        if (!vehicleAnimation) return;
        
        this.isVisible = !this.isVisible;
        vehicleAnimation.setVisible(this.isVisible);
        
        if (this.isVisible) {
            this.elements.toggleBtn.textContent = '👁 表示';
        } else {
            this.elements.toggleBtn.textContent = '👁 非表示';
        }
    }

    /**
     * 速度を更新
     * @param {number} speed 
     */
    updateSpeed(speed) {
        const vehicleAnimation = this.app.getManager('vehicleAnimation');
        if (!vehicleAnimation) return;
        
        vehicleAnimation.setSpeed(speed);
        this.elements.speedValue.textContent = `${speed.toFixed(1)}x`;
    }

    /**
     * コントロールパネルを表示
     */
    show() {
        if (this.elements.panel) {
            this.elements.panel.style.display = 'block';
        }
    }

    /**
     * コントロールパネルを非表示
     */
    hide() {
        if (this.elements.panel) {
            this.elements.panel.style.display = 'none';
        }
    }

    /**
     * クリーンアップ
     */
    dispose() {
        // イベントリスナーを削除
        if (this.elements.playPauseBtn) {
            this.elements.playPauseBtn.replaceWith(this.elements.playPauseBtn.cloneNode(true));
        }
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.replaceWith(this.elements.toggleBtn.cloneNode(true));
        }
        if (this.elements.speedSlider) {
            this.elements.speedSlider.replaceWith(this.elements.speedSlider.cloneNode(true));
        }
        
        this.elements = {};
    }
}