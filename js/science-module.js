import { soundManager } from './sound-manager.js';
import { animationManager } from './animation-manager.js';
import { rewardManager } from './reward-manager.js';

class ScienceModule {
    constructor() {
        this.currentExperiment = null;
        this.experiments = new Map();
        this.observations = new Map();
        this.initializeExperiments();
        this.initializeEventListeners();
    }

    initializeExperiments() {
        // Solar System Exploration
        this.experiments.set('solar_system', {
            title: '太阳系探索',
            description: '了解太阳系中的行星和它们的特点',
            type: 'interactive',
            difficulty: 1,
            components: [
                { name: 'sun', type: 'star', size: 100, color: '#FFD700' },
                { name: 'mercury', type: 'planet', size: 20, color: '#A0522D' },
                { name: 'venus', type: 'planet', size: 30, color: '#DEB887' },
                { name: 'earth', type: 'planet', size: 35, color: '#4169E1' },
                { name: 'mars', type: 'planet', size: 25, color: '#CD5C5C' }
            ],
            generateScene: () => this.createSolarSystemScene()
        });

        // Weather Watch
        this.experiments.set('weather', {
            title: '天气观察',
            description: '认识不同的天气现象',
            type: 'observation',
            difficulty: 1,
            phenomena: [
                { name: 'rain', animation: 'rainfall', sound: 'rain' },
                { name: 'thunder', animation: 'lightning', sound: 'thunder' },
                { name: 'wind', animation: 'breeze', sound: 'wind' },
                { name: 'snow', animation: 'snowfall', sound: 'winter' }
            ],
            generateScene: () => this.createWeatherScene()
        });

        // Plant Growth
        this.experiments.set('plant_growth', {
            title: '植物生长',
            description: '观察植物的生长过程',
            type: 'simulation',
            difficulty: 1,
            stages: [
                { name: 'seed', duration: 2000, height: 10 },
                { name: 'sprout', duration: 3000, height: 30 },
                { name: 'young', duration: 4000, height: 60 },
                { name: 'mature', duration: 5000, height: 100 }
            ],
            factors: ['water', 'sunlight', 'soil'],
            generateScene: () => this.createPlantGrowthScene()
        });
    }

    initializeEventListeners() {
        // Experiment selection
        document.querySelectorAll('.experiment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const experimentId = btn.dataset.experiment;
                this.startExperiment(experimentId);
            });
        });

        // Interactive controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleControl(action);
            });
        });

        // Observation recording
        document.querySelector('.record-observation')?.addEventListener('click', () => {
            this.recordObservation();
        });
    }

    async startExperiment(experimentId) {
        try {
            const experiment = this.experiments.get(experimentId);
            if (!experiment) return;

            this.currentExperiment = experiment;
            
            // Update UI
            const experimentContainer = document.querySelector('.experiment-container');
            if (!experimentContainer) return;

            // Show loading animation
            experimentContainer.innerHTML = '<div class="loading-spinner">准备实验中...</div>';
            
            // Generate experiment scene
            const scene = await experiment.generateScene();
            experimentContainer.innerHTML = scene;
            
            // Initialize interactive elements
            this.initializeInteractiveElements();
            
            // Play introduction
            await soundManager.speak(`让我们开始${experiment.title}实验！`, {
                rate: 0.8,
                pitch: 1
            });

            return true;
        } catch (error) {
            console.error('Error starting experiment:', error);
            return false;
        }
    }

    createSolarSystemScene() {
        let html = `
            <div class="solar-system-container relative w-full h-96">
                <div class="sun absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style="width: 100px; height: 100px; background: radial-gradient(#FFD700, #FFA500);">
                </div>
        `;

        // Add orbits and planets
        const orbits = [120, 160, 200, 240];
        this.currentExperiment.components.forEach((component, index) => {
            if (component.type === 'planet') {
                const orbit = orbits[index - 1];
                html += `
                    <div class="orbit absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        style="width: ${orbit * 2}px; height: ${orbit * 2}px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 50%;">
                    </div>
                    <div class="planet absolute" data-planet="${component.name}"
                        style="width: ${component.size}px; height: ${component.size}px; background-color: ${component.color}; transform-origin: ${orbit}px 50%;">
                    </div>
                `;
            }
        });

        html += `
            </div>
            <div class="controls mt-6 flex justify-center space-x-4">
                <button class="control-btn btn-child" data-action="pause">暂停运行</button>
                <button class="control-btn btn-child" data-action="speed">调整速度</button>
                <button class="control-btn btn-child" data-action="info">查看信息</button>
            </div>
        `;

        return html;
    }

    createWeatherScene() {
        let html = `
            <div class="weather-scene-container relative w-full h-96 bg-gradient-to-b from-blue-400 to-blue-600">
                <div class="weather-elements absolute inset-0"></div>
                <div class="controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        `;

        this.currentExperiment.phenomena.forEach(phenomenon => {
            html += `
                <button class="control-btn btn-child" data-weather="${phenomenon.name}">
                    ${this.getWeatherIcon(phenomenon.name)}
                    <span class="ml-2">${this.getWeatherName(phenomenon.name)}</span>
                </button>
            `;
        });

        html += `
                </div>
            </div>
            <div class="observation-panel mt-6">
                <h3 class="text-xl font-bold mb-2">记录观察</h3>
                <textarea class="observation-notes w-full h-32 bg-gray-800 rounded-lg p-4" placeholder="写下你观察到的天气现象..."></textarea>
                <button class="record-observation btn-child mt-4">保存观察记录</button>
            </div>
        `;

        return html;
    }

    createPlantGrowthScene() {
        let html = `
            <div class="plant-growth-container relative w-full h-96 bg-gradient-to-b from-blue-900 to-green-900">
                <div class="plant absolute bottom-0 left-1/2 transform -translate-x-1/2" style="height: 10px;">
                    <div class="stem w-2 bg-green-500 h-full"></div>
                    <div class="leaves"></div>
                </div>
                <div class="controls absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        `;

        this.currentExperiment.factors.forEach(factor => {
            html += `
                <button class="control-btn btn-child" data-factor="${factor}">
                    ${this.getFactorIcon(factor)}
                    <span class="ml-2">${this.getFactorName(factor)}</span>
                </button>
            `;
        });

        html += `
                </div>
            </div>
            <div class="growth-timeline mt-6">
                <h3 class="text-xl font-bold mb-2">生长阶段</h3>
                <div class="stage-indicators flex justify-between">
        `;

        this.currentExperiment.stages.forEach(stage => {
            html += `
                <div class="stage-indicator" data-stage="${stage.name}">
                    <div class="indicator-dot w-4 h-4 rounded-full bg-gray-600"></div>
                    <span class="text-sm mt-2">${this.getStageName(stage.name)}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    initializeInteractiveElements() {
        switch (this.currentExperiment.type) {
            case 'interactive':
                this.initializeSolarSystem();
                break;
            case 'observation':
                this.initializeWeather();
                break;
            case 'simulation':
                this.initializePlantGrowth();
                break;
        }
    }

    initializeSolarSystem() {
        // Animate planets
        document.querySelectorAll('.planet').forEach((planet, index) => {
            const speed = 1 + index * 0.5;
            this.animatePlanet(planet, speed);
        });

        // Handle controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'pause':
                        this.togglePlanetMotion();
                        break;
                    case 'speed':
                        this.adjustPlanetSpeed();
                        break;
                    case 'info':
                        this.showPlanetInfo();
                        break;
                }
            });
        });
    }

    initializeWeather() {
        document.querySelectorAll('[data-weather]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const weather = e.target.dataset.weather;
                this.changeWeather(weather);
            });
        });
    }

    initializePlantGrowth() {
        this.growthFactors = {
            water: 0,
            sunlight: 0,
            soil: 0
        };

        document.querySelectorAll('[data-factor]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const factor = e.target.dataset.factor;
                this.adjustGrowthFactor(factor);
            });
        });

        this.startGrowthSimulation();
    }

    animatePlanet(planet, speed) {
        let rotation = 0;
        const animate = () => {
            rotation += speed;
            planet.style.transform = `rotate(${rotation}deg)`;
            if (!this.isPaused) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    togglePlanetMotion() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.initializeSolarSystem();
        }
    }

    adjustPlanetSpeed() {
        // Implementation for speed adjustment
    }

    showPlanetInfo() {
        // Implementation for showing planet information
    }

    changeWeather(weather) {
        const weatherElements = document.querySelector('.weather-elements');
        weatherElements.innerHTML = '';

        const phenomenon = this.currentExperiment.phenomena.find(p => p.name === weather);
        if (!phenomenon) return;

        // Play weather sound
        soundManager.playSound(phenomenon.sound);

        // Add weather animation
        animationManager[`add${phenomenon.animation}Animation`](weatherElements);

        // Update observation notes placeholder
        const notes = document.querySelector('.observation-notes');
        if (notes) {
            notes.placeholder = `描述一下${this.getWeatherName(weather)}的特点...`;
        }
    }

    adjustGrowthFactor(factor) {
        this.growthFactors[factor] = Math.min(this.growthFactors[factor] + 1, 3);
        this.updatePlantGrowth();
    }

    startGrowthSimulation() {
        let currentStage = 0;
        const stages = this.currentExperiment.stages;

        const growthInterval = setInterval(() => {
            if (currentStage >= stages.length) {
                clearInterval(growthInterval);
                return;
            }

            const stage = stages[currentStage];
            const plant = document.querySelector('.plant');
            if (plant) {
                plant.style.height = `${stage.height}px`;
                this.updateGrowthIndicators(currentStage);
            }

            currentStage++;
        }, 3000);
    }

    updatePlantGrowth() {
        const totalFactors = Object.values(this.growthFactors).reduce((a, b) => a + b, 0);
        const plant = document.querySelector('.plant');
        if (plant) {
            const height = Math.min(totalFactors * 30, 100);
            plant.style.height = `${height}px`;
        }
    }

    updateGrowthIndicators(currentStage) {
        document.querySelectorAll('.stage-indicator').forEach((indicator, index) => {
            if (index <= currentStage) {
                indicator.querySelector('.indicator-dot').classList.add('bg-green-500');
            }
        });
    }

    recordObservation() {
        const notes = document.querySelector('.observation-notes')?.value;
        if (!notes) return;

        const observation = {
            experiment: this.currentExperiment.title,
            notes,
            timestamp: new Date().toISOString()
        };

        this.observations.set(observation.timestamp, observation);
        
        // Show success message
        this.showFeedback('观察记录已保存！', 'success');
        
        // Update progress
        rewardManager.updateProgress({
            type: 'science',
            experimentId: this.currentExperiment.title,
            completed: true
        });
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        document.querySelector('.feedback-container')?.appendChild(feedback);
        
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

    getWeatherIcon(weather) {
        const icons = {
            rain: '🌧️',
            thunder: '⛈️',
            wind: '💨',
            snow: '❄️'
        };
        return icons[weather] || '🌈';
    }

    getWeatherName(weather) {
        const names = {
            rain: '下雨',
            thunder: '打雷',
            wind: '刮风',
            snow: '下雪'
        };
        return names[weather] || '天气';
    }

    getFactorIcon(factor) {
        const icons = {
            water: '💧',
            sunlight: '☀️',
            soil: '🌱'
        };
        return icons[factor] || '❓';
    }

    getFactorName(factor) {
        const names = {
            water: '浇水',
            sunlight: '阳光',
            soil: '土壤'
        };
        return names[factor] || '因素';
    }

    getStageName(stage) {
        const names = {
            seed: '种子',
            sprout: '发芽',
            young: '幼苗',
            mature: '成熟'
        };
        return names[stage] || '阶段';
    }
}

// Export singleton instance
export const scienceModule = new ScienceModule(); 