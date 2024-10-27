if(!window.hasAnimatedDropdown) {
    (function() {
        class AnimatedDropdown extends HTMLElement {
            constructor() {
                super();
                this.duration = 250;
            }
        
            open(event, settings = {}) {
                const { stepCallback, completeCallback } = settings;
        
                helpers.addEventInfo(event, 'AnimatedDropdownOpen');
                animation.stop(this.dropdown);
        
                if(this.details) this.details.setAttribute('open', true);
        
                animation.slideDown(
                    this.dropdown, {
                        duration: this.duration,
                        step: stepCallback,
                        complete: () => {
                            this.dropdown.removeAttribute('style');
        
                            if(completeCallback) completeCallback();
                        },
                        event: event
                    }
                );
                this.classList.add('animated-dropdown--visible');
                setTimeout(() => this.classList.add('animated-dropdown--active'));
            }
        
            close(event, settings = {}) {
                const { stepCallback, completeCallback } = settings;
        
                helpers.addEventInfo(event, 'AnimatedDropdownClose');
                animation.stop(this.dropdown);
                animation.slideUp(
                    this.dropdown,
                    {
                        duration: this.duration,
                        step: stepCallback,
                        complete: () => {
                            this.classList.remove('animated-dropdown--visible');
        
                            if(completeCallback) completeCallback();
                        },
                        event: event
                    }
                );
                this.classList.remove('animated-dropdown--active');
            }
        
            closeWithoutAnimation() {
                animation.stop(this.dropdown);
                this.dropdown.removeAttribute('style');
                this.classList.remove('animated-dropdown--visible', 'animated-dropdown--active');
            }
        }
        
        class AccordionButton extends AnimatedDropdown {
            constructor() {
                super();
                this.clickEvent = this.clickEvent.bind(this);
                this.initialize();
                this.observer = new MutationObserver(event => {
                    this.disconnectedCallback();
                    this.initialize();
                });
                this.observer.observe(this, { childList: true, subtree: true });
            }
        
            initialize() {
                this.details = this.getElementsByTagName('details')[0];
                this.button = this.querySelector('.animated-dropdown__button');
                this.dropdown = this.querySelector('.animated-dropdown__dropdown');
        
                if(this.details) this.details.setAttribute('open', true);
                
                this.button.addEventListener('click', this.clickEvent);
            }
        
            disconnectedCallback() {
                this.removeEventListener('click', this.clickEvent);
            }
        
            clickEvent(event) {
                event.preventDefault();
        
                if(this.classList.contains('animated-dropdown--visible') && !animation.hasEventInfo(this.dropdown, 'accordionClose')) {
                    helpers.addEventInfo(event, 'accordionClose');
                    this.close(event);
                } else if(!this.classList.contains('animated-dropdown--visible') && !animation.hasEventInfo(this.dropdown, 'accordionOpen')) {
                    helpers.addEventInfo(event, 'accordionOpen');
                    this.open(event);
                }
            }

            triggerAnimationStepEvents() {
                window.dispatchEvent(new CustomEvent('updateStickySidebar'));
                window.dispatchEvent(new CustomEvent('updateFixedFooter'));
                window.dispatchEvent(new CustomEvent('updatePriceSlider'));
            }
        
            open(event) {
                super.open(event, {
                    stepCallback: this.triggerAnimationStepEvents.bind(this),
                    completeCallback: () => {
                        this.dispatchEvent(new CustomEvent('opened'));
                    }
                });

                this.button.classList.add('animated-dropdown__button--open');
            }
        
            close(event) {
                this.button.classList.remove('animated-dropdown__button--open');
        
                super.close(event, {
                    stepCallback: this.triggerAnimationStepEvents.bind(this),
                    completeCallback: this.triggerAnimationStepEvents.bind(this)
                });
            }
        }
        
        customElements.define('accordion-button', AccordionButton);
        
        class ThemeSelect extends AnimatedDropdown {
            constructor() {
                super();
                this.dropdown = this.getElementsByTagName('ul')[0];
                this.liOptions = this.dropdown.querySelectorAll('li');
                this.select = this.getElementsByTagName('select')[0];
                this.options = this.getElementsByTagName('option');
                this.form = this.select.closest('form');
        
                this.mousedownEvent = event => themeBase.viewportFunction(true, this.onMousedown.bind(this, event));
                this.mouseenterEvent = event => themeBase.viewportFunction(true, this.onMouseenter.bind(this, event));
                this.mouseleaveEvent = event => themeBase.viewportFunction(true, this.onMouseleave.bind(this, event));
        
                this.addEventListener('mousedown', this.mousedownEvent);
                this.addEventListener('mouseenter', this.mouseenterEvent);
                this.addEventListener('mouseleave', this.mouseleaveEvent);
                [...this.liOptions].forEach(element => {
                    element.addEventListener('click', event => themeBase.viewportFunction(true, this.onliOptionsClick.bind(this, event, element)));
                });
            }
        
            disconnectedCallback() {
                this.removeEventListener('mousedown', this.mousedownEvent);
                this.removeEventListener('mouseenter', this.mouseenterEvent);
                this.removeEventListener('mouseleave', this.mouseleaveEvent);
            }
        
            onMousedown(event) {
                event.preventDefault();
            }
        
            onMouseenter(event) {
                if(this.classList.contains('animated-dropdown--active')) {
                    return;
                }
        
                this.open(event);
            }
        
            onMouseleave(event) {
                if(!this.classList.contains('animated-dropdown--visible') || animation.hasEventInfo(this.dropdown, 'AccordionButtonClose')) {
                    return;
                }
        
                this.close(event);
            }
        
            onliOptionsClick(event, element) {
                [...this.liOptions].forEach(el => {
                    const isSelected = el === element;
        
                    el.classList[isSelected ? 'add' : 'remove']('selected');
                });
                this.changeOption(element.dataset.value);
            }
        
            changeOption(value) {
                [...this.options].forEach(option => {
                    option.value === value ? option.setAttribute('selected', 'selected') : 
                                             option.removeAttribute('selected', 'selected');
                });
                this.select.value = value;
                this.closeWithoutAnimation();
                this.select.dispatchEvent(new Event('change'));
        
                if(this.form) this.form.dispatchEvent(new Event('input'));
            }
        }
        
        customElements.define('theme-select', ThemeSelect);
    })();

    window.hasAnimatedDropdown = true;
}