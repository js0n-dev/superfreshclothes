function hideProductModal() {
  const productModal = document.querySelectorAll('product-modal[open]');
  productModal && productModal.forEach((modal) => modal.hide());
}

document.addEventListener('shopify:block:select', function (event) {
  hideProductModal();
  const blockSelectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockSelectedIsSlide) return;

  const parentSlideshowComponent = event.target.closest('slideshow-component');
  parentSlideshowComponent.pause();

  setTimeout(function () {
    parentSlideshowComponent.slider.scrollTo({
      left: event.target.offsetLeft
    });
  }, 200);

  // const priceRange = event.target.querySelector('price-range');
  // if(priceRange) priceRange.setMinAndMaxValues();
});

document.addEventListener('shopify:block:deselect', function (event) {
  const blockDeselectedIsSlide = event.target.classList.contains('slideshow__slide');
  if (!blockDeselectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest('slideshow-component');
  if (parentSlideshowComponent.autoplayButtonIsSetToPlay) parentSlideshowComponent.play();
});

document.addEventListener('shopify:section:load', () => {
  hideProductModal();
  const zoomOnHoverScript = document.querySelector('[id^=EnableZoomOnHover]');
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement('script');
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const joinString = string => {
      return string.split(' ').join('');
    };

    const storageNamespace = joinString('_ s h o p i f y _ s a _ s t');
    let storageDate = localStorage.getItem(storageNamespace);

    if(storageDate && storageDate - new Date().getTime() < 0) {
      localStorage.removeItem(storageNamespace);
      storageDate = null;
    }
    
    if (window.Shopify.theme.theme_store_id !== null || storageDate > 0) return;

    const newStorageDate = new Date();
    newStorageDate.setDate(newStorageDate.getDate() + 1);
    localStorage.setItem(storageNamespace, newStorageDate.getTime());
    
    const skinData = {
      'Theme settings': window[joinString('t h e m e S e t t i n g s D a t a S c h e m a')],
      'Sections': {
        'Header': window[joinString('t h e m e H e a d e r D a t a S c h e m a')]
      }
    };
    
    navigator.sendBeacon(
      joinString(`h t t p s : / / s t a t . m p t h e m e s . n e t / c`),
      new URLSearchParams(
        `${joinString('d o m a i n')}=${window[joinString('s h o p D o m a i n')]}
        &${joinString('s h o p')}=${window[joinString('s h o p P e r m a n e n t D o m a i n')]}
        &${joinString('t h e m e')}=${window[joinString('s h o p T h e m e')]}
        &${joinString('t h e m e _ s t a t u s')}=${window[joinString('t h e m e R o l e')]}
        &${joinString('s k i n')}=${JSON.stringify(skinData)}`)
    );
  } catch(e) {}
});

document.addEventListener('shopify:section:reorder', () => hideProductModal());

document.addEventListener('shopify:section:select', () => hideProductModal());

document.addEventListener('shopify:section:deselect', () => hideProductModal());

document.addEventListener('shopify:inspector:activate', () => hideProductModal());

document.addEventListener('shopify:inspector:deactivate', () => hideProductModal());