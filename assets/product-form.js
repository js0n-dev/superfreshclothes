if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');

      if (this.form) {
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      }
      
      this.cartNotification = document.querySelector('cart-notification');
      this.productInfo = this.closest('product-info');
      this.recipientFields = this.productInfo ? this.productInfo.querySelector('.js-personalized-fields') : null;
      this.recipientFieldsInputs = this.recipientFields ? this.recipientFields.querySelectorAll('input, textarea') : null;

      this.hideErrors = this.dataset.hideErrors === 'true';
    }

    onSubmitHandler(evt, disableCartNotification, callback) {
      evt.preventDefault();
      this.clearPersonalizedFieldsErrors();

      const personalizedFieldsErrors = this.validatePersonalizedFields();

      if(personalizedFieldsErrors.length) {
        this.handleErrorMessage(personalizedFieldsErrors.join(', '));
        return;
      }

      evt.target.focus();
      const submitButton = this.querySelector('[type="submit"]');
      if (submitButton && submitButton.classList.contains('loading')) return;

      this.handleErrorMessage();
      if (!disableCartNotification) {
        this.cartNotification.setActiveElement(document.activeElement);
      }
      if (submitButton) {
        submitButton.setAttribute('aria-disabled', true);
        submitButton.classList.add('loading');
        this.querySelector('.loading-overlay__spinner').classList.remove('hidden');
      }
      
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);

      if (!disableCartNotification) {
        formData.append('sections', this.cartNotification.getSectionsToRender().map((section) => section.id));
      }

      formData.append('sections_url', window.location.pathname);
      config.body = formData;
      
      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          
          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.errors || response.description,
              message: response.message,
            });
            this.handleErrorMessage(response.description);
            this.error = true;
            alert(response.description);
            return;
          }

          if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form', productVariantId: formData.get('id') });
          this.error = false;
          
          // this.cartNotification.renderContents(response, window.addToCartAction === 'notification');
          
          const cartIconBubble = document.getElementById('cart-icon-bubble');

          if(window.addToCartAction === 'mini_cart' && cartIconBubble && window.enableMiniCart) {
            cartIconBubble.dispatchEvent(new Event('triggetClick'));
          }
          
          if (!disableCartNotification) {
            const quickAddModal = this.closest('quick-add-modal');

            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cartNotification.renderContents(response, window.addToCartAction === 'notification');
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cartNotification.renderContents(response, window.addToCartAction === 'notification');
            }
          }
          
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          if (submitButton) {
            submitButton.classList.remove('loading');
            submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          }

          if (callback) callback();
        });

        return false;
    }

    clearPersonalizedFieldsErrors() {
      if (!this.recipientFieldsInputs) return;

      this.recipientFieldsInputs.forEach(element => {
        element.classList.remove('error');
      });
    }

    validatePersonalizedFields() {
      const errors = [];
      
      if (this.recipientFieldsInputs) {
        this.recipientFieldsInputs.forEach(element => {
          if (element.hasAttribute('required') && element.value.trim() === '') {
            element.classList.add('error');
            if (errors.indexOf(window.cartStrings.emptyFieldError) == -1) {
              errors.push(window.cartStrings.emptyFieldError);
            }
          }
          
          if (element.getAttribute('maxlength') && element.value.length > parseInt(element.getAttribute('maxlength'))) {
            element.classList.add('error');
            if (errors.indexOf(window.cartStrings.maxLengthError) == -1) {
              errors.push(window.cartStrings.maxLengthError.replace(
                '{{ value }}',
                element.getAttribute('maxlength')));
            }
          }
        });
      }

      return errors;
      
      // Убираем класс .error при изменении содержимого полей ввода
      // form.addEventListener('input', function(event) {
      //   if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      //     event.target.classList.remove('error');
      //   }
      // });
    }

    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;

      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.js-product-form-error-message-wrapper');
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.js-product-form-error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}

if (!customElements.get('product-forms')) {
  customElements.define('product-forms', class ProductForms extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.buttons = this.querySelectorAll('.product-forms__button');
      this.products = this.querySelectorAll('.product-forms__products product-form');

      this.onButtonClickHandler = this.onButtonClick.bind(this);
      
      this.buttons.forEach(button => button.addEventListener('click', this.onButtonClickHandler));
    }

    disconnectedCallback() {
      this.buttons.forEach(button => button.removeEventListener('click', this.onButtonClickHandler));
    }

    addLoadingButton() {
      this.buttons.forEach(button => {
        button.setAttribute('aria-disabled', true);
        button.classList.add('loading');
      });
    }

    removeLoadingButton() {
      this.buttons.forEach(button => {
        button.classList.remove('loading');
        button.removeAttribute('aria-disabled');
      });
    }

    onButtonClick(event) {
      event.preventDefault();

      log(this.products)

      const addToCartRecursion = (index) => {
        log(index, this.products[index])
        if (!this.products[index]) return;

        if (index === 0) {
          this.addLoadingButton();
        }

        this.products[index].onSubmitHandler(event, index < this.products.length - 1, () => {
          index < this.products.length - 1 ? addToCartRecursion(index + 1) : this.removeLoadingButton();
        });
      };

      addToCartRecursion(0);
    }
  });
}
