// js/audio/audio-manager.js
/**
 * 音楽・音声の再生を管理するクラス
 */

import { ASSET_URLS } from '../config/constants.js';

export class AudioManager {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // 音楽トラック
        this.backgroundMusic = null;
        this.isMusicPlaying = false;
        this.isMusicLoaded = false; // 独自のロード完了フラグ
        this.volume = 0.1; // デフォルト音量
        
        // オーディオエンジンの状態
        this.audioEngineReady = false;
    }

    /**
     * AudioManagerを初期化
     */
    initialize() {
        console.log('AudioManager.initialize called');
        try {
            // オーディオエンジンの確認と初期化
            if (!BABYLON.Engine.audioEngine) {
                console.log('Creating audio engine...');
                BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
            }
            
            console.log('Audio engine state:', {
                audioEngine: !!BABYLON.Engine.audioEngine,
                locked: BABYLON.Engine.audioEngine.isLocked,
                context: BABYLON.Engine.audioEngine.audioContext
            });
            
            // オーディオエンジンのアンロック
            if (BABYLON.Engine.audioEngine.isLocked) {
                console.log('Audio engine is locked, will unlock on user interaction');
                // 最初のユーザーインタラクションでアンロック
                const unlockAudio = () => {
                    BABYLON.Engine.audioEngine.unlock();
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                    console.log('Audio engine unlocked');
                };
                document.addEventListener('click', unlockAudio);
                document.addEventListener('touchstart', unlockAudio);
            }
            
            this.audioEngineReady = true;
            console.log('AudioManager initialized successfully');
            
            // 背景音楽のロードを遅延実行（ユーザーインタラクション後）
            // this.loadBackgroundMusic(); // 初期化時にはロードしない
            
        } catch (error) {
            console.error('AudioManager initialization error:', error);
            this.errorHandler.handleError(error, 'AudioManager.initialize');
        }
    }

    /**
     * 背景音楽をロード（HTML5 Audio版）
     */
    loadBackgroundMusic() {
        console.log("loadBackgroundMusic called", {
            musicUrl: ASSET_URLS.BACKGROUND_MUSIC
        });
        
        try {
            console.log("Creating HTML5 Audio...");
            this.backgroundMusic = new Audio(ASSET_URLS.BACKGROUND_MUSIC);
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.volume;
            
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log("HTML5 Audio: Music can play through");
                this.isMusicLoaded = true;
            });
            
            this.backgroundMusic.addEventListener('error', (e) => {
                console.error("HTML5 Audio error:", e);
                this.errorHandler.showError("音楽の読み込みに失敗しました");
            });
            
            this.backgroundMusic.addEventListener('play', () => {
                console.log("HTML5 Audio: Playing");
                this.isMusicPlaying = true;
            });
            
            this.backgroundMusic.addEventListener('pause', () => {
                console.log("HTML5 Audio: Paused");
                this.isMusicPlaying = false;
            });
            
            this.backgroundMusic.addEventListener('ended', () => {
                console.log("HTML5 Audio: Ended");
                this.isMusicPlaying = false;
            });
            
            // プリロード開始
            this.backgroundMusic.load();
            console.log("HTML5 Audio created and loading started");
            
        } catch (error) {
            console.error("Failed to create HTML5 Audio:", error);
            this.errorHandler.showError("音楽の読み込みに失敗しました");
        }
    }

    /**
     * 背景音楽を再生
     */
    playBackgroundMusic() {
        console.log("playBackgroundMusic called", {
            backgroundMusic: !!this.backgroundMusic,
            isMusicLoaded: this.isMusicLoaded,
            isMusicPlaying: this.isMusicPlaying
        });
        
        if (!this.backgroundMusic) {
            console.log("Background music not loaded, loading now...");
            this.loadBackgroundMusic();
            // ロード後に再度実行
            setTimeout(() => {
                this.playBackgroundMusic();
            }, 1000);
            return;
        }
        
        if (!this.isMusicLoaded) {
            console.log("Background music not ready yet, waiting for load...");
            // ロード完了を待つ
            const checkReady = setInterval(() => {
                if (this.isMusicLoaded) {
                    clearInterval(checkReady);
                    console.log("Music is now loaded, playing...");
                    this.playBackgroundMusic();
                }
            }, 100);
            
            // 5秒後にタイムアウト
            setTimeout(() => {
                clearInterval(checkReady);
                if (!this.isMusicLoaded) {
                    console.error("Music loading timeout");
                }
            }, 5000);
            return;
        }
        
        if (this.isMusicPlaying) {
            console.log("Music already playing");
            return;
        }
        
        // HTML5 Audioで再生
        const playPromise = this.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("HTML5 Audio: Playback started successfully");
                this.isMusicPlaying = true;
                
                // 実際に再生されているか確認
                setTimeout(() => {
                    console.log("Music playing check:", {
                        paused: this.backgroundMusic.paused,
                        currentTime: this.backgroundMusic.currentTime,
                        volume: this.backgroundMusic.volume,
                        duration: this.backgroundMusic.duration
                    });
                }, 1000);
            }).catch(error => {
                console.error("Failed to play HTML5 Audio:", error);
                this.errorHandler.showError("音楽の再生に失敗しました。ブラウザの設定を確認してください。");
            });
        }
    }

    /**
     * 背景音楽を停止
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic && this.isMusicPlaying) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isMusicPlaying = false;
            console.log("Background music stopped");
        }
    }

    /**
     * 音楽の再生/停止を切り替え
     */
    toggleBackgroundMusic() {
        if (this.isMusicPlaying) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        
        return this.isMusicPlaying;
    }

    /**
     * 音量を設定
     * @param {number} volume - 音量（0.0～1.0）
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.volume;
        }
    }

    /**
     * 現在の音量を取得
     * @returns {number} 音量（0.0～1.0）
     */
    getVolume() {
        return this.volume;
    }

    /**
     * 音楽が再生中かチェック
     * @returns {boolean}
     */
    isPlaying() {
        return this.isMusicPlaying;
    }

    /**
     * 配置音を再生
     * @param {string} soundType - 音のタイプ
     */
    playPlacementSound(soundType) {
        if (!this.audioEngineReady) return;
        
        // 将来的に配置音を追加する場合はここに実装
        console.log(`Placement sound requested: ${soundType}`);
    }

    /**
     * クリーンアップ
     */
    dispose() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.src = '';
            this.backgroundMusic = null;
        }
        
        this.isMusicPlaying = false;
        this.audioEngineReady = false;
    }
}