if (!customElements.get('delivery-countdown')) {
    class DeliveryCountdown extends HTMLElement {
        constructor() {
            super();

            this.daysOfWeek = [
                window.variantStrings.deliveryCountdown.daysOfWeek.sunday,
                window.variantStrings.deliveryCountdown.daysOfWeek.monday,
                window.variantStrings.deliveryCountdown.daysOfWeek.tuesday,
                window.variantStrings.deliveryCountdown.daysOfWeek.wednesday,
                window.variantStrings.deliveryCountdown.daysOfWeek.thursday,
                window.variantStrings.deliveryCountdown.daysOfWeek.friday,
                window.variantStrings.deliveryCountdown.daysOfWeek.saturday
            ];

            setTimeout(() => {
                this.elementCounter = this.querySelector('[data-js-delivery-countdown-counter]');
                this.elementDelivery = this.querySelector('[data-js-delivery-countdown-delivery]');

                this.deliveryTime = +this.dataset.deliveryTime;
                this.resetTime = +this.dataset.resetTime;
                this.deliveryFormat = this.dataset.deliveryFormat;
                this.excludes = this.dataset.deliveryExcludes.replace(/ /gi, '').toLowerCase().split(',');

                this.start();
            }, 0);
        }

        start() {
            this.display();
            this.interval = setInterval(() => this.display(), 1000);
        }

        display() {
            this.render(this.getRemainingTime());
        }

        getTotal() {
            return Date.parse(this.finalDate) - Date.parse(new Date());
        }

        getRemainingTime() {
            const now = new Date();

            this.finalDate = new Date();
            this.finalDate.setDate(this.finalDate.getDate() + 1);
            this.finalDate.setHours(this.resetTime, 0, 0, 0);

            const counterTotal = this.getTotal();
            const counterMinutes = Math.floor((counterTotal / 1000 / 60) % 60);
            const counterHours = Math.floor((counterTotal / (1000 * 60 * 60)) % 24);

            let finalyDeliveryTime = this.deliveryTime;
            let startExcludesDate = 0;

            if (now.getHours() >= this.finalDate.getHours() && now.getMinutes() >= this.finalDate.getMinutes() && now.getSeconds() >= this.finalDate.getSeconds()) {
                finalyDeliveryTime++;
                startExcludesDate++;
            }
            
            const deliveryDate = now;
            
            let endExcludesDate = this.deliveryTime + startExcludesDate + 1;
            
            for (let i = startExcludesDate; i < endExcludesDate; i++) {
                let currentDate = new Date();

                currentDate.setDate(currentDate.getDate() + i);

                if (this.excludes.indexOf(this.daysOfWeek[currentDate.getDay()].toLowerCase()) !== -1) {
                    deliveryDate.setDate(deliveryDate.getDate() + 1);
                    endExcludesDate++;
                }
            }
            
            deliveryDate.setDate(deliveryDate.getDate() + finalyDeliveryTime);

            return {
                counter: {
                    hours: counterHours,
                    minutes: counterMinutes
                },
                delivery: deliveryDate
            };
        }

        render(data) {
            const {counter, delivery} = data;
            let counterHTML = '';

            if(counter.hours) {
                counterHTML += `${counter.hours} ${window.variantStrings.deliveryCountdown.hours.toLowerCase()} `;
            }

            counterHTML += `${counter.minutes} ${window.variantStrings.deliveryCountdown.minutes.toLowerCase()}`;
            this.elementCounter.innerHTML = counterHTML;
            this.elementDelivery.innerHTML = this.deliveryFormat.toLowerCase()
                .replace('day', this.daysOfWeek[delivery.getDay()])
                .replace('dd', ('0' + delivery.getDate()).slice(-2))
                .replace('mm', ('0' + (delivery.getMonth() + 1)).slice(-2))
                .replace('yyyy', delivery.getFullYear())
                .replace('yy', delivery.getFullYear().toString().slice(-2));
        }

        disconnectedCallback() {
            if(this.inrerval) clearInterval(this.inrerval);
        }
    }

    customElements.define('delivery-countdown', DeliveryCountdown);
}