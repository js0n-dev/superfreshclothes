class AnimatedLogo extends HTMLElement {
    constructor() {
        super();
        // this.duration = 100;
        this.duration = new Number(this.dataset.delay);
        this.placeholderOpacityOffsetCoef = 1 + 0.15;
    }

    connectedCallback() {
        const stickyHeader = document.getElementsByTagName('sticky-header')[0];

        if (stickyHeader) stickyHeader.animatedLogo = this;

        this.picture = document.getElementById('animated-logo-picture');
        this.absolutePicture = document.getElementById('animated-logo-absolute-picture');
        this.absolutePictureTransparent = document.getElementById('animated-logo-absolute-picture-transparent');
        this.headingLogo = document.getElementById('heading-logo');
        this.animatedLogoPlaceholder = document.getElementById('animated-logo-placeholder');
        this.headerSectionsWrapper = this.headingLogo.closest('.header-sections-wrapper');
        this.isCentered = this.classList.contains('animated-logo--centered');
        this.attachedPoint = this.dataset.attachedPoint;

        this.onScrollHandler = this.onScroll.bind(this);

        // window.addEventListener('scroll', this.onScrollHandler, false);
        // window.addEventListener('resize', this.onScrollHandler, false);

        const animationStep = () => {
            this.onScrollHandler();
            window.requestAnimationFrame(animationStep);
        };

        window.requestAnimationFrame(animationStep);

        this.onScrollHandler(true);
        this.classList.add('animated-logo--initialized');
    }

    disconnectedCallback() {
        // window.removeEventListener('scroll', this.onScrollHandler);
        window.cancelAnimationFrame(this.requestAnimation);
    }

    getBounds() {
        this.pictureBounds = this.picture.getBoundingClientRect();
        this.headingLogoBounds = this.headingLogo.getBoundingClientRect();
        this.headerSectionsWrapperBounds = this.headerSectionsWrapper.getBoundingClientRect();
    }

    onScroll(firstLoad) {
        this.getBounds();
        
        // if(this.pictureBounds.bottom < 0) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // const stickyHeaderLogoTopSpaceOffsetCorrection = this.attachedPoint === 'top' ? 0 :
        //     this.attachedPoint === 'center' ? this.headingLogoBounds.height / 2 :
        //         this.headingLogoBounds.height;
                
        const stickyHeaderLogoTopSpace = this.headingLogoBounds.top - this.headerSectionsWrapper.offsetTop;

        const reductionRangeOffsetCorrection = this.attachedPoint === 'top' ? 0 :
            this.attachedPoint === 'center' ? this.pictureBounds.height / 2 :
                this.pictureBounds.height;
        const reductionRange = this.picture.offsetTop - stickyHeaderLogoTopSpace + reductionRangeOffsetCorrection;
        const dynamicsReductionRange = reductionRange - scrollTop;
        const ratioRangeOrigin = Math.max(0, Math.min(1, dynamicsReductionRange / reductionRange));

        if(this.currentRatioRangeOrigin === ratioRangeOrigin) return;

        const percentReductionRangeOrigin = ratioRangeOrigin * 100;
        const percentReductionRange = 100 - percentReductionRangeOrigin;
        const pictureWidthRande = this.pictureBounds.width - this.headingLogoBounds.width;
        const pictureWidthNewValue = this.pictureBounds.width - pictureWidthRande / 100 * Math.min(percentReductionRange, 100);
        const pictureWidthNewScale = (pictureWidthNewValue / this.pictureBounds.width).toFixed(4);
        const pictureDuration = firstLoad === true || this.duration === 0 ? 0 : Math.max(this.duration - this.duration / 100 * percentReductionRange, 0);
        const animatedLogoPlaceholderOpacity = Math.max(1 - percentReductionRange / 100 * this.placeholderOpacityOffsetCoef, 0);

        this.style.setProperty('--absolute-picture-translateY', `${(this.pictureBounds.bottom - this.pictureBounds.height * ratioRangeOrigin) / 10}rem`);
        this.style.setProperty('--absolute-picture-scale', `scale(${pictureWidthNewScale})`);
        this.style.setProperty('--absolute-picture-transition-duration', `${pictureDuration}ms`);

        if (!this.isCentered) {
            this.style.setProperty('--absolute-picture-left', `${50 * ratioRangeOrigin}%`);
        }
        if(this.animatedLogoPlaceholderOpacity !== animatedLogoPlaceholderOpacity) {
            this.animatedLogoPlaceholder.style.opacity = animatedLogoPlaceholderOpacity;
        }

        this.absolutePicture.classList[percentReductionRange >= 100 ? 'add' : 'remove']('invisible');
        this.absolutePictureTransparent.classList[percentReductionRange >= 100 ? 'add' : 'remove']('invisible');
        this.headingLogo.classList[percentReductionRange >= 100 ? 'remove' : 'add']('invisible');
        this.classList[this.absolutePicture.getBoundingClientRect().top < this.headerSectionsWrapperBounds.bottom ? 'add' : 'remove']('animated-logo--crosses-navigation');
        this.animatedLogoPlaceholderOpacity = animatedLogoPlaceholderOpacity;

        this.currentRatioRangeOrigin = ratioRangeOrigin;
    }
}

customElements.define('animated-logo', AnimatedLogo);