document.addEventListener('DOMContentLoaded', function () {
    class AppearanceEffect {
        constructor() {
            this.threshold = 100;
            this.offsetCorrent = 100;
            this.inRowTimeout = 200;
            
            this.updateElements();
            this.onProcess();
            this.onProcessHandler = this.onProcess.bind(this);
            window.addEventListener('MutationObserverLoaded', this.onMutationObserver.bind(this));
            // window.addEventListener('scroll', this.onProcess.bind(this));
            // window.addEventListener('resize', this.onProcess.bind(this));

            const animationStep = () => {
                this.onProcessHandler();
                window.requestAnimationFrame(animationStep);
            };
    
            this.requestAnimation = window.requestAnimationFrame(animationStep);
        }

        updateElements() {
            this.elements = document.querySelectorAll('.animated-appearance:not(.animated-appearance--caught)');
        }

        onMutationObserver() {
            this.updateElements();
            this.onProcess();
        }

        onProcess() {
            const caughtElements = [];

            this.elements.forEach(element => {
                if(element.classList.contains('animated-appearance--caught')) return;

                const elementBound = element.getBoundingClientRect();
                const elementDataThreshold = element.dataset.appearanceThreshold;
                const threshold = elementDataThreshold !== undefined ? elementDataThreshold : this.threshold;
                const crossedViewport = elementBound.top - this.offsetCorrent < window.innerHeight - threshold;

                if(!themeBase.pageLoaded && crossedViewport) {
                    element.classList.add('animated-appearance--caught');
                    element.classList.remove('animated-appearance');
                } else if (elementBound.bottom - this.offsetCorrent > 0 && crossedViewport) {
                    element.classList.add('animated-appearance--caught');
                    caughtElements.push(element);
                }
            });
            caughtElements.forEach((element, index) => {
                const inRowTimeout = this.inRowTimeout * index;

                setTimeout(() => element.classList.add('animated-appearance--visible'), inRowTimeout);
            });
        }
    }

    new AppearanceEffect;
});