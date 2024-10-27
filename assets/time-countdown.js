if (!customElements.get('time-countdown')) {
    class TimeCountdown extends HTMLElement {
        constructor() {
            super();
            this.timer = this.querySelector('.time-countdown__timer');
            this.timerPrefix = this.querySelector('.time-countdown__timer-prefix');
            
            setTimeout(() => {
                this.finalDate = new Date(this.dataset.date);

                this.start();
            }, 0);
        }

        start() {
            if(!this.checkOverdueDate()) {
                (this.timerPrefix ? this.timer : this).classList.add('hidden');
                return;
            }

            this.display();
            this.inrerval = setInterval(() => this.display(), 1000);
        }

        display() {
            this.render(this.getRemainingTime());
        }

        checkOverdueDate() {
            if(this.getTotal() < 0) {
                if(window.Shopify.designMode) {
                    const now = new Date();

                    now.setDate(Math.max(now.getDate() + 3, this.finalDate.getDate()));
                    now.setHours(this.finalDate.getHours());
                    now.setMinutes(this.finalDate.getMinutes() + 20);
                    now.setSeconds(this.finalDate.getSeconds() - 1);
                    this.finalDate = now;
                    return true;
                } else {
                    if(this.inrerval) clearInterval(this.inrerval);
                    return false;
                }
            } else {
                return true;
            }
        }

        getTotal() {
            return Date.parse(this.finalDate) - Date.parse(new Date());
        }

        getRemainingTime() {
            if(!this.checkOverdueDate()) {
                return false;
            }

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

            let html = '';

            html += this.buildSectionHTML(time.days, window.variantStrings.countdown.days);
            html += this.buildSectionHTML(time.hours, window.variantStrings.countdown.hours, time.days, true, !!time.days);
            html += this.buildSectionHTML(time.minutes, window.variantStrings.countdown.minutes, time.hours, true, true);
            html += this.buildSectionHTML(time.seconds, window.variantStrings.countdown.seconds, time.minutes, true, true);

            this.timer.innerHTML = html;
        }

        buildSectionHTML(time, postfix, showZero, addZeroToSingle) {
            if(!time && !showZero) return '';

            let timeToString = time.toString();

            if(!time && showZero) timeToString = '0';
            if(addZeroToSingle === true && time < 10) timeToString = `0${timeToString}`;

            return `<span class="time-countdown__section">
                    <span class="time-countdown__time">${timeToString}</span>
                    <span class="time-countdown__postfix">${postfix}</span>
                    </span>
                    <span class="time-countdown__break">&nbsp;:&nbsp;</span>`;
        }

        disconnectedCallback() {
            if(this.inrerval) clearInterval(this.inrerval);
        }
    }

    customElements.define('time-countdown', TimeCountdown);
}