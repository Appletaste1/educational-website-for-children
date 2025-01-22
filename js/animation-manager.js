class AnimationManager {
    constructor() {
        // 存储动画状态
        this.animations = new Map();
        
        // 初始化动画帧请求ID
        this.animationFrameId = null;
        
        // 绑定动画循环
        this.animate = this.animate.bind(this);
        
        // 开始动画循环
        this.startAnimationLoop();
    }

    startAnimationLoop() {
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(this.animate);
        }
    }

    stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    animate(timestamp) {
        this.animations.forEach((animation, element) => {
            if (!animation.startTime) {
                animation.startTime = timestamp;
            }

            const elapsed = timestamp - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);

            if (progress < 1) {
                // 执行动画
                animation.onProgress(progress);
            } else {
                // 动画完成
                animation.onComplete?.();
                this.animations.delete(element);
            }
        });

        // 如果还有动画在运行，继续动画循环
        if (this.animations.size > 0) {
            this.animationFrameId = requestAnimationFrame(this.animate);
        } else {
            this.animationFrameId = null;
        }
    }

    // 添加弹跳动画
    addBounceAnimation(element, options = {}) {
        const {
            duration = 500,
            scale = 1.2,
            onComplete
        } = options;

        const originalTransform = element.style.transform || '';

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                // 使用二次贝塞尔曲线创建弹跳效果
                const bounce = Math.sin(progress * Math.PI) * (scale - 1);
                element.style.transform = `${originalTransform} scale(${1 + bounce})`;
            },
            onComplete: () => {
                element.style.transform = originalTransform;
                onComplete?.();
            }
        });

        this.startAnimationLoop();
    }

    // 添加摇晃动画
    addShakeAnimation(element, options = {}) {
        const {
            duration = 500,
            intensity = 5,
            onComplete
        } = options;

        const originalTransform = element.style.transform || '';

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                const shake = Math.sin(progress * Math.PI * 8) * intensity * (1 - progress);
                element.style.transform = `${originalTransform} translateX(${shake}px)`;
            },
            onComplete: () => {
                element.style.transform = originalTransform;
                onComplete?.();
            }
        });

        this.startAnimationLoop();
    }

    // 添加淡入动画
    addFadeInAnimation(element, options = {}) {
        const {
            duration = 500,
            onComplete
        } = options;

        element.style.opacity = '0';
        element.style.display = 'block';

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                element.style.opacity = progress.toString();
            },
            onComplete
        });

        this.startAnimationLoop();
    }

    // 添加淡出动画
    addFadeOutAnimation(element, options = {}) {
        const {
            duration = 500,
            onComplete
        } = options;

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                element.style.opacity = (1 - progress).toString();
            },
            onComplete: () => {
                element.style.display = 'none';
                onComplete?.();
            }
        });

        this.startAnimationLoop();
    }

    // 添加滑入动画
    addSlideInAnimation(element, direction = 'right', options = {}) {
        const {
            duration = 500,
            distance = 100,
            onComplete
        } = options;

        const originalTransform = element.style.transform || '';
        let initialTransform;

        switch (direction) {
            case 'left':
                initialTransform = `translateX(-${distance}px)`;
                break;
            case 'right':
                initialTransform = `translateX(${distance}px)`;
                break;
            case 'up':
                initialTransform = `translateY(-${distance}px)`;
                break;
            case 'down':
                initialTransform = `translateY(${distance}px)`;
                break;
        }

        element.style.transform = `${originalTransform} ${initialTransform}`;
        element.style.opacity = '0';
        element.style.display = 'block';

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                const ease = this.easeOutCubic(progress);
                const translation = distance * (1 - ease);
                let transform;

                switch (direction) {
                    case 'left':
                        transform = `translateX(-${translation}px)`;
                        break;
                    case 'right':
                        transform = `translateX(${translation}px)`;
                        break;
                    case 'up':
                        transform = `translateY(-${translation}px)`;
                        break;
                    case 'down':
                        transform = `translateY(${translation}px)`;
                        break;
                }

                element.style.transform = `${originalTransform} ${transform}`;
                element.style.opacity = ease.toString();
            },
            onComplete
        });

        this.startAnimationLoop();
    }

    // 添加庆祝动画
    addCelebrationAnimation(element, options = {}) {
        const {
            duration = 1000,
            onComplete
        } = options;

        const originalTransform = element.style.transform || '';

        this.animations.set(element, {
            duration,
            onProgress: (progress) => {
                const rotation = Math.sin(progress * Math.PI * 4) * 15;
                const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
                element.style.transform = `${originalTransform} rotate(${rotation}deg) scale(${scale})`;
            },
            onComplete: () => {
                element.style.transform = originalTransform;
                onComplete?.();
            }
        });

        this.startAnimationLoop();
    }

    // 缓动函数
    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    // 停止元素的所有动画
    stopAnimation(element) {
        if (this.animations.has(element)) {
            this.animations.delete(element);
        }
    }

    // 停止所有动画
    stopAllAnimations() {
        this.animations.clear();
        this.stopAnimationLoop();
    }
}

// 导出单例实例
export const animationManager = new AnimationManager(); 