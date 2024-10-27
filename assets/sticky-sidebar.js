if (!customElements.get('sticky-sidebar')) {
    customElements.define('sticky-sidebar', 
        class StickySidebar extends HTMLElement {
            constructor() {
                super();
            }
        
            connectedCallback() {
                this.onUpdate = this.update.bind(this);

                ['resize', 'MutationObserver', 'MutationObserverLoaded', 'updateStickySidebar']
                    .forEach(event => window.addEventListener(event, this.onUpdate));
            }

            disconnectedCallback() {
                ['resize', 'MutationObserver', 'MutationObserverLoaded', 'updateStickySidebar']
                    .forEach(event => window.removeEventListener(event, this.onUpdate));
            }

            update() {
                if (!themeBase.isDesktop || window.moz) return;

                const height = this.getBoundingClientRect().height;
                let offsetTop = 0;
                
                try {
                    offsetTop = eval(getComputedStyle(this).getPropertyValue('--sticky-top').replace(/[a-z]/g, '')) * 10;
                } catch(error) {
                    log(error);
                }

                if (height > themeBase.windowHeight - offsetTop) {
                    this.style.setProperty('--sticky-current-height', `${Math.floor(height) / 10 * -1}rem`);
                    this.classList.add('sticky-sidebar--dynamic-offset');  
                } else {
                    this.classList.remove('sticky-sidebar--dynamic-offset');  
                }            
            }
        }
    );
}