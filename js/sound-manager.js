class SoundManager {
    constructor() {
        // 音频上下文
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();

        // 创建音量节点
        this.backgroundMusicGain = this.audioContext.createGain();
        this.soundEffectsGain = this.audioContext.createGain();
        this.voiceGain = this.audioContext.createGain();

        // 连接到主输出
        this.backgroundMusicGain.connect(this.audioContext.destination);
        this.soundEffectsGain.connect(this.audioContext.destination);
        this.voiceGain.connect(this.audioContext.destination);

        // 设置初始音量
        this.backgroundMusicGain.gain.value = 0.5;
        this.soundEffectsGain.gain.value = 0.5;
        this.voiceGain.gain.value = 0.5;

        // 音频缓存
        this.audioBuffers = new Map();
        this.audioSources = new Map();

        // 预加载音效
        this.preloadSounds();

        // 绑定音频上下文（用于移动端自动播放）
        this.initAudioContext();
    }

    async preloadSounds() {
        const sounds = {
            correct: 'assets/sounds/correct.mp3',
            wrong: 'assets/sounds/wrong.mp3',
            click: 'assets/sounds/click.mp3',
            achievement: 'assets/sounds/achievement.mp3',
            levelUp: 'assets/sounds/level-up.mp3',
            background: 'assets/sounds/background.mp3'
        };

        for (const [name, url] of Object.entries(sounds)) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(name, audioBuffer);
            } catch (error) {
                console.error(`Error loading sound ${name}:`, error);
            }
        }
    }

    initAudioContext() {
        // 在用户交互时解锁音频上下文（移动端需要）
        document.addEventListener('touchstart', () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });

        // 处理页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.suspendAudioContext();
            } else {
                this.resumeAudioContext();
            }
        });
    }

    async playSound(name, options = {}) {
        try {
            const buffer = this.audioBuffers.get(name);
            if (!buffer) {
                throw new Error(`Sound ${name} not found`);
            }

            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // 创建音量节点
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = options.volume ?? 1;

            // 连接节点
            source.connect(gainNode);
            gainNode.connect(
                name === 'background' ? this.backgroundMusicGain :
                this.soundEffectsGain
            );

            // 设置循环
            if (options.loop) {
                source.loop = true;
            }

            // 存储音频源（用于后续控制）
            if (options.loop) {
                this.audioSources.set(name, source);
            }

            // 开始播放
            source.start(0);

            // 非循环音效自动清理
            if (!options.loop) {
                source.onended = () => {
                    source.disconnect();
                    gainNode.disconnect();
                };
            }

            return source;
        } catch (error) {
            console.error(`Error playing sound ${name}:`, error);
            return null;
        }
    }

    stopSound(name) {
        const source = this.audioSources.get(name);
        if (source) {
            source.stop();
            source.disconnect();
            this.audioSources.delete(name);
        }
    }

    setBackgroundMusicVolume(value) {
        this.backgroundMusicGain.gain.value = value;
    }

    setSoundEffectsVolume(value) {
        this.soundEffectsGain.gain.value = value;
    }

    setVoiceVolume(value) {
        this.voiceGain.gain.value = value;
    }

    async playBackgroundMusic() {
        await this.playSound('background', { loop: true, volume: 0.3 });
    }

    stopBackgroundMusic() {
        this.stopSound('background');
    }

    async playCorrect() {
        await this.playSound('correct');
    }

    async playWrong() {
        await this.playSound('wrong');
    }

    async playClick() {
        await this.playSound('click');
    }

    async playAchievement() {
        await this.playSound('achievement');
    }

    async playLevelUp() {
        await this.playSound('levelUp');
    }

    speak(text, options = {}) {
        return new Promise((resolve, reject) => {
            if ('speechSynthesis' in window) {
                // 停止当前正在播放的语音
                window.speechSynthesis.cancel();

                // 创建语音合成实例
                const utterance = new SpeechSynthesisUtterance(text);

                // 设置语音选项
                utterance.lang = options.lang || 'zh-CN';
                utterance.pitch = options.pitch || 1;
                utterance.rate = options.rate || 0.8;  // 稍微放慢速度，适合儿童
                utterance.volume = this.voiceGain.gain.value;

                // 设置回调
                utterance.onend = resolve;
                utterance.onerror = reject;

                // 开始朗读
                window.speechSynthesis.speak(utterance);
            } else {
                reject('Speech synthesis not supported');
            }
        });
    }

    suspendAudioContext() {
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // 停止所有声音
    stopAll() {
        // 停止所有音频源
        for (const [name, source] of this.audioSources) {
            source.stop();
            source.disconnect();
        }
        this.audioSources.clear();

        // 停止语音合成
        window.speechSynthesis.cancel();
    }
}

// 导出单例实例
export const soundManager = new SoundManager(); 
