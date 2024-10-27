class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.preventDefault();
      this.closest('cart-items').updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById(this.dataset.shoppingCartLineItemStatusId);

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    const mainMiniCartItems = this.querySelector('.mini-cart__items, .cart__items');

    mainMiniCartItems.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  onCartUpdate() {
    return;
    fetch(`${routes.cart_url}?section_id=main-cart-items`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const sourceQty = html.querySelector('cart-items');
        this.innerHTML = sourceQty.innerHTML;
      })
      .catch((e) => {
        console.error(e);
      });
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

    const mainCartItems = document.getElementById('main-cart-items');

    if(mainCartItems) {
      cartSettings = [...cartSettings, {
          id: 'main-cart-items',
          section: 'main-cart-items',
          // section: document.getElementById('main-cart-items').dataset.id,
          selector: [
            '.js-contents',
            '.js-content-icon-bubble'
          ]
        },
        {
          id: 'cart-live-region-text',
          section: 'cart-live-region-text',
          selector: '.shopify-section'
        }
        ,{
          id: 'main-cart-footer',
          section: document.getElementById('main-cart-footer').dataset.id,
          selector: '.js-contents',
        }
      ];
    }

    return [
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble'
      },
      ...cartSettings
    ];
  }

  updateQuantity(line, quantity, name) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement = document.getElementById(`${this.dataset.quantityId}${line}`);
        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartFooter = document.getElementById('main-cart-footer');
        const isCheckoutButtonDisabled = document.querySelector('.mini-cart__checkout-button')?.hasAttribute('disabled');

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          const errorText = window.cartStrings.quantityError.replace(
            '[quantity]',
            document.getElementById(`${this.dataset.quantityId}${line}`).value);

          document.getElementById(`${this.dataset.lineItemErrorId}${line}`)
            .querySelector('.js-cart-items-error-text')
            .innerHTML = errorText;
            
          this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
          this.disableLoading();
          alert(errorText);
          return;
        }
        
        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section => {
          const parsedStateSection = parsedState.sections[section.id] || parsedState.sections[section.section];
          const html = new DOMParser().parseFromString(parsedStateSection, 'text/html');
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

        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem =  document.getElementById(`${this.dataset.cartItemId}${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) lineItem.querySelector(`[name="${name}"]`).focus();
        this.disableLoading();
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items' });
      }).catch(error => {
        console.error(error);
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        document.getElementById(this.dataset.errorsId).textContent = window.cartStrings.error;
        this.disableLoading();
      });
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      const quantityElementById = document.getElementById(`${this.dataset.quantityId}${line}`);

      if (!quantityElementById) return;

      const errorText = window.cartStrings.quantityError.replace(
        '[quantity]',
        quantityElementById.value);

      document.getElementById(`${this.dataset.lineItemErrorId}${line}`)
        .querySelector('.js-cart-items-error-text')
        .innerHTML = errorText;

      alert(errorText);
    }
    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById(this.dataset.liveRegionTextId);
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return html.querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    document.getElementById(this.dataset.mainCartItemsId).classList.add('disabled');
    this.querySelectorAll(`#${this.dataset.cartItemId}${line} .loading-overlay`).forEach((overlay) => overlay.classList.remove('hidden'));
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    document.getElementById(this.dataset.mainCartItemsId).classList.remove('disabled');
  }
}

customElements.define('cart-items', CartItems);
