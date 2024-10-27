if(!customElements.get('free-shipping')) {
    customElements.define(
        'free-shipping', 
        class FreeShipping extends HTMLElement {
            constructor() {
                super();
                
                this.completedClass = 'free-shipping--completed';
                this.info = this.querySelector('.free-shipping__info');
                this.progressBar = this.querySelector('.free-shipping__progress-bar');
                this.totalPrice = this.querySelector('.free-shipping__total-price');
            }

            connectedCallback() {
                this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.update.bind(this));
                this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.update.bind(this));
              }

            disconnectedCallback() {
                if (this.cartUpdateUnsubscriber) {
                  this.cartUpdateUnsubscriber();
                }
                if (this.quantityUpdateUnsubscriber) {
                    this.quantityUpdateUnsubscriber();
                }
            }

            update() {
                this.getCartData().then((cart) => {
                    this.changeState(cart.total_price);
                });
            }

            getCartData() {
                return fetch(`${routes.cart_url}`, {...fetchConfig()})
                    .then((response) => {
                        return response.text();
                    })
                    .then((state) => {
                        return JSON.parse(state);
                    }).catch(error => console.error(error));
            }

            changeState(totalPrice) {
                const leftToSpend = Math.max(window.freeShippingLimit - totalPrice, 0);
                
                this.info.innerHTML = leftToSpend > 0 ? window.cartStrings.freeShippingHTML.replace(
                        '{{ value }}', 
                        Shopify.formatMoney(leftToSpend)
                    ) 
                    : window.cartStrings.freeShippingCompleteHTML;
                this.progressBar.style.width = `${Math.min(totalPrice / (window.freeShippingLimit / 100), 100)}%`;
                this.totalPrice.innerHTML = Shopify.formatMoney(totalPrice);
                this.classList[leftToSpend > 0 ? 'remove' : 'add'](this.completedClass);
            }
        }
    );
}