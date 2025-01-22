export const MATH_CONFIG = {
    // Exercise difficulty levels
    DIFFICULTY_LEVELS: {
        BEGINNER: {
            range: { min: 0, max: 10 },
            operations: ['+', '-'],
            timeLimit: 30, // seconds
            requiredScore: 5
        },
        INTERMEDIATE: {
            range: { min: 0, max: 20 },
            operations: ['+', '-', '*'],
            timeLimit: 45,
            requiredScore: 10
        },
        ADVANCED: {
            range: { min: 0, max: 100 },
            operations: ['+', '-', '*', '/'],
            timeLimit: 60,
            requiredScore: 15
        }
    },

    // Achievement thresholds
    ACHIEVEMENTS: {
        QUICK_LEARNER: {
            id: 'quick_learner',
            name: '快速学习者',
            description: '在30秒内完成5道题',
            icon: '⚡'
        },
        PERFECT_SCORE: {
            id: 'perfect_score',
            name: '完美表现',
            description: '连续答对10道题',
            icon: '🌟'
        },
        MATH_MASTER: {
            id: 'math_master',
            name: '数学大师',
            description: '达到高级难度',
            icon: '👑'
        }
    },

    // Sound effects
    SOUNDS: {
        CORRECT: 'correct.mp3',
        WRONG: 'wrong.mp3',
        LEVEL_UP: 'level-up.mp3',
        ACHIEVEMENT: 'achievement.mp3'
    },

    // Animation settings
    ANIMATIONS: {
        FEEDBACK_DURATION: 1500,
        LEVEL_UP_DURATION: 2000,
        NUMBER_LINE_TRANSITION: 300
    },

    // Visual themes
    THEMES: {
        SPACE: {
            name: '太空探险',
            background: 'space-bg.jpg',
            accent: '#4CAF50'
        },
        OCEAN: {
            name: '海洋探索',
            background: 'ocean-bg.jpg',
            accent: '#2196F3'
        },
        JUNGLE: {
            name: '丛林冒险',
            background: 'jungle-bg.jpg',
            accent: '#FF9800'
        }
    },

    // Reward system
    REWARDS: {
        CORRECT_ANSWER: 10,
        STREAK_BONUS: 5,
        QUICK_ANSWER_BONUS: 15,
        LEVEL_COMPLETION: 50
    },

    // Learning tools settings
    TOOLS: {
        NUMBER_LINE: {
            minValue: 0,
            maxValue: 100,
            stepSize: 1,
            showLabels: true
        },
        COUNTING_BLOCKS: {
            maxBlocks: 20,
            columns: 5,
            showNumbers: true
        }
    },

    // Progress tracking
    PROGRESS: {
        SAVE_INTERVAL: 60000, // Save progress every minute
        AUTO_LEVEL_UP_THRESHOLD: 0.8, // 80% correct answers to level up
        MAX_LEVEL: 10
    }
}; 