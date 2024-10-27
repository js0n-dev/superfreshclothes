if (!customElements.get('recently-viewed')) {
    class RecentlyViewed extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            this.recentlyViewedProducts = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

            const handleIntersection = (entries, observer) => {
              if (!entries[0].isIntersecting) return;
              observer.unobserve(this);
        
              fetch(`/collections/all?view=recently-viewed&handles=${this.recentlyViewedProducts.join('+')}&products_to_show=${this.dataset.productsToShow}&sections=${this.dataset.sectionId}`)
                .then((response) => response.json())
                .then((text) => {
                    const html = document.createElement('div');

                    html.innerHTML = text[this.dataset.sectionId];

                    const recentlyViewed = html.querySelector('recently-viewed');

                    this.innerHTML = recentlyViewed.innerHTML;
                    this.classList.add('recently-viewed--loaded');
                    this.querySelectorAll('slider-component').forEach(slider => slider.resetPages());
                })
                .catch((e) => {
                  console.error(e);
                });
            };
        
            new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 400px 0px' }).observe(this);
        }
    }
    
    customElements.define('recently-viewed', RecentlyViewed);
}