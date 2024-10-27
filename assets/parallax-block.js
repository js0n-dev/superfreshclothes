if (!customElements.get('parallax-block')) {
    class ParallaxBlock extends HTMLElement {
        constructor() {
            super();

            this.onCheckPosition = this.checkPosition.bind(this);
            
            ['MutationObserver', 'MutationObserverLoaded', 'scroll', 'resize'].forEach(event => {
                window.addEventListener(event, this.onCheckPosition);
            });
        }

        disconnectedCallback() {
            ['MutationObserver', 'MutationObserverLoaded', 'scroll', 'resize'].forEach(event => {
                window.removeEventListener(event, this.onCheckPosition);
            });
        }
    
        checkPosition() {
            if (!themeBase.isDesktop) return;

            const contentStroke = window.innerHeight + this.offsetHeight;
            const contentPos = this.getBoundingClientRect();
    
            if (contentPos.bottom < 0 || contentPos.bottom > contentStroke) {
                return;
            }
    
            const blocks = this.querySelectorAll('.parallax-block__element');
            const scrollPercent = contentPos.bottom / (contentStroke / 100);

            blocks.forEach(block => {
                const stroke = +block.dataset.stroke;
                let blocksOffset = (stroke / 100) * scrollPercent;
    
                if (blocksOffset > stroke / 2) {
                    blocksOffset -= stroke / 2;
                } else if (blocksOffset < stroke / 2) {
                    blocksOffset = (stroke / 2 - blocksOffset) * -1;
                } else {
                    blocksOffset = 0;
                }

                block.style.setProperty('--parallax', `translateY(${blocksOffset}px)`);
            });
        }
    }
    
    customElements.define('parallax-block', ParallaxBlock);
}