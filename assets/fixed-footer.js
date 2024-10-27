class FixedFooter extends HTMLElement {
    constructor() {
        super();
        this.mainContent = document.getElementById('MainContent');
        this.spacer = document.querySelector('.fixed-footer-spacer');
        this.overlay = document.querySelector('#footerOverlay');
        this.opacityOffset = 130;
        this.windowHeightLimitRatio = 1.0;

        themeBase.viewportFunction(true, this.onResize.bind(this));
        window.addEventListener('MutationObserverLoaded', event => themeBase.viewportFunction(true, this.onResize.bind(this, event)));
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('scroll', event => themeBase.viewportFunction(true, this.onScroll.bind(this, event)));
        window.addEventListener('updateFixedFooter', event => themeBase.viewportFunction(true, this.updateMainSizes.bind(this, event)));
    }

    onResize() {
        this.updateFooterSizes();
        this.updateMainSizes();
        this.checkStatus();
        this.checkMainOffset();
        this.checkVisibility();
    }

    onScroll() {
        this.checkVisibility();
    }

    updateFooterSizes() {
        this.height = this.getBoundingClientRect().height;
    }

    updateMainSizes() {
        this.mainContentHeight = this.mainContent.offsetHeight;
    }

    checkVisibility() {
        const visible = this.mainContent.getBoundingClientRect().bottom - 200 <= this.getBoundingClientRect().bottom;

        this.classList[visible ? 'add' : 'remove']('fixed-footer--visible');
        this.checkOverlay();
    }

    checkStatus() {
        const mustBeFixed = themeBase.isDesktop && this.height < window.innerHeight * this.windowHeightLimitRatio && this.mainContentHeight > this.height + window.innerHeight;

        this.classList[mustBeFixed ? 'add' : 'remove']('fixed-footer--fixed');
        document.body.classList[mustBeFixed ? 'add' : 'remove']('fixed-footer-fixed');
        this.mustBeFixed = mustBeFixed;
    }

    checkMainOffset() {
        this.spacer.style.height = this.mustBeFixed ? `${this.height / 10}rem` : '';
    }

    checkOverlay() {
        if (!this.overlay || !themeBase.pageLoaded) return; 

        const difference = this.getBoundingClientRect().top - this.mainContent.getBoundingClientRect().bottom + this.opacityOffset;
        const opacity = Math.max(Math.min(difference / this.height * -1, 1), 0);
        
        if(this.opacity === opacity) return;

        this.overlay.style.opacity = opacity;
        this.opacity = opacity;
    }
}

customElements.define('fixed-footer', FixedFooter);