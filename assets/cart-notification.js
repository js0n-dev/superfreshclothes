class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);
    
    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener('transitionend', () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.notification.classList.remove('active');

    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState, open = true) {
      this.productId = parsedState.id;
      const isCheckoutButtonDisabled = document.querySelector('.mini-cart__checkout-button')?.hasAttribute('disabled');
      
      this.getSectionsToRender().forEach((section => {
        const html = new DOMParser().parseFromString(parsedState.sections[section.id], 'text/html');
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];

        selectors.forEach(selector => {
          const elementToReplace =
            selector ? document.getElementById(section.id).querySelector(selector) : document.getElementById(section.id);

          if(!elementToReplace) return;

          elementToReplace.innerHTML =
            this.getSectionInnerHTML(html, (section.filter || selector));
        });

        if(section.callback) section.callback(html);
      }));

      if(isCheckoutButtonDisabled) {
        document.querySelector('.mini-cart__checkout-button')?.setAttribute('disabled', true);
      }

      if (open) this.open();
  }

  getSectionsToRender() {
    let cartSettings = [];

    if(window.enableMiniCart) {
      cartSettings = [
        {
          id: 'mini-cart',
          section: 'mini-cart',
          selector: [
            '.js-content-heading',
            '.js-content-items',
            '.js-content-footer-cart-notes',
            '.js-content-footer-subtotal'
          ],
          callback: (html) => {
            const footerButtons = document.querySelector('.js-content-footer-buttons');

            if(!footerButtons) return;
            
            const htmlFooterButtonsWrapper = html.querySelector('.js-content-footer-buttons').parentNode;
            const isFooterButtonsHidden = htmlFooterButtonsWrapper.classList.contains('hidden');

            footerButtons.parentNode.classList[isFooterButtonsHidden ? 'add' : 'remove']('hidden');

            if(window.toggleMiniCartCheckoutConfirmation) {
              setTimeout(() => toggleMiniCartCheckoutConfirmation(), 0);
            }
          }
        }
      ];
    }

    return [
      {
        id: 'cart-notification-product',
        filter:`#cart-notification-product-${this.productId}`,
      },
      {
        id: 'cart-notification-button'
      },
      {
        id: 'cart-icon-bubble'
      },
      ...cartSettings
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return html.querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
