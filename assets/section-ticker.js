class TickerSection extends HTMLElement {
    constructor() {
      super();
      window.addEventListener('load', () => {
        this.update();
      });
      window.addEventListener('resize', () => {
        this.querySelectorAll('.ticker__content--clone').forEach(element => element.remove());
        this.update();
      });
    }

    connectedCallback() {
      this.content = this.querySelector('.ticker__content');
      this.speed = parseInt(this.dataset.speed);

      this.classList.remove('hidden');
      this.update();
    }

    update() {
      this.classList.remove('animate');
      this.getSizes();
      setTimeout(() => {
        this.cloning();
        this.setSpeed();
        this.classList.add('animate');
      }, 100);
    }

    getSizes() {
      this.width = this.clientWidth;
      this.contentWidth = 0;

      this.content.childNodes.forEach(element => {
        this.contentWidth = this.contentWidth + element.clientWidth;
      });
    }

    setSpeed() {
      this.style.setProperty('--scroll-duration', `${this.contentWidth / (60 + 30 / 3 * this.speed)}s`);
    }

    cloning() {
      const clonningIndex = parseInt(this.width / this.contentWidth) + 1;

      for(let i = 0; i < clonningIndex; i++) {
        let clonedContent = this.content.cloneNode(true);

        clonedContent.classList.add('ticker__content--clone');
        this.insertBefore(clonedContent, this.content.nextSibling);
      }
    }
  }

  customElements.define('ticker-section', TickerSection);