if (!customElements.get('media-zoom')) {
    class MediaZoom extends HTMLElement {
        constructor() {
            super();
            this.parent = this.closest('.media-zoom-parent');
            this.image = this.querySelector('.media-zoom__zoom-image');
            this.offsetCoef = 0.75;
            this.scaleCoef = this.dataset.scaleCoef;

            this.parent.addEventListener('mouseenter', this.onMouseenter.bind(this));
            this.parent.addEventListener('mouseleave', this.onMouseleave.bind(this));
            this.parent.addEventListener('mousemove', this.onMousemove.bind(this));
            window.addEventListener('scroll', this.onScroll.bind(this));
        }

        onMouseenter(event) {
            this.updateSizes();
            this.updatePosition(event);
            this.parent.classList.add('media-zoom-parent--zooming');
        }

        onMouseleave() {
            this.parent.classList.remove('media-zoom-parent--zooming');
        }

        onMousemove(event) {
            this.updatePosition(event);
        }

        onScroll() {
            this.updatePosition();
        }

        updateSizes() {
            this.width = this.offsetWidth;
            this.height = this.offsetHeight;
        }

        updatePosition(event) {
            const offsetCoef = event && event.changedTouches ? 1 : this.offsetCoef;
            const clientY = event ? event.clientY || event.changedTouches[0].clientY : this.clientY;
            const clientX = event ? event.clientX || event.changedTouches[0].clientX : this.clientX;
            const imageBounds = this.parent.getBoundingClientRect();
            const rangeHeight = this.height * offsetCoef;
            const rangeWidth = this.width * offsetCoef;
            const offsetHeight = (this.height - rangeHeight) / 2;
            const offsetWidth = (this.width - rangeWidth) / 2;
            const cursorTop = clientY - imageBounds.top;
            const cursorLeft = clientX - imageBounds.left;
            let top = 0;
            let left = 0;
            this.clientY = clientY;
            this.clientX = clientX;

            if(cursorTop >= this.height - offsetHeight) {
                top = Math.floor((this.height - offsetHeight * 2) * (this.height * this.scaleCoef - this.height) / rangeHeight);
            } else if(cursorTop > offsetHeight) {
                top = Math.floor((cursorTop - offsetHeight) * (this.height * this.scaleCoef - this.height) / rangeHeight);
            }
            if(cursorLeft >= this.width - offsetWidth) {
                left = Math.floor((this.width - offsetWidth * 2) * (this.width * this.scaleCoef - this.width) / rangeWidth);
            } else if(cursorLeft > offsetWidth) {
                left = Math.floor((cursorLeft - offsetWidth) * (this.width * this.scaleCoef - this.width) / rangeWidth);
            }

            this.image.style.transform = `translate3d(${left * -1}px, ${top * -1}px, 0)`;
        }
    }

    customElements.define('media-zoom', MediaZoom);
}