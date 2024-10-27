if (!customElements.get('age-popup-modal')) {
    customElements.define(
      'age-popup-modal',
        class AgePopupModal extends ModalDialog {
            constructor() {
                super();
                this.modalContent = this.querySelector('[id^="AgePopupInfo-"]');
                this.timer = 24 * 60 * 60 * 1000 * 365;
                this.onLoad();
            }
    
            hide() {
                this.addCookie();
                super.hide();
                document.body.classList.remove('age-popup-opened');
            }
    
            show() {
                document.body.classList.add('age-popup-opened');
                super.show();
            }

            addCookie() {
                const date = new Date();

                date.setTime(date.getTime() + this.timer);
                themeCookie.set('age-confirmation', 'off', {
                    expires: date
                });
            };

            onLoad() {
                if (themeCookie.get('age-confirmation') === 'off') return;

                this.show();
            }
        }
    );
}
  