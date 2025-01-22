// 音频配置
export const AUDIO_CONFIG = {
    // 默认音量
    DEFAULT_VOLUMES: {
        backgroundMusic: 0.3,
        soundEffects: 0.5,
        voice: 0.7
    },

    // 音频文件路径
    SOUND_PATHS: {
        correct: 'assets/sounds/correct.mp3',
        wrong: 'assets/sounds/wrong.mp3',
        click: 'assets/sounds/click.mp3',
        achievement: 'assets/sounds/achievement.mp3',
        levelUp: 'assets/sounds/level-up.mp3',
        background: 'assets/sounds/background.mp3'
    },

    // 语音合成配置
    SPEECH_CONFIG: {
        lang: 'zh-CN',
        pitch: 1,
        rate: 0.8
    }
};

// 动画配置
export const ANIMATION_CONFIG = {
    // 动画持续时间（毫秒）
    DURATIONS: {
        short: 200,
        medium: 300,
        long: 500,
        extraLong: 1000
    },

    // 动画缓动函数
    EASING: {
        linear: 'linear',
        easeInOut: 'ease-in-out',
        easeOut: 'ease-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
};

// UI 配置
export const UI_CONFIG = {
    // 移动端断点
    BREAKPOINTS: {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
    },

    // 颜色
    COLORS: {
        primary: '#00a8ff',
        secondary: '#00ff88',
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3',
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.5)'
        }
    },

    // 间距
    SPACING: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
    },

    // 圆角
    BORDER_RADIUS: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px'
    },

    // 阴影
    SHADOWS: {
        sm: '0 2px 4px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.1)'
    },

    // Z-index 层级
    Z_INDEX: {
        modal: 1000,
        overlay: 900,
        drawer: 800,
        header: 700,
        tooltip: 600
    }
};

// 课程配置
export const COURSE_CONFIG = {
    // 课程难度等级
    DIFFICULTY_LEVELS: {
        BEGINNER: 1,
        INTERMEDIATE: 2,
        ADVANCED: 3
    },

    // 练习类型
    EXERCISE_TYPES: {
        MULTIPLE_CHOICE: 'multiple_choice',
        FILL_BLANK: 'fill_blank',
        MATCHING: 'matching',
        SORTING: 'sorting',
        DRAWING: 'drawing'
    },

    // 成就类型
    ACHIEVEMENT_TYPES: {
        CHAPTER_COMPLETE: 'chapter_complete',
        PERFECT_SCORE: 'perfect_score',
        FAST_LEARNER: 'fast_learner',
        CONSISTENT_PRACTICE: 'consistent_practice'
    },

    // 评分标准
    SCORING: {
        PERFECT: 100,
        EXCELLENT: 90,
        GOOD: 80,
        PASS: 60
    },

    // 自动保存间隔（毫秒）
    AUTO_SAVE_INTERVAL: 30000,

    // 最大尝试次数
    MAX_ATTEMPTS: 3
};

// 本地存储键
export const STORAGE_KEYS = {
    COURSE_PROGRESS: 'courseProgress',
    USER_SETTINGS: 'userSettings',
    ACHIEVEMENTS: 'achievements',
    VOLUME_SETTINGS: 'volumeSettings'
};

// API 端点
export const API_ENDPOINTS = {
    CHAPTERS: '/api/chapters',
    EXERCISES: '/api/exercises',
    PROGRESS: '/api/progress',
    ACHIEVEMENTS: '/api/achievements'
};

// 错误消息
export const ERROR_MESSAGES = {
    LOAD_FAILED: '加载失败，请重试',
    SAVE_FAILED: '保存失败，请重试',
    SUBMIT_FAILED: '提交失败，请重试',
    NETWORK_ERROR: '网络错误，请检查网络连接',
    AUDIO_FAILED: '音频加载失败',
    INVALID_INPUT: '输入无效，请检查后重试'
};

// 成功消息
export const SUCCESS_MESSAGES = {
    LOAD_SUCCESS: '加载成功',
    SAVE_SUCCESS: '保存成功',
    SUBMIT_SUCCESS: '提交成功',
    ACHIEVEMENT_UNLOCKED: '解锁新成就'
};

// 辅助功能配置
export const A11Y_CONFIG = {
    // ARIA 标签
    ARIA_LABELS: {
        MENU_BUTTON: '打开菜单',
        CLOSE_BUTTON: '关闭',
        PLAY_BUTTON: '播放',
        PAUSE_BUTTON: '暂停',
        VOLUME_SLIDER: '音量控制',
        PROGRESS_BAR: '进度条'
    },

    // 键盘快捷键
    KEYBOARD_SHORTCUTS: {
        TOGGLE_PLAY: 'Space',
        TOGGLE_MUTE: 'M',
        TOGGLE_MENU: 'Escape'
    }
}; 