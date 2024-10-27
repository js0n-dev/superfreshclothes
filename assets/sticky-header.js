class StickyHeader extends HTMLElement {
    constructor() {
        super();

        this.stickyClass = 'sticky-header__content--sticky';
        this.stickyBodyClass = 'sticky-header-fixed';
        this.fixedMenuBodyClass = 'sticky-header-fixed--fixed-mega-menu';
        this.params = {
            bp: 992
        };
        this.currentScroll = 0;
        this.fixedScrollOffset = 100;

        this.init();
    }

    init() {
        this.hideWhenScrollDown = this.dataset.hideWhenScrollDown === 'true' ? true : false;
        this.enableDesktop = this.dataset.enableDesktop === 'true';
        this.enableMobile = this.dataset.enableMobile === 'true';
        this.fixedMenu = this.dataset.fixedMenu === 'true';
        
        if(this.enableDesktop) {
            this.params.desktop = {
                contentSelector: '.sticky-header__content-desktop',
                limitSide: 'top',
                fade: true,
                duration: 300
            };
        }

        if(this.enableMobile) {
            this.params.mobile = {
                contentSelector: '.sticky-header__content-mobile',
                limitSide: 'top',
                fade: false
            };
        }
        if(this.params.mobile) {
            this.stickyMobile = this.querySelector(this.params.mobile.contentSelector);

            if(this.stickyMobile) {
                this.spacerMobile = document.createElement('div');
                this.spacerMobile.classList.add('sticky-header__spacer');
                this.spacerMobile.classList.add('sticky-header__spacer--m');
                this.stickyMobile.parentNode.insertBefore(this.spacerMobile, this.stickyMobile);
            } else {
                this.params.mobile = false;
            }
        }
        if(this.params.desktop) {
            this.stickyDesktop = this.querySelector(this.params.desktop.contentSelector);

            if(this.stickyDesktop) {
                this.spacerDesktop = document.createElement('div');
                this.spacerDesktop.classList.add('sticky-header__spacer');
                this.spacerDesktop.classList.add('sticky-header__spacer--d');
                this.stickyDesktop.parentNode.insertBefore(this.spacerDesktop, this.stickyDesktop);
            } else {
                this.params.desktop = false;
            }
        }
        if (this.fixedMenu) document.body.classList.add(this.fixedMenuBodyClass);

        const onResize = () => {
            this.bp = themeBase.isDesktop ? 'desktop' : 'mobile';
            this.currentSticky = themeBase.isDesktop ? this.stickyDesktop : this.stickyMobile;
            this.currentSpacer = themeBase.isDesktop ? this.spacerDesktop : this.spacerMobile;
            
            if(!this.currentSticky) return;
            if (themeBase.isDesktop) {
                if(this.spacerDesktop) this.spacerDesktop.classList.add('sticky-header__spacer--visible');
                if(this.spacerMobile) {
                    this.spacerMobile.classList.remove('sticky-header__spacer--visible');
                    if (this.stickyMobile.classList.contains(this.stickyClass)) {
                        this.unfix(this.stickyMobile, this.spacerMobile);
                    }
                }
            } else {
                if(this.spacerMobile) this.spacerMobile.classList.add('sticky-header__spacer--visible');
                if(this.spacerDesktop) {
                    this.spacerDesktop.classList.remove('sticky-header__spacer--visible');
                    
                    if (this.stickyDesktop.classList.contains(this.stickyClass)) {
                        this.unfix(this.stickyDesktop, this.spacerDesktop);
                    }
                }
            }
        };

        const onScroll = () => {
            if(!this.currentSticky) return;
            
            const stickyParams = this.currentSticky.getBoundingClientRect();
            const spacerParams = this.currentSpacer.getBoundingClientRect();
            const limitSide = this.params[this.bp].limitSide;
            let limit = 0;
            let animatedLogoVisible = false;
            let alwaysFixSticky = false;
            
            if (limitSide === 'top') {
                limit = 0;
            } else if (limitSide === 'bottom') {
                limit = this.currentSticky.classList.contains(this.stickyClass) ? spacerParams.height : stickyParams.height;
            }

            limit *= -1;

            // let scrollUpVisibleLimit = 0;
            // window.pageYOffset > scrollUpVisibleLimit
            // if(this.slideshowComponent) {
            //     scrollUpVisibleLimit = this.slideshowComponent.slider.getBoundingClientRect().bottom + window.pageYOffset;
            // }

            if (spacerParams.top < 0 && this.animatedLogo && window.getComputedStyle(this.animatedLogo).getPropertyValue('display') !== 'none' && this.animatedLogo.getBoundingClientRect().bottom + 200 > 0) {
                animatedLogoVisible = true;
            }
            if (animatedLogoVisible || (spacerParams.top < limit && (!this.hideWhenScrollDown || document.querySelectorAll('.sidebar-fixed-top').length))) {
                alwaysFixSticky = true;
            }
            if ((spacerParams.top < limit && window.pageYOffset < this.currentScroll && !this.querySelectorAll('.menu .visible').length) || alwaysFixSticky) {
                // in limit
                if (!this.currentSticky.classList.contains(this.stickyClass) && (alwaysFixSticky || (!this.unfixedScroll || window.pageYOffset < this.unfixedScroll))) {
                    this.fix(this.currentSticky, this.currentSpacer);
                }
                if(!window.ie) {
                    this.checkHeight(this.currentSticky, this.params[this.bp]);
                }
                if(!document.body.classList.contains('position-fixed')) {
                    this.fixedScroll = window.pageYOffset + this.fixedScrollOffset;
                }
            } else {
                // out limit
                if ((this.querySelectorAll('.menu .visible').length && spacerParams.top >= limit) || (spacerParams.top >= limit && this.currentSticky.classList.contains(this.stickyClass)) || (this.currentSticky.classList.contains(this.stickyClass) && (!this.fixedScroll || window.pageYOffset > this.fixedScroll) && !this.querySelectorAll('.menu .visible').length)) {
                    this.unfix(this.currentSticky, this.currentSpacer);
                }

                this.unfixedScroll = window.pageYOffset - this.fixedScrollOffset;
            }

            this.currentScroll = window.pageYOffset;
        };

        onResize();
        onScroll();

        window.addEventListener('resize', () => {
            onResize();
            onScroll();
        });
        window.addEventListener('scroll', () => {
            if(document.body.classList.contains('position-fixed')) return;

            onScroll();
        });

        // this.throttledOnResize = throttle((event) => {
        //     onResize();
        //     onScroll();
        // }, 30);

        // this.throttledOnScroll = throttle((event) => {
        //     log(1)
        //     if(document.body.classList.contains('position-fixed')) return;

        //     onScroll();
        // }, 30);

        // window.addEventListener('resize', this.throttledOnResize);
        // window.addEventListener('scroll', this.throttledOnScroll);
    }

    fix(sticky, spacer) {
        const height = sticky.getBoundingClientRect().height;
        spacer.style.height = `${height}px`;
        document.documentElement.style.setProperty('--mega-menus-spacing', `${height / 10}rem`);
        // if(this.params[this.bp].fade) {
                // 0.9
        //     sticky.style.opacity = theme.animations.sticky_header.opacity === 1 ? 1 : 0;
        //     $(sticky).animate({ opacity: theme.animations.sticky_header.opacity }, this.params[this.bp].duration());
        // }

        sticky.classList.add(this.stickyClass);
        document.body.classList.add(this.stickyBodyClass);
        setTimeout(() => window.dispatchEvent(new CustomEvent('updateStickySidebar')), 0);
    }

    unfix(sticky, spacer) {
        spacer.removeAttribute('style');

        // if(this.params[this.bp].fade) {
        //     $(sticky).stop();
        // }

        sticky.removeAttribute('style');
        sticky.classList.remove(this.stickyClass);
        document.body.classList.remove(this.stickyBodyClass);
        setTimeout(() => window.dispatchEvent(new CustomEvent('updateStickySidebar')), 0);
    }

    checkHeight(sticky, obj) {
        if(!obj.height) return;

        const spacerParams = this.currentSpacer.getBoundingClientRect();
        const height = spacerParams.bottom <= obj.height ? obj.height : spacerParams.bottom;

        sticky.style.minHeight = `${height}px`;
    }

    getStickyHeight() {
        if(this.currentSticky && this.params[this.bp] && this.currentSticky.classList.contains(this.stickyClass)) {
            if(this.params[this.bp].height) {
                return this.params[this.bp].height;
            } else {
                return this.currentSticky.getBoundingClientRect().height;
            }
        } else {
            return 0;
        }
    }
}

customElements.define('sticky-header', StickyHeader);