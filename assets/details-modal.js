class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener(
      'keyup',
      (event) => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.summaryToggle.addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    
    const button = this.querySelector('button[type="button"]');

    if (button) {
      button.addEventListener(
        'click',
        this.close.bind(this)
      );
    }
    
    this.summaryToggle.setAttribute('role', 'button');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open')
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if ((!this.contains(event.target) || event.target.classList.contains('modal-overlay')) && !event.target.closest('.modal-button-bubble')) this.close(false);
  }
  
  open(event) {
    const detailsElement = event?.target?.closest('details') || this.querySelector('details');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);

    detailsElement.setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');
    
    if(this.classList.contains('details-modal--fixed')) {
      document.body.classList.add('position-fixed');
      document.body.style.top = `${scrollTop * -1}px`;
      document.body.dataset.scrollTop = scrollTop;
    }
    
    setTimeout(() => {
      detailsElement.classList.add('modal-opening');
    }, 0);
    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'), 
      this.dataset.disableElementFocus === 'true' ? null : this.detailsContainer.querySelectorAll('input:not([type="hidden"]), button:not([type="hidden"])')[0]
    );
  }

  close(focusToggle = true) {
    const detailsElement = this.querySelector('details');

    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    detailsElement.classList.remove('modal-opening');
    setTimeout(() => {
      this.detailsContainer.removeAttribute('open');
      document.body.removeEventListener('click', this.onBodyClickEvent);
      document.body.classList.remove('overflow-hidden');
    
      if(this.classList.contains('details-modal--fixed') || document.body.classList.contains('position-fixed')) {
        document.body.classList.remove('position-fixed');
        document.body.style.top = '';
      }
      if(document.body.hasAttribute('data-scroll-top')) {
        window.scrollTo(0, document.body.dataset.scrollTop);
        document.body.removeAttribute('data-scroll-top');
      }
    }, this.classList.contains('details-modal--transition') ? 200 : 0);
  }
}

customElements.define('details-modal', DetailsModal);