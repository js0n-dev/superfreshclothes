class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    }
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer){
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl) ?
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
        FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {

    document.getElementById('ProductGridContainer').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').innerHTML;

    const priceSlider = document.querySelector('price-slider');

    if(priceSlider) {
      priceSlider.updateOutputsPositions();
    }
    window.dispatchEvent(new CustomEvent('updateStickySidebar'));
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter');
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-sidebar'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    const mobileForm = document.getElementById('FacetFiltersFormMobile')

    if(mobileForm) {
      mobileForm.closest('menu-drawer').bindEvents();
    }
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector('.sidebar-facets__selected');
    const sourceElement = source.querySelector('.sidebar-facets__selected');

    if (sourceElement && targetElement) {
      target.querySelector('.sidebar-facets__selected').outerHTML = source.querySelector('.sidebar-facets__selected').outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      }
    ]
  }

  onSubmitHandler(event) {
    if(event.target.classList.contains('js-facets-ignore-checkbox')) {
      return;
    }

    event.preventDefault();
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.priceSlider = document.querySelector('price-slider');
    this.querySelectorAll('input')
      .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));
    let wasAdjusted = false;

    if (value < min) {
      input.value = min;
      wasAdjusted = true;
    }
    if (value > max) {
      input.value = max;
      wasAdjusted = true;
    }
    if(wasAdjusted && this.priceSlider) {
      this.priceSlider.onFormInput();
    }
  }
}

customElements.define('price-range', PriceRange);

class PriceSlider extends HTMLElement {
  constructor() {
    super();
    this.enableSteps = false;
    this.form = this.closest('facet-filters-form');
    this.formAction = this.form.querySelector('form');
    this.priceRange = this.form.querySelector('price-range');
    this.inputs = this.priceRange.querySelectorAll('input');
    this.fromInput = this.inputs[0];
    this.toInput = this.inputs[1];
    this.wrapper = this.querySelector('.price-slider__wrapper');
    this.min = this.querySelector('.price-slider__min');
    this.max = this.querySelector('.price-slider__max');
    this.bar = this.querySelector('.price-slider__bar');
    this.barOutput = this.querySelector('.price-slider__bar-output');
    this.sideBarOutput = this.querySelector('.price-slider__side-bar-output');
    this.fromSideOutput = this.querySelector('.price-slider__side-from-output');
    this.toSideOutput = this.querySelector('.price-slider__side-to-output');
    this.fromButton = this.querySelector('.price-slider__button-from');
    this.fromButtonOutput = this.querySelector('.price-slider__button-from-output');
    this.toButton = this.querySelector('.price-slider__button-to');
    this.toButtonOutput = this.querySelector('.price-slider__button-to-output');
    this.hideCoins = this.priceRange.dataset.hideCoins === 'true';
    this.usesCommaDecimals = this.priceRange.dataset.usesCommaDecimals === 'true';
    this.step = Number(this.priceRange.dataset.step);

    this.saveStartValues();
    this.saveStartPercents();
    this.calculateStepValues();
    this.onResize();
    window.addEventListener('MutationObserver', this.onResize.bind(this));
    window.addEventListener('updatePriceSlider', this.onResize.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
    this.classList.add('price-slider--initialized');
    [this.fromButton, this.toButton].forEach(element => element.addEventListener('mousedown', this.onButtonMousedown.bind(this, element)));
    document.body.addEventListener('mouseup', this.onBodyMouseup.bind(this));
    document.body.addEventListener('mousemove', this.onBodyMousemove.bind(this));
    this.formAction.addEventListener('input', this.onFormInput.bind(this));
  }

  onResize() {
    this.calculateSizes();
    this.updateOutputsPositions();
  }

  onButtonMousedown(element, event) {
    event.preventDefault();
    event.stopPropagation();

    if(this.wrapperWidth === 0) this.onResize();
    
    this.wasChanged = false;

    this.changeStatus(true, element);
    this.saveStartButtonEventData(event);
  }

  onBodyMouseup() {
    if(!this.isDragged) return;
    if(this.wasChanged) {
      this.disableOnFormInput = true;

      this.disableSlider();
      this.saveDraggedButtonPercent();
      this.triggerOnInputEvents();
    }
    
    this.changeStatus(false);
  }

  onBodyMousemove(event) {
    if(!this.isDragged) return;

    const resultDraggedPercent = this.calculateDraggedButtonPosition(event);

    if(this.lastUpdatedDraggedPercent === resultDraggedPercent) return;

    this.lastUpdatedDraggedPercent = resultDraggedPercent;
    this.wasChanged = true;
    
    this.updateDraggedButton();
    this.updateBarPosition();
    this.calculateValuesFromPercents();
    this.formatValuesToMoney();
    this.updateOutputs();
    this.updateOutputsPositions();
    this.formatMoneyToInputValues();
    this.updateInputs();
  }

  onFormInput() {
    if(this.disableOnFormInput) {
      this.disableOnFormInput = false;
      return;
    }

    this.saveStartValues();
    this.calculateStepValues();
    this.calculatePercentsFromValues();
    this.checkPercentLimits();
    this.updateButtons();
    this.updateBarPosition();
    this.formatValuesToMoney();
    this.updateOutputs();
    this.updateOutputsPositions();
  }

  disableSlider() {
    this.classList.add('price-slider--disable');
  }

  saveStartValues() {
    this.minValue = this.fromInput.getAttribute('min') * 100;
    this.maxValue = this.toInput.getAttribute('max') * 100;

    const fromValue = this.fromInput.value;
    const toValue = this.toInput.value;

    this.fromValue =  fromValue ? fromValue * 100 : this.minValue;
    this.toValue = toValue ? toValue * 100 : this.maxValue;
    this.valuePerOnePercent = this.maxValue / 100;
  }

  saveStartPercents() {
    this.fromPercent = this.fromButton.style.left ? Number(this.fromButton.style.left.replace('%', '')) : 0;
    this.toPercent = this.toButton.style.left ? Number(this.toButton.style.left.replace('%', '')) : 100;
  }

  checkPercentLimits() {
    this.fromPercent = this.checkFromToPercent(this.checkMinMaxPercent(this.fromPercent), 'from');
    this.toPercent = this.checkFromToPercent(this.checkMinMaxPercent(this.toPercent), 'to');
  }

  calculateStepValues() {
    this.percentSteps = [];

    const difference = this.maxValue - this.minValue;
    const stepsAmount = Math.ceil(difference / this.step);

    for(let i = 0; i < stepsAmount; i++) {
      const stepValue = this.step * i;
      const stepPercent = stepValue / (difference / 100);

      this.percentSteps.push(stepPercent);
    }

    if(this.percentSteps[stepsAmount - 1] !== 100) this.percentSteps.push(100);
  }

  getNamespace() {
    return this.draggedButton === this.fromButton ? 'from' : 'to';
  }

  calculateSizes() {
    this.wrapperWidth = this.wrapper.clientWidth;
  }

  changeStatus(isDragged, element) {
    if(isDragged) {
      this.classList.add('price-slider--is-dragged');
      element.classList.add('price-slider__button--is-dragged');
      this.draggedButton = element;
      this.namespace = this.getNamespace();
    } else {
      this.classList.remove('price-slider--is-dragged');
      [this.fromButton, this.toButton].forEach(element => element.classList.remove('price-slider__button--is-dragged'));
      this.draggedButton = null;
      this.namespace = null;
      this.draggedPercent = null;
    }
    
    this.isDragged = isDragged;
  }

  saveStartButtonEventData(event) {
    this.startClientX = event.clientX;
  }

  saveDraggedButtonPercent() {
    this[`${this.getNamespace()}Percent`] = this.draggedPercent;
  }

  getNamespacePercent(namespace) {
    return this.namespace === namespace ? this.draggedPercent : this[`${namespace}Percent`];
  }

  checkPercentSteps(percent) {
    let resultPercentStepIndex;
    
    this.percentSteps.forEach((stepPercent, index) => {
      if(percent === stepPercent) {
        resultPercentStepIndex = index;
        return false;
      } else if(percent > stepPercent) {
        if(this.percentSteps[index + 1]) {
          if(percent < this.percentSteps[index + 1]) {
            resultPercentStepIndex = index;
            return false;
          }
        } else {
          resultPercentStepIndex = stepPercent;
          return false;
        }
      }
    });

    return this.percentSteps[resultPercentStepIndex];
  }

  checkMinMaxPercent(percent) {
    return Math.min(Math.max(percent, 0), 100);
  }

  checkFromToPercent(percent, namespace = this.namespace) {
    return namespace === 'from' ? Math.min(percent, this.toPercent) : Math.max(percent, this.fromPercent);
  }

  calculateDraggedButtonPosition(event) {
    const difference = event.clientX - this.startClientX;
    const differencePercent = difference / (this.wrapperWidth / 100);
    const draggedStartPercent = this[`${this.namespace}Percent`];
    const resultDraggedPercent = this.checkFromToPercent(this.checkPercentSteps(this.checkMinMaxPercent(draggedStartPercent + differencePercent)));
    this.draggedPercent = resultDraggedPercent;
    return resultDraggedPercent;
  }

  updateDraggedButton() {
    this.draggedButton.style.left = `${this.draggedPercent}%`;
  }

  updateButtons() {
    this.fromButton.style.left = `${this.fromPercent}%`;
    this.toButton.style.left = `${this.toPercent}%`;
  }

  updateBarPosition() {
    const startPercent = this.getNamespacePercent('from');
    const widthPercent = this.getNamespacePercent('to') - startPercent;

    this.bar.style.left = `${startPercent}%`;
    this.bar.style.width = `${widthPercent}%`;
  }

  calculateValuesFromPercents() {
    this.fromValue = this.valuePerOnePercent * this.getNamespacePercent('from');
    this.toValue = this.valuePerOnePercent * this.getNamespacePercent('to');
  }

  calculatePercentsFromValues() {
    this.fromPercent = this.fromValue / this.valuePerOnePercent;
    this.toPercent = this.toValue / this.valuePerOnePercent;
  }
  
  formatValuesToMoney() {
    const moneyFormat = !this.hideCoins ? Shopify.money_format : Shopify.money_format.replace(/\{\{\s*(\w+)\s*\}\}/, '{{amount_no_decimals}}');

    this.fromFormatedMoney = Shopify.formatMoney(this.fromValue, moneyFormat);
    this.toFormatedMoney = Shopify.formatMoney(this.toValue, moneyFormat);
  }

  formatMoneyToInputValues() {
    this.fromInputValue = (this.fromValue/100).toFixed(2);
    this.toInputValue = (this.toValue/100).toFixed(2);

    if(this.usesCommaDecimals) {
      this.fromInputValue = this.fromInputValue.replace('.', '').replace(',', '.');
      this.toInputValue = this.toInputValue.replace('.', '').replace(',', '.');
    } else {
      this.fromInputValue = this.fromInputValue.replace(',', '');
      this.toInputValue = this.toInputValue.replace(',', '');
    }
    if(Shopify.money_format.indexOf('amount_no_decimals') !== -1) {
      this.fromInputValue = Number(this.fromInputValue).toFixed(0);
      this.toInputValue = Number(this.toInputValue).toFixed(0);
    }
  }

  updateOutputs() {
    const fromFormatedMoney = this.fromFormatedMoney;
    const toFormatedMoney = this.toFormatedMoney;
    const barOutput = fromFormatedMoney === toFormatedMoney ? fromFormatedMoney : `${fromFormatedMoney} — ${toFormatedMoney}`;

    this.fromSideOutput.innerHTML = fromFormatedMoney;
    this.toSideOutput.innerHTML = toFormatedMoney;
    this.fromButtonOutput.innerHTML = fromFormatedMoney;
    this.toButtonOutput.innerHTML = toFormatedMoney;
    this.barOutput.innerHTML = barOutput;
    this.sideBarOutput.innerHTML = barOutput;
  }

  updateOutputsPositions() {
    if(this.wrapperWidth === 0) return;
    
    const wrapperBounds = this.wrapper.getBoundingClientRect();
    const barBounds = this.bar.getBoundingClientRect();
    const barOutputBounds = this.barOutput.getBoundingClientRect();
    const minBounds = this.min.getBoundingClientRect();
    const maxBounds = this.max.getBoundingClientRect();
    const fromSideOutputBounds = this.fromSideOutput.getBoundingClientRect();
    const toSideOutputBounds = this.toSideOutput.getBoundingClientRect();
    const fromButtonBounds = this.fromButton.getBoundingClientRect();
    const fromButtonOutputBounds = this.fromButtonOutput.getBoundingClientRect();
    const toButtonBounds = this.toButton.getBoundingClientRect();
    const toButtonOutputBounds = this.toButtonOutput.getBoundingClientRect();
    let visibleBarOutput = false;
    
    if(fromSideOutputBounds.right >= toSideOutputBounds.left || fromButtonOutputBounds.right >= toButtonOutputBounds.left || fromSideOutputBounds.right >= toButtonOutputBounds.left || fromButtonOutputBounds.right >= toSideOutputBounds.left) {
      this.classList.add('price-slider--visible-bar-output');
      visibleBarOutput = true;
    } else {
      this.classList.remove('price-slider--visible-bar-output');
    }
    if(visibleBarOutput && barBounds.left + barBounds.width / 2 - barOutputBounds.width / 2 < wrapperBounds.left) {
      this.classList.add('price-slider--bar-output-fixed-left');
    } else if(visibleBarOutput && barBounds.left + barBounds.width / 2 + barOutputBounds.width / 2 > wrapperBounds.right) {
      this.classList.add('price-slider--bar-output-fixed-right');
    } else {
      this.classList.remove('price-slider--bar-output-fixed-left', 'price-slider--bar-output-fixed-right');
    }
    if(fromButtonOutputBounds.left > minBounds.right && (!visibleBarOutput || barOutputBounds.left > minBounds.right)) {
      this.classList.add('price-slider--visible-min');
    } else {
      this.classList.remove('price-slider--visible-min');
    }
    if(toButtonOutputBounds.right < maxBounds.left && (!visibleBarOutput || barOutputBounds.right < maxBounds.left)) {
      this.classList.add('price-slider--visible-max');
    } else {
      this.classList.remove('price-slider--visible-max');
    }
    if(fromButtonBounds.left > fromSideOutputBounds.left + fromSideOutputBounds.width / 2) {
      this.classList.add('price-slider--visible-button-from-output');
    } else {
      this.classList.remove('price-slider--visible-button-from-output');
    }
    if(toButtonBounds.right < toSideOutputBounds.right - toSideOutputBounds.width / 2) {
      this.classList.add('price-slider--visible-button-to-output');
    } else {
      this.classList.remove('price-slider--visible-button-to-output');
    }
  }

  updateInputs() {
    this.fromInput.value = this.fromValue !== this.minValue ? this.fromInputValue : '';
    this.toInput.value = this.toValue !== this.maxValue ? this.toInputValue : '';
  }

  triggerOnInputEvents() {
    this.formAction.dispatchEvent(new Event('input'));
  }
}

customElements.define('price-slider', PriceSlider);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
      form.onActiveFilterClick(event);
    });
  }
}

customElements.define('facet-remove', FacetRemove);

class FacetSortingCloneForm extends HTMLElement {
  constructor() {
    super();

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
  }

  onSubmitHandler(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target.closest('form'));
    const form = document.querySelectorAll('facet-filters-form');
    const sortByCloneValue = formData.get('sort_by_clone');

    form.forEach(element => element.querySelector('[name="sort_by"]').value = sortByCloneValue);
    form[0].querySelector('form').dispatchEvent(new Event('input'));
  }
}

customElements.define('facet-sorting-clone-form', FacetSortingCloneForm);