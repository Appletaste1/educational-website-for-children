import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';
import { rewardManager } from './reward-manager.js';

class EnglishModule {
    constructor() {
        this.speechRecognition = null;
        this.currentWord = '';
        this.currentStory = null;
        this.vocabulary = new Map();
        this.initializeSpeechRecognition();
        this.initializeEventListeners();
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.speechRecognition = new webkitSpeechRecognition();
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';

            this.speechRecognition.onresult = (event) => {
                const result = event.results[0][0].transcript.toLowerCase();
                this.checkPronunciation(result);
            };
        }
    }

    initializeEventListeners() {
        // Pronunciation practice buttons
        document.querySelectorAll('.practice-word').forEach(btn => {
            btn.addEventListener('click', () => {
                this.startPronunciationPractice(btn.dataset.word);
            });
        });

        // Story navigation
        document.querySelectorAll('.story-nav').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                this.navigateStory(direction);
            });
        });

        // Vocabulary game interactions
        document.querySelectorAll('.vocab-card').forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        document.querySelectorAll('.vocab-target').forEach(target => {
            target.addEventListener('dragover', this.handleDragOver.bind(this));
            target.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    async startPronunciationPractice(word) {
        try {
            this.currentWord = word;
            
            // Play word pronunciation
            await soundManager.speak(word, {
                lang: 'en-US',
                rate: 0.8,
                pitch: 1
            });

            // Show visual cue for user to speak
            const practiceBtn = document.querySelector(`[data-word="${word}"]`);
            animationManager.addPulseAnimation(practiceBtn);

            // Start listening
            if (this.speechRecognition) {
                this.speechRecognition.start();
            }
        } catch (error) {
            console.error('Error in pronunciation practice:', error);
        }
    }

    checkPronunciation(spokenWord) {
        const similarity = this.calculateSimilarity(spokenWord, this.currentWord);
        
        if (similarity >= 0.8) {
            // Correct pronunciation
            soundManager.playCorrect();
            rewardManager.updateProgress({
                type: 'pronunciation',
                word: this.currentWord,
                success: true
            });
            this.showFeedback('Great pronunciation! 👏', 'success');
        } else {
            // Needs improvement
            soundManager.playWrong();
            this.showFeedback('Try again! Listen carefully. 🎯', 'error');
        }
    }

    async loadStory(storyId) {
        try {
            const response = await fetch(`/api/stories/${storyId}`);
            if (!response.ok) throw new Error('Failed to load story');
            
            this.currentStory = await response.json();
            
            // Update story display
            const storyContainer = document.querySelector('.story-container');
            storyContainer.innerHTML = this.currentStory.pages[0].content;
            
            // Start narration
            await this.narrate(0);
            
            return true;
        } catch (error) {
            console.error('Error loading story:', error);
            return false;
        }
    }

    async narrate(pageIndex) {
        if (!this.currentStory) return;
        
        const page = this.currentStory.pages[pageIndex];
        const words = page.content.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            // Highlight current word
            const wordElements = document.querySelectorAll('.story-word');
            wordElements[i].classList.add('highlighted');
            
            // Narrate word
            await soundManager.speak(words[i], {
                lang: 'en-US',
                rate: 0.8,
                pitch: 1
            });
            
            // Remove highlight
            wordElements[i].classList.remove('highlighted');
        }
    }

    navigateStory(direction) {
        if (!this.currentStory) return;
        
        const currentPage = parseInt(document.querySelector('.story-page').dataset.page);
        const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
        
        if (newPage >= 0 && newPage < this.currentStory.pages.length) {
            this.showPage(newPage);
        }
    }

    showPage(pageIndex) {
        const storyContainer = document.querySelector('.story-container');
        storyContainer.innerHTML = this.currentStory.pages[pageIndex].content;
        document.querySelector('.story-page').dataset.page = pageIndex;
        
        // Start narration for new page
        this.narrate(pageIndex);
    }

    // Vocabulary game methods
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.word);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        const word = e.dataTransfer.getData('text/plain');
        const targetWord = e.target.dataset.word;
        
        if (word === targetWord) {
            soundManager.playCorrect();
            animationManager.addCelebrationAnimation(e.target);
            rewardManager.updateProgress({
                type: 'vocabulary',
                word: word,
                success: true
            });
        } else {
            soundManager.playWrong();
            animationManager.addShakeAnimation(e.target);
        }
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        document.querySelector('.feedback-container').appendChild(feedback);
        
        animationManager.addSlideInAnimation(feedback, 'bottom', {
            duration: 300,
            onComplete: () => {
                setTimeout(() => {
                    animationManager.addSlideOutAnimation(feedback, 'bottom', {
                        duration: 300,
                        onComplete: () => feedback.remove()
                    });
                }, 2000);
            }
        });
    }

    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance implementation
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j - 1] + 1,
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1
                    );
                }
            }
        }
        
        return 1 - (dp[m][n] / Math.max(m, n));
    }
}

// Export singleton instance
export const englishModule = new EnglishModule(); 