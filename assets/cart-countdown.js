if (!customElements.get('cart-countdown')) {
    (function() {
        
    })();

    class CartCountdown extends HTMLElement {
        constructor() {
            super();
            this.timer = this.querySelector('.cart-countdown__timer');

            setTimeout(() => {
                this.start();
            }, 0);
        }

        getFinalDate() {
            const cookieDate = themeCookie.get('cart-countdown');
            const timeNow = new Date();
            
            if (cookieDate && Date.parse(cookieDate) - Date.parse(timeNow) > 0) {
                window.cartCountdownDate = new Date(cookieDate);
            } else {
                window.cartCountdownDate = new Date(timeNow.setMinutes(timeNow.getMinutes() + window.cartCountdownResetInterval));
    
                themeCookie.set('cart-countdown', window.cartCountdownDate, {
                    expires: 24 * 60 * 60 * 1000 * 365
                });
            }

            return window.cartCountdownDate;
        }

        start() {
            this.display();
            this.inrerval = setInterval(() => this.display(), 1000);
        }

        display() {
            this.finalDate = this.getFinalDate();
            this.render(this.getRemainingTime());
        }

        getTotal() {
            return Date.parse(this.finalDate) - Date.parse(new Date());
        }

        getRemainingTime() {
            const total = this.getTotal();
            const seconds = Math.floor((total / 1000) % 60);
            const minutes = Math.floor((total / 1000 / 60) % 60);
            const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
            const days = Math.floor(total / (1000 * 60 * 60 * 24));

            return {
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds
            };
        }

        render(time) {
            if(!time) {
                this.parentNode.classList.add('hidden');
                return;
            }

            let html = `${this.buildSectionHTML(time.minutes, null, true, true)}:${this.buildSectionHTML(time.seconds, null, true, true)}`;

            this.timer.innerHTML = html;
        }

        buildSectionHTML(time, postfix, showZero, addZeroToSingle) {
            if(!time && !showZero) return '';

            let timeToString = time.toString();

            if(!time && showZero) timeToString = '0';
            if(addZeroToSingle === true && time < 10) timeToString = `0${timeToString}`;

            return `${timeToString}`;
        }

        disconnectedCallback() {
            if(this.inrerval) clearInterval(this.inrerval);
        }
    }

    customElements.define('cart-countdown', CartCountdown);
}