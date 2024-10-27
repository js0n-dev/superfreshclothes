const ua = window.navigator.userAgent.toLowerCase();
window.html = document.getElementsByTagName('html')[0];
window.ie = (/trident/gi).test(ua) || (/msie/gi).test(ua);
window.edge = document.documentMode || /edge/.test(ua);
window.ios = navigator.userAgent.match(/like Mac OS X/i);
window.safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
window.moz = typeof InstallTrigger !== 'undefined';

const isTouchCapable = function() {
  return 'ontouchstart' in window ||
    (window.DocumentTouch && document instanceof window.DocumentTouch) ||
    navigator.maxTouchPoints > 0 ||
    window.navigator.msMaxTouchPoints > 0;
};

Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);
  
  function defaultOption(opt, def) {
     return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    case "amount_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 2, "'", ".");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

class Cookie {
  constructor() {}

  get(name) {
      let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
      ));
      return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  set(name, value, options = {}) {
      options = Object.assign(options, {
          path: '/'
      });
      
      if (options.expires instanceof Date) {
          options.expires = options.expires.toUTCString();
      }
      
      let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
      
      for (let optionKey in options) {
          updatedCookie += "; " + optionKey;
          let optionValue = options[optionKey];
          if (optionValue !== true) {
              updatedCookie += "=" + optionValue;
          }
      }
      
      document.cookie = updatedCookie;
  }

  delete(name) {
      this.set(name, "", {
          'max-age': -1
      });
  }
}

const themeCookie = new Cookie;

const timingFunctions = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};

class Helpers {
  constructor() {

  }

  findElement(elementsList, findElement) {
      return Array.from(elementsList).filter(element => element === findElement)[0];
  }

  findElementsByClass(elementsList, findClass) {
      return Array.from(elementsList).filter(element => element.classList.contains(findClass));
  }

  containsOrIs(element, findElement) {
      return element === findElement || element.contains(findElement);
  }

  addEventInfo(event, str) {
      return event.eventInfo = `${event.eventInfo ? event.eventInfo + ' ' : ''}${str}`;
  }

  getSingleOrObjectKey(element, key) {
      return key !== undefined ? element[key] : element;
  }

  setSingleOrObjectKey(value, key, inheritedObject) {
      if (key !== undefined) {
          const newInnerObject = {};
          newInnerObject[key] = value;

          return Object.assign({}, inheritedObject, newInnerObject);
      } else {
          return value;
      }
  }

  processSingleOrObject(element, processFunction) {
      if (typeof element === 'object') {
          const newObject = {};

          for (const key in element) {
              newObject[key] = processFunction(element[key], key);
          }

          return newObject;
      } else {
          return processFunction(element);
      }
  }
}

const helpers = new Helpers();

class Animation {
  constructor() {
      this.duration = 350;
      this.timing = 'easeInOutQuad';
      this.timingFunctions = timingFunctions;
      this.cashe = [];

      window.addEventListener('resize', this.clearCashe.bind(this));
  }

  animate(element, properties, settings = {}, callbacks = {}) {
      let start;
      const finalSettings = this.getFinalSettings(settings);
      const { duration, draw, timingFunction } = finalSettings;
      const initialValues = this.getCurrentPropertyValues(element, properties);
      const animate = time => {
          if (!start) start = time;

          const stepValues = this.getStepValues(start, time, duration, timingFunction);
          const drawValues = draw(element, properties, initialValues, stepValues.progress, settings);
          const statuses = ['step'];

          if (stepValues.timeFraction === 0) {
              element.animationStoped = false;
          }
          if (!element.animationStoped && stepValues.timeFraction < 1) {
              if (stepValues.timeFraction === 0) {
                  statuses.unshift('start');
                  this.setWillChange(element, properties, settings);
              }

              step();
          } else {
              statuses.push('complete');
              this.unsetWillChange(element, settings);
          }
          
          return Object.assign({ element, statuses }, stepValues, drawValues);
      };
      const step = () => {
          const onStepEnd = () => {
              this.callSettingsCallbacks(elementCurrentObject.stepData, callbacks, settings);
              
              if (elementCurrentObject.stepData.statuses.includes('complete') || elementCurrentObject.stepData.statuses.includes('stop')) {
                  element.animation = null;
              }
          };
          const elementCurrentObject = {
              settings: finalSettings,
              methods: {
                  stop: (doComplete) => {
                      if(!doComplete) element.animation.settings.disableCompleteCallbacks = true;

                      element.animationStoped = true;
                      cancelAnimationFrame(elementCurrentObject.requestId);
                      elementCurrentObject.stepData.statuses.push('stop');
                      onStepEnd(elementCurrentObject.stepData);
                  }
              }
          };

          elementCurrentObject.requestId = requestAnimationFrame(time => {
              elementCurrentObject.stepData = animate(time);
              element.animation = elementCurrentObject;

              onStepEnd();
          });
      };

      if (settings.initialValues) {
          initialValues = Object.assign(initialValues, settings.initialValues);
      }

      step();
  }

  draw(element, properties, initialValues, progress, settings) {
      const values = {};
      const valuesCSS = {};
      const setCSSProperty = (property, elem = element) => {
          if(property === 'scrollY' || property === 'scrollX') {
              this.setJSProperty(elem, property, valuesCSS[property]);
              return;
          }

          const valueCSS = property === 'transform' ? this.buildMatrixCSS(values[property], valuesCSS[property]) : valuesCSS[property];

          if (progress === 1 && values[property] === 0) {
              elem.style[property] = '';
              return;
          }

          this.setCSSProperty(elem, property, valueCSS);
      };

      for (const property in properties) {
          helpers.processSingleOrObject(properties[property], (propertyValue, key) => {
              propertyValue = propertyValue.toString();
              const finishValue = this.getCSSPropertyValue(propertyValue);
              const initialValue = helpers.getSingleOrObjectKey(initialValues[property], key);
              const newValue = this.getProgressValue(initialValue, finishValue, progress);
              const newValueCSS = this.rebuildNewCSSPropertyValue(propertyValue, newValue, finishValue);
              values[property] = helpers.setSingleOrObjectKey(newValue, key, values[property]);
              valuesCSS[property] = helpers.setSingleOrObjectKey(newValueCSS, key, valuesCSS[property]);
          });

          setCSSProperty(property);

          if (settings.duplicate) {
              settings.duplicate.forEach(element => setCSSProperty(property, element));
          }
      }
      
      return { values, valuesCSS };
  }

  scrollTop(offsetTop, settings = {}) {
      this.animate(
          window,
          {
              scrollY: offsetTop,
          },
          settings,
          {
              complete: () => {
                  
              }
          }
      );
  }

  scrollTo(element = window, offsets, settings = {}) {
    this.animate(
      element,
        {
            scrollX: offsets.left || 0,
            scrollY: offsets.top || 0
        },
        settings,
        {
            complete: () => {
                
            }
        }
    );
}

  slideDown(element, settings = {}) {
      const boundingElement = settings.boundingRect || element;
      const boundingRect = this.hiddenElementRectCalculation(boundingElement);

      delete element.dataset.animationSlideDownCompleted;
      element.style.height = `${element.getBoundingClientRect().height || 0}px`;
      element.style.overflow = 'hidden';
      element.style.display = 'block';
      this.animate(
          element,
          {
              height: `${boundingRect.height}px`,
          },
          settings,
          {
              complete: () => {
                  element.style.overflow = '';
                  element.dataset.animationSlideDownCompleted = true;
              }
          }
      );
  }

  slideUp(element, settings = {}) {
      if(element.dataset.animationSlideDownCompleted) {
          this.addCashe(element, element.getBoundingClientRect());
          delete element.dataset.animationSlideDownCompleted;
      }
      
      element.style.overflow = 'hidden';
      this.animate(
          element,
          {
              height: '0px',
          },
          settings,
          {
              complete: () => {
                  element.style.display = '';
                  element.style.overflow = '';
              }
          }
      );
  }

  slideTo(element, value, settings = {}) {
      this.animate(
          element,
          {
              height: `${value}px`
          },
          settings
      );
  }

  stop(element, doComplete) {
      const isAnimate = this.isAnimate(element);

      if (isAnimate) element.animation.methods.stop(doComplete);
      return isAnimate;
  }

  isAnimate(element) {
      return !!element.animation;
  }

  clearCashe() {
      this.cashe = [];
  }

  getCashe(element) {
      let cashe;
      let index;

      this.cashe.forEach((object, objectIndex) => {
          if(object.element === element) {
              cashe = object.cashe;
              index = objectIndex;
              return false;
          }
      });
      return cashe !== undefined ? { cashe, index } : cashe;
  }

  addCashe(element, cashe) {
      const lastCashe = this.getCashe(element);

      lastCashe ? this.cashe[lastCashe.index].cashe = cashe :
                  this.cashe.push({ element, cashe });
      
      return cashe;
  }

  hiddenElementRectCalculation(element) {
      const cashe = this.getCashe(element);

      if(cashe !== undefined) {
          return cashe.cashe;
      } 
  
      const parent = element.parentNode;
      const width = window.getComputedStyle(element).width;

      parent.style.position =`${window.getComputedStyle(parent).position === 'static' ? 'relative' : ''}`;
      element.setAttribute('style', `
          visibility: hidden !important;
          position: absolute !important;
          display: block !important;
          ${width === 'auto' ? 'width: 100% !important;' : ''}`
      );

      const boundingRect = element.getBoundingClientRect();

      element.removeAttribute('style');
      parent.style.position = '';
      return this.addCashe(element, boundingRect);
  }

  getCurrentPropertyValues(element, properties) {
      const values = {};

      for (const property in properties) {
          if (element === window) {
            values[property] = window.scrollY;
          } else if (property === 'scrollY') {
            values[property] = element.scrollTop;
          } else if (property === 'scrollX') {
            values[property] = element.scrollLeft;
          } else {
              let stringCSS = this.getCSSProperty(element, property);

              if (property === 'transform') {
                  values[property] = this.getTransformObjectFromCSS(stringCSS);
              } else {
                  values[property] = this.getCSSPropertyValue(stringCSS);
              }
          }
      }

      return values;
  }

  getFinalSettings(settings = {}) {
      const duration = this.duration;
      const timing = this.timing;
      const draw = this.draw.bind(this);
      const finalSettings = Object.assign(
          { duration, timing, draw },
          settings
      );
      finalSettings.timingFunction = this.timingFunctions[finalSettings.timing].bind(this);

      return finalSettings;
  }

  getStepValues(start, time, duration, timingFunction) {
      const timeFraction = Math.min(1, (time - start) / duration);
      const progress = timingFunction(timeFraction);

      return { timeFraction, progress };
  }

  getCSSProperty(element, property) {
      return window.getComputedStyle(element).getPropertyValue(property);
  }

  getCSSPropertyValue(stringCSS) {
      return helpers.processSingleOrObject(stringCSS, string => {
          return Number(string.replace(/([a-zA-z%()])+/g, ''));
      });
  }

  getProgressValue(initialValue, finishValue, progress) {
      return initialValue + ((finishValue - initialValue) * progress);
  }

  getTransformObjectFromCSS(stringCSS) {
      const matrix = stringCSS === 'none' ? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } : new DOMMatrixReadOnly(stringCSS);

      return {
          scaleX: matrix.a,
          skewY: matrix.b,
          skewX: matrix.c,
          scaleY: matrix.d,
          translateX: matrix.e,
          translateY: matrix.f
      }
  }

  buildMatrixCSS(data, dataCSS) {
      let transformCSS = [];
      const addTransformProperty = (name, defaultValue) => {
          if (data[name] !== undefined && data[name] !== defaultValue) transformCSS.push(`${name}(${dataCSS[name]})`);
      };

      addTransformProperty('scaleX', 1);
      addTransformProperty('skewY', 0);
      addTransformProperty('skewX', 0);
      addTransformProperty('scaleY', 1);
      addTransformProperty('translateX', 0);
      addTransformProperty('translateY', 0);
      return transformCSS.join(' ');
  }

  buildCSSTemplate(stringCSS, numberValue) {
      return stringCSS.replace(numberValue, '{n}');
  }

  buildCSSPropertyByTemplate(template, value) {
      return template.replace('{n}', value);
  }

  rebuildNewCSSPropertyValue(stringCSS, value, currentValue) {
      currentValue = currentValue || this.getCSSPropertyValue(stringCSS);
      const templateCSS = this.buildCSSTemplate(stringCSS, currentValue);
      const newValueCSS = this.buildCSSPropertyByTemplate(templateCSS, value);
      return newValueCSS;
  }

  setCSSProperty(element, property, valueCSS) {
      element.style[property] = valueCSS;
  }

  setJSProperty(element, property, value) {
      if (element === window) {
        if (property === 'scrollY') {
          element.scrollTo(0, value);
        }
      } else if (property === 'scrollY') {
        element.scrollTop = value;
      } else if (property === 'scrollX') {
        element.scrollLeft = value;
      }
  }

  setWillChange(element, properties, settings) {
      if(element === window) return;
      
      let value = [];

      for (const property in properties) {
          if(property === 'scrollY' || property === 'scrollX') continue;

          value.push(property);
      }

      value = value.join(', ');
      
      const setCSSProperty = (elem = element) => {
          this.setCSSProperty(elem, 'will-change', value);
      };

      setCSSProperty();

      if (settings.duplicate) {
          settings.duplicate.forEach(element => setCSSProperty(element));
      }
  }

  unsetWillChange(element, settings) {
      if(element === window) return;

      const unsetCSSProperty = (elem = element) => {
          this.setCSSProperty(elem, 'will-change', '');
      };

      unsetCSSProperty();

      if (settings.duplicate) {
          settings.duplicate.forEach(element => unsetCSSProperty(element));
      }
  }

  callSettingsCallbacks(stepData, callbacks) {
      const settings = stepData.element.animation.settings;

      stepData.statuses.forEach(status => {
          if(status === 'complete' && settings.disableCompleteCallbacks) {
              return;
          }
          if (callbacks[status]) callbacks[status](stepData);
          if (settings[status]) settings[status](stepData);
      });
  }

  hasEventInfo(element, str) {
      return element.animation && element.animation.settings.event.eventInfo.includes(str);
  }
}

const animation = new Animation();

class AnimatedProductButton {
  constructor() {
    this.interval = 2000;
    
    const elements = document.querySelectorAll('.js-animated-product-button');

    setTimeout(() => {
      elements.forEach(element => {
        this.animate(element);
      });
    }, this.interval);
  }

  animate(element) {
    element.addEventListener('animationend', () => {
      element.classList.remove('button--css-animate');
      setTimeout(() => {
        this.animate(element);
      }, this.interval);
    }, { once: true });
    element.classList.add('button--css-animate');
  }
}

const animatedProductButton = new AnimatedProductButton();

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', 'false');

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  if (elementToFocus) elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(func, ms) {

  let isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper() {

    if (isThrottled) { // (2)
      savedArgs = arguments;
      savedThis = this;
      return;
    }

    func.apply(this, arguments); // (1)

    isThrottled = true;

    setTimeout(function() {
      isThrottled = false; // (3)
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    this.buttonBack = document.querySelector('.js-menu-drawer-back');
    this.modalOverlay = document.querySelector('.modal-overlay');
    this.menuDrawer = document.querySelector('#menu-drawer');
    this.inner = document.querySelector('.mobile-facets__inner');

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    // this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
    this.modalOverlay.addEventListener('click', this.onModalOverlayClick.bind(this));
    this.buttonBack.addEventListener('click', this.closeMenuDrawer.bind(this));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;
    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  onModalOverlayClick(event) {
    this.closeMenuDrawer(event);
  }

  openMenuDrawer(summaryElement) {
    if(this.inner) {
      this.inner.removeEventListener('transitionend', this.onCloseTransitionend);
    }

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`, 'body-menu-opening');
  }

  onCloseTransitionend() {
    document.body.classList.remove('body-menu-opening');
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      if(this.inner) {
        this.inner.removeEventListener('transitionend', this.onCloseTransitionend);
        this.inner.addEventListener('transitionend', this.onCloseTransitionend, { once: true });
      }

      this.mainDetailsToggle.classList.remove('menu-opening');
      this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      });
      document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
    if(document.body.classList.contains('position-fixed')) {
      document.body.classList.remove('position-fixed');
      document.body.style.top = '';
      window.scrollTo(0, +document.body.dataset.scrollTop);
      document.body.removeAttribute('data-scroll-top');
    }
  }

  // onFocusOut(event) {
  //   setTimeout(() => {
  //     if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer(event);
  //   });
  // }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    const summaryElement = detailsElement.querySelector('summary');
    
    summaryElement.focus();
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.header = this.header || document.getElementById('shopify-section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
    document.body.classList.add('position-fixed');
    document.body.style.top = `${scrollTop * -1}px`;
    document.body.dataset.scrollTop = scrollTop;
  }
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden', 'product-modal');
    this.setAttribute('open', '');
    
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden', 'product-modal');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent() {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      this.appendChild(content.querySelector('video, model-viewer, iframe')).focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeSlider();
  }

  initializeSlider() {
    this.accordionButton = this.closest('accordion-button');

    if (this.accordionButton && !this.accordionButton.classList.contains('animated-dropdown--active')) {
      this.accordionButton.addEventListener('opened', () => {
        if(this.accordionButton.classList.contains('slider-loaded')) return;
        this.initializeSlider();
        this.accordionButton.classList.add('slider-loaded');
      });
      return;
    }

    this.slider = this.querySelector('ul.slider, [id^="Slider-"]');
    
    if (!this.slider) return;
    
    this.sliderItems = this.querySelectorAll('ul.slider li, [id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    this.bullets = this.querySelectorAll('button[name="bullet"]');

    this.initPages();
    
    if (this.sliderItemsToShow.length < 2) return;
    
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));

    if (this.prevButton) {
      this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    }
    if (this.nextButton) {
      this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
    }

    if(this.bulletsToShow.length > 1) {
      this.bulletsToShow.forEach((element, index) => {
        element.onclick = null;
        element.addEventListener('click', this.onBulletClick.bind(this, index));
      });
    }

    if(this.dataset.autoplay !== undefined && this.bulletsToShow.length > 1) {
      this.startAutoplay();
    }
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter((element) => element.clientWidth > 0);

    if (this.sliderItemsToShow.length < 2) return;

    this.bulletsToShow = Array.from(this.bullets).filter((element) => element.clientWidth > 0);
    this.sliderItemsBanner = Array.from(this.sliderItems).map((element) => element.querySelector('.banner'));
    this.sliderItemsMedia = Array.from(this.sliderItems).map((element) => element.querySelector('.slideshow__media'));
    this.sliderItemsAdditionalMedia = Array.from(this.sliderItems).map((element) => element?.querySelectorAll('.slideshow__additional-media'));
    this.sliderItemsImgs = Array.from(this.sliderItemsMedia).map((element) => element?.querySelectorAll('img'));
    this.sliderItemsContent = Array.from(this.sliderItems).map((element) => element.querySelector('.banner__content'));
    this.sliderItemsBox = Array.from(this.sliderItems).map((element) => element.querySelector('.banner__box'));
    this.sliderItemsContentElements = Array.from(this.sliderItemsContent).map((element) => element?.querySelectorAll('.slideshow__content-element'));
    this.sliderLastItem = this.sliderItemsToShow[this.sliderItemsToShow.length - 1];
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.sliderItemGap = Math.abs(this.sliderItemsToShow[0].offsetLeft + this.sliderItemsToShow[0].clientWidth - this.sliderItemsToShow[1].offsetLeft);

    this.slidesPerPage = Math.round(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.slidePositionRatio = [];
    this.slidePositionFullPercent = [];
    this.slidePositionPercent = [];
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  calculateSlidePosition() {
    this.sliderItemsToShow.forEach((item, index) => {
      // const slideOffset = index * this.slider.clientWidth - this.slider.scrollLeft;
      const slideOffset = item.getBoundingClientRect().left - this.slider.getBoundingClientRect().left;

      this.slidePositionFullPercent[index] = Math.round(slideOffset / (this.slider.clientWidth / 100));
      this.slidePositionPercent[index] = Math.min(100, Math.max(-100, this.slidePositionFullPercent[index]));
      this.slidePositionRatio[index] = this.slidePositionPercent[index] / 100;
    });
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    this.calculateSlidePosition();

    const previousPage = this.currentPage;

    this.slidePositionPercent.forEach((percent, index) => {
      if(percent >= -50 && percent <= 50) {
        this.currentPage = ++index;
        return false;
      }
    });

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent('slideChanged', {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    this.bulletsToShow.forEach((element, index) => {
      if(this.slider.classList.contains('slider--two-in-row')) {
        index *= 2;
      }
      if (this.currentPage === index + 1 || (this.slider.classList.contains('slider--two-in-row') && this.currentPage === index + 2)) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }
    
    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    // this.pageCount.textContent = this.currentPage;
    // this.pageTotal.textContent = this.totalPages;
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset + this.sliderItemGap;
    return element.offsetLeft + element.clientWidth <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event, button) {
    if(event) {
      event.preventDefault();
    }

    const step = event?.currentTarget?.dataset?.step || 1;
    button = button || event.currentTarget.name;
    
    this.slideScrollPosition =
      button === 'next'
        ? (this.currentPage + step - 1) * this.sliderItemOffset
        : (this.currentPage - step - 1) * this.sliderItemOffset;

    this.setSlidePosition(this.slideScrollPosition);
  }

  setSlidePosition(position) {
    this.slider.scrollTo({
      left: position
    });
  }

  onBulletClick(index, event) {
    if(event) event.preventDefault();
    if(this.slider.classList.contains('slider--two-in-row')) {
      index *= 2;
    }

    this.slideScrollPosition = index * this.sliderItemOffset;
    this.setSlidePosition(this.slideScrollPosition);

    // const slideScrollPosition = (this.sliderLastItem.clientWidth + this.sliderItemGap) * index;
    // this.slider.scrollTo({
    //   left: slideScrollPosition
    // });
  }

  toNextSlide() {
    let nextSlide;
    this.bulletsToShow.forEach((element, index) => {
      if(element.classList.contains('active')) {
        nextSlide = index + 1;
        if(nextSlide >= this.bulletsToShow.length) {
          nextSlide = 0;
        }
        return false;
      }
    });
    this.bulletsToShow.forEach(element => element.classList.remove('active'));
    this.bulletsToShow[nextSlide].classList.add('active');
    this.onBulletClick(nextSlide);
  }

  startAutoplay() {
    setInterval(() => {
      this.toNextSlide();
    }, +this.dataset.autoplay);
  }
}

customElements.define('slider-component', SliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.initializeSlideshow();
  }

  initializeSlideshow() {
    this.ANIMATIONS_DURATION = 700;
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;
    this.pageX = 0;
    this.pageY = 0;
    this.pageYOffset = 0;
    this.scrollDuration = this.ANIMATIONS_DURATION * this.dataset.sliderAnimationsSpeedRatio;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.announcementBarSlider = this.querySelector('.announcement-bar-slider');
    // Value below should match --duration-announcement-bar CSS value
    this.announcerBarAnimationDelay = this.announcementBarSlider ? 250 : 0;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach((link) => link.addEventListener('click', this.linkToSlide.bind(this)));

    const onFirstPreloadImages = () => {
      this.preloadImages();
      removeFirstPreloadImagesListeners();
    };
    const removeFirstPreloadImagesListeners = () => {
      this.slider.removeEventListener('mouseenter', onFirstPreloadImages);
      window.removeEventListener('load', onFirstPreloadImages);
    };

    this.slider.addEventListener('mouseenter', onFirstPreloadImages);
    window.addEventListener('load', onFirstPreloadImages);
    window.addEventListener('mousemove', this.onWindowMousemove.bind(this));
    window.addEventListener('scroll', this.onWindowScroll.bind(this));

    if (this.announcementBarSlider) {
      this.announcementBarArrowButtonWasClicked = false;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.addEventListener('change', () => {
        if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
      });

      [this.prevButton, this.nextButton].forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            this.announcementBarArrowButtonWasClicked = true;
          },
          { once: true }
        );
      });
    }

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();

    const stickyHeader = document.getElementsByTagName('sticky-header')[0];

    if (stickyHeader) stickyHeader.slideshowComponent = this;
  }

  // disconnectedCallback() {
    
  // }

  initPages() {
    this.initializeAnimations = this.dataset.enableSliderAnimations === 'true' && !isTouchCapable() && themeBase.isDesktop && !Shopify.designMode;

    if(this.initializeAnimations) this.classList.add('slideshow--animation-effects');
    else this.classList.remove('slideshow--animation-effects');
    super.initPages();
    if(this.dataset.enableMouseAnimation === 'true') this.setSlideMovementElementsAnimation();
  }

  update() {
    super.update();
    this.dynamicProcessing();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  setAutoPlay() {
    this.autoplaySpeed = this.slider.dataset.speed * 1000;
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    if (this.querySelector('.slideshow__autoplay')) {
      this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
      this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
      this.autoplayButtonIsSetToPlay = true;
      this.play();
    } else {
      this.reducedMotion.matches || this.announcementBarArrowButtonWasClicked
        ? this.pause()
        : this.play();
    }
  }

  onWindowMousemove(event) {
    this.pageX = event.pageX;
    this.pageY = event.pageY;
  }

  onWindowScroll(event) {
    this.pageY -= (this.pageYOffset - window.pageYOffset);
    this.pageYOffset = window.pageYOffset;
  }

  onButtonClick(event, button) {
    if (animation.isAnimate(this.slider)) return;
    super.onButtonClick(event, button);
    this.wasClicked = true;
    button = button || event.currentTarget.name;
    
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;
    
    if (!isFirstSlide && !isLastSlide) {
      this.applyAnimationToAnnouncementBar(button);
      return;
    }
    
    if(this.initializeAnimations) {
      this.loop(button, isFirstSlide, isLastSlide);
    } else {
      if (isFirstSlide && button === 'previous') {
        this.slideScrollPosition =
          this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
      } else if (isLastSlide && button === 'next') {
        this.slideScrollPosition = 0;
      }

      this.setSlidePosition(this.slideScrollPosition);
    }

    this.applyAnimationToAnnouncementBar(button);
  }
  
  loop(buttonName, isFirstSlide, isLastSlide) {
    if (isFirstSlide && buttonName === 'previous') {
      this.slider.classList.add('slider--infinite-to-last');
      this.slider.scrollLeft = (this.sliderItemsToShow.length - 1) * this.sliderFirstItemNode.clientWidth;
      this.slideScrollPosition =
        (this.sliderItemsToShow.length - 2) * this.sliderFirstItemNode.clientWidth;
      this.setSlidePosition(this.slideScrollPosition, () => {
        this.slider.scrollLeft = (this.sliderItemsToShow.length - 1) * this.sliderFirstItemNode.clientWidth;
        this.slider.classList.remove('slider--infinite-to-last');
      });
    } else if (isLastSlide && buttonName === 'next') {
      this.slider.classList.add('slider--infinite-to-first');
      this.slider.scrollLeft = 0;
      this.slideScrollPosition = this.sliderFirstItemNode.clientWidth;
      this.setSlidePosition(this.slideScrollPosition, () => {
        this.slider.scrollLeft = 0;
        this.slider.classList.remove('slider--infinite-to-first');
      });
    }
  }

  setSlidePosition(position, complete) {
    if(this.initializeAnimations) {
      animation.stop(this.slider, false);
      animation.scrollTo(this.slider, {
          left: position
        }, {
        duration: this.scrollDuration,
        complete: complete
      });
    } else {
      if (this.setPositionTimeout) clearTimeout(this.setPositionTimeout);
      this.setPositionTimeout = setTimeout(() => {
        this.slider.scrollTo({
          left: position
        });
      }, this.announcerBarAnimationDelay);
    }
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
      this.play();
    } else if (
      !this.reducedMotion.matches &&
      !this.announcementBarArrowButtonWasClicked
    ) {
      this.play();
    }
  }

  focusInHandling(event) {
    if (this.sliderAutoplayButton) {
      const focusedOnAutoplayButton =
        event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
      if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
        this.play();
      } else if (this.autoplayButtonIsSetToPlay) {
        this.pause();
      }
    } else if (this.announcementBarSlider.contains(event.target)) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    this.onButtonClick(null, 'next');
  }

  dynamicProcessing(preloadImages) {
    this.setSlideVisibility();

    if(preloadImages) this.preloadImages();
    if(!this.initializeAnimations) {
      this.clearAnimations();
      return;
    }

    if (this.dataset.enableMediaAnimation === 'true') {
      this.setSlideMediaAnimation();
      this.setSlideAdditionalMediaAnimation();
    }
    
    this.setSlideBannerCSSAnimation();
    this.setSlideContentCSSAnimation();
    this.setSlideBoxAnimation();
    this.setSlideContentElementsCSSAnimation();
    this.hasAnimationStates = true;
  }

  clearAnimations() {
    if(!this.hasAnimationStates) return;

    this.slider.querySelectorAll('*').forEach(element => {
      element.removeAttribute('style');
      element.classList.remove('banner--animate', 'slideshow__content--animate', 'slideshow__content-element--animate');
    });

    this.hasAnimationStates = false;
  }

  setSlideVisibility(event) {
    this.sliderItemsToShow.forEach((item, index) => {
      const linkElements = item.querySelectorAll('a');
      if (index === this.currentPage - 1) {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.removeAttribute('tabindex');
          });
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (linkElements.length)
          linkElements.forEach((button) => {
            button.setAttribute('tabindex', '-1');
          });
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
    this.wasClicked = false;
  }

  setSlideMediaAnimation() {
    const TRANSLATE_OFFSET = 70;
    const SCALE_SIZE = 0.2;
    const OPACITY_RANGE = 0.7;
    const BLUR_SIZE = 20;

    this.sliderItemsMedia.forEach((item, index) => {
      if(!item) return;
      
      const ratioSign = Math.sign(this.slidePositionRatio[index]);
      const ratioAbs = Math.abs(this.slidePositionRatio[index]);
      const translate = TRANSLATE_OFFSET * timingFunctions.easeOutCubic(ratioAbs) * ratioSign;
      const scale = 1 - SCALE_SIZE * timingFunctions.easeInOutQuad(ratioAbs);
      const opacity = 1 - OPACITY_RANGE * timingFunctions.easeInOutCubic(ratioAbs);
      const blur = BLUR_SIZE * timingFunctions.easeInOutQuad(ratioAbs);

      item.style.transform = `translateX(${translate / 10}rem) scale(${scale})`;
      item.style.opacity = opacity;
      item.style.filter = `blur(${blur}px)`;
    });
  }

  setSlideAdditionalMediaAnimation() {
    const TRANSLATE_OFFSET = 100;
    const SCALE_SIZE = 0.5;
    const INDEX_SPREAD_FACTOR = 2;

    const calculateIndexSpread = index => {
      if(index === 0) return 1;
      return index * INDEX_SPREAD_FACTOR;
    };
    
    this.sliderItemsAdditionalMedia.forEach((contentElements, contentIndex) => {
      if(!contentElements) return;

      const ratioSign = Math.sign(this.slidePositionRatio[contentIndex]);
      const ratioAbs = Math.abs(this.slidePositionRatio[contentIndex]);

      contentElements.forEach((item, index) => {
        const translate = TRANSLATE_OFFSET * timingFunctions.easeInOutQuad(ratioAbs) * ratioSign * calculateIndexSpread(index);
        const scale = 1 - SCALE_SIZE * timingFunctions.easeInOutQuad(ratioAbs);

        item.style.transform = `translateX(${translate}%) scale(${scale})`;
      });
    });
  }

  setSlideBannerCSSAnimation() {
    const START_RATIO_RANGE = 0.6;

    this.sliderItemsBanner.forEach((item, index) => {
      if(!item) return;

      if(this.slidePositionRatio[index] > START_RATIO_RANGE * -1 && this.slidePositionRatio[index] < START_RATIO_RANGE) {
        item.classList.add('banner--animate');
      } else if(this.slidePositionRatio[index] === 1 || this.slidePositionRatio[index] === -1) {
        item.classList.remove('banner--animate');

        if(this.currentPage !== 1) this.classList.remove('slideshow--first-load');        
      }
    });
  }

  setSlideContentCSSAnimation() {
    const START_RATIO_RANGE = 0.6;

    this.sliderItemsContent.forEach((item, index) => {
      if(!item) return;

      if(this.slidePositionRatio[index] > START_RATIO_RANGE * -1 && this.slidePositionRatio[index] < START_RATIO_RANGE) {
        item.classList.add('slideshow__content--animate');
      } else if(this.slidePositionRatio[index] === 1 || this.slidePositionRatio[index] === -1) {
        item.classList.remove('slideshow__content--animate');
      }
    });
  }

  setSlideBoxAnimation() {
    // const TRANSLATE_OFFSET = -500;
    const TRANSLATE_OFFSET = 70;
    const OPACITY_RANGE = 0.5;

    this.sliderItemsBox.forEach((item, index) => {
      if(!item) return;

      const ratioSign = Math.sign(this.slidePositionRatio[index]);
      const ratioAbs = Math.abs(this.slidePositionRatio[index]);
      const translate = TRANSLATE_OFFSET * timingFunctions.easeInOutQuad(ratioAbs) * ratioSign;
      const opacity = 1 - OPACITY_RANGE * timingFunctions.easeInOutQuad(ratioAbs);

      item.style.transform = `translateX(${translate / 10}rem)`;
      item.style.opacity = opacity;
    });
  }

  setSlideContentElementsCSSAnimation() {
    const START_RATIO_RANGE = 0.6;

    this.sliderItemsContentElements.forEach((contentElements, contentIndex) => {
      if(!contentElements) return;
      
      contentElements.forEach((item, index) => {
        if(this.slidePositionRatio[contentIndex] > START_RATIO_RANGE * -1 && this.slidePositionRatio[contentIndex] < START_RATIO_RANGE) {
          item.dataset.contentElementIndex = index;
          item.classList.add('slideshow__content-element--animate');
        } else if(this.slidePositionRatio[contentIndex] === 1 || this.slidePositionRatio[contentIndex] === -1) {
          item.classList.remove('slideshow__content-element--animate');
        }
      });
    });
  }

  setSlideMovementElementsAnimation() {
    if(this.enabledMovementAnimation) return;
    
    this.updateSlideMovementElementsAnimation();
  }

  updateSlideMovementElementsAnimation() {
    if(!this.initializeAnimations) {
      this.enabledMovementAnimation = false;
      return;
    }
    
    if(this.pageX !== 0) {
      const COEFS_BY_INDEX = [0.3, 0.45, 0.6, 1.2];
      const ROTATE_COEF = 0;
      const sliderBounds = this.slider.getBoundingClientRect();
      const sliderCenterX = sliderBounds.left + this.slider.clientWidth / 2;
      const sliderCenterY = sliderBounds.top + window.pageYOffset + this.slider.clientHeight / 2;
      const sliderLeftLimit = sliderBounds.left;
      const sliderRightLimit = sliderBounds.right;
      const sliderTopLimit = sliderBounds.top + window.pageYOffset;
      const sliderBottomLimit = sliderBounds.bottom + window.pageYOffset;
      const cursorDivergenceX = sliderCenterX - Math.max(sliderLeftLimit, Math.min(sliderRightLimit, this.pageX));
      const cursorDivergenceY = sliderCenterY - Math.max(sliderTopLimit, Math.min(sliderBottomLimit, this.pageY));
      
      [0, 1, 2, 3].forEach((item, index) => {
        const translateX = Math.round(cursorDivergenceX / 100 * COEFS_BY_INDEX[index]);
        const translateY = Math.round(cursorDivergenceY / 100 * COEFS_BY_INDEX[index]);
        const rotateX = Math.round(cursorDivergenceY * ROTATE_COEF);
        const rotateY = Math.round(cursorDivergenceX * ROTATE_COEF);
        
        this.style.setProperty(`--move-effect-transform-index-${index}`,
          `translate(${translateX / 10}rem, ${translateY / 10}rem) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
      });
    }

    this.enabledMovementAnimation = true;
    window.requestAnimationFrame(this.updateSlideMovementElementsAnimation.bind(this));
  }

  preloadImages() {
    this.sliderItemsImgs.forEach((item, index) => {
      if(!item || this.slidePositionFullPercent[index] > 100 || this.slidePositionFullPercent[index] < -100) 
        return;

        item.forEach(element => element.setAttribute('loading', 'eager'));
    });
  }

  applyAnimationToAnnouncementBar(button = 'next') {
    if (!this.announcementBarSlider) return;

    const itemsCount = this.sliderItems.length;
    const increment = button === 'next' ? 1 : -1;

    const currentIndex = this.currentPage - 1;
    let nextIndex = (currentIndex + increment) % itemsCount;
    nextIndex = nextIndex === -1 ? itemsCount - 1 : nextIndex;

    const nextSlide = this.sliderItems[nextIndex];
    const currentSlide = this.sliderItems[currentIndex];

    const animationClassIn = 'announcement-bar-slider--fade-in';
    const animationClassOut = 'announcement-bar-slider--fade-out';

    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === itemsCount - 1;

    const shouldMoveNext = (button === 'next' && !isLastSlide) || (button === 'previous' && isFirstSlide);
    const direction = shouldMoveNext ? 'next' : 'previous';

    currentSlide.classList.add(`${animationClassOut}-${direction}`);
    nextSlide.classList.add(`${animationClassIn}-${direction}`);

    setTimeout(() => {
      currentSlide.classList.remove(`${animationClassOut}-${direction}`);
      nextSlide.classList.remove(`${animationClassIn}-${direction}`);
    }, this.announcerBarAnimationDelay * 2);
  }

  linkToSlide(event) {
    event.preventDefault();
    // const slideScrollPosition =
    //   this.slider.scrollLeft +
    //   this.sliderFirstItemNode.clientWidth *
    //   (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    // this.slider.scrollTo({
    //   left: slideScrollPosition
    // });

    this.slideScrollPosition = this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
      (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.setSlidePosition(this.slideScrollPosition);
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.product = this.closest('.product');
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange(settings = {}) {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantProductAttribute();
    // this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.removeActiveMedia();
    this.updateVariantStatuses();
    
    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput(settings);
      this.renderProductInfo();
      this.updateShareUrl();
    }

    this.updateThumbnailSlider();
  }

  updateOptions(options) {
    this.options = options || Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  changeOptions(options) {
    const selects = this.querySelectorAll('select');

    options.forEach((optionValue, index) => {
      const options = selects[index].querySelectorAll('option');
      
      options.forEach(option => {
        option.selected = option.value === optionValue;
      });
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  // updateMedia() {
  //   if (!this.currentVariant) return;
  //   if (!this.currentVariant.featured_media) return;
  //   const newMedia = document.querySelector(
  //     `[data-media-id="${this.dataset.section}-${this.currentVariant.featured_media.id}"]`
  //   );

  //   if (!newMedia) return;
  //   const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
  //   if (!modalContent) return;
  //   const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
  //   const parent = newMedia.parentElement;
  //   if (parent.firstChild == newMedia) return;
  //   modalContent.prepend(newMediaModal);
  //   parent.prepend(newMedia);
  //   this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
  //   if(this.stickyHeader) {
  //     this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
  //   }
  //   window.setTimeout(() => {
  //     parent.scrollLeft = 0;
  //     parent.querySelector('li.product__media-item').scrollIntoView({behavior: 'smooth'});
  //   });
  // }

  removeActiveMedia() {
    const mediaGalleries = this.product?.querySelector('media-gallery');

    if (!mediaGalleries) return; 

    mediaGalleries.classList.remove('has-active');
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(`[id^="MediaGallery-${this.dataset.section}"]`);

    mediaGalleries.forEach((mediaGallery) => {
      if(window.groupGallery) {
        mediaGallery.querySelectorAll('slider-component').forEach(slider => {
          slider.resetPages();
        });
        mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, !window.groupGallery);
      } else {
        mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, !window.groupGallery)
      }
    });

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector(`[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateThumbnailSlider() {
    if (!window.groupGallery) return;
    if (!this.product) return;

    const thumbnailSlider = this.product.querySelector('.thumbnail-slider');

    if (!thumbnailSlider) return;

    thumbnailSlider.resetPages();
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput(settings) {
    const productForms = this.dataset.productType === 'card' ? [this.closest('form')] : document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
    
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    if (this.dataset.productType !== 'card' && !settings.isFootbar) {
      const footbarProductForm = document.getElementById(`product-form-${this.dataset.section}-footbar`);

      if (footbarProductForm) {
        const footbarInput = footbarProductForm.querySelector('select[name="id"]');
        footbarInput.value = this.currentVariant.id;
        footbarInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll('.product-form__input')];
    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(elementList, availableValuesList) {
    elementList.forEach((element) => {
      const value = element.getAttribute('value');
      const availableElement = availableValuesList.includes(value);

      if (element.tagName === 'INPUT') {
        element.classList.toggle('disabled', !availableElement);
      } else if (element.tagName === 'OPTION') {
        element.innerText = availableElement
          ? value
          : window.variantStrings.unavailable_with_option.replace('[value]', value);
      }
    });
  }

  updateVariantProductAttribute() {
    if(!this.product) return;
    if(this.currentVariant) {
      this.product.setAttribute('data-selected-variant-id', this.currentVariant.id);
    } else {
      this.product.removeAttribute('data-selected-variant-id');
    }
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  // updateStockCountdown($product, data) {
  //   const $stock_countdown = $product.find('[data-js-product-stock-countdown]'),
  //       $title = $stock_countdown.find('[data-js-product-stock-countdown-title]'),
  //       $progress = $stock_countdown.find('[data-js-product-stock-countdown-progress]'),
  //       min = +$stock_countdown.attr('data-min'),
  //       quantity = 0;

  //   $.each(data.json.variants_quantity, function () {
  //     if(+this.id === +data.update_variant.id) {
  //       quantity = +this.quantity;

  //       return false;
  //     }
  //   });

  //   if($title) {
  //     $title.html(Shopify.addValueToString(window.variantStrings.stockCountdown.title, {
  //       'quantity': '<span class="stock-countdown__counter">' + quantity + '</span>'
  //     }));
  //   }
  //   if($progress) {
  //     $progress.width(quantity / (min / 100) + '%');
  //   }
  //   if($stock_countdown.length) {
  //     $stock_countdown[quantity > 0 && quantity < min ? 'removeClass' : 'addClass']('d-none-important');
  //   }
  // }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    if (this.dataset.productType === 'card') {
      fetch(`${this.dataset.url}${this.dataset.url.indexOf('?') === -1 ? '?' : '&'}variant=${this.currentVariant.id}&view=product-cart`)
      .then((response) => response.text())
      .then((responseText) => {
        const product = this.closest('.card-wrapper');
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const mediaDestination = product.querySelector('.media');
        const mediaSource = html.querySelector('.media');
        const priceDestination = product.querySelector('.card-information__price');
        const priceSource = html.querySelector('.card-information__price');
        const badgeDestination = product.querySelector('.card__badge');
        const badgeSource = html.querySelector('.card__badge');

        if (mediaSource && mediaDestination) {
          const mediaWrapper = document.createElement('div');

          mediaWrapper.innerHTML = mediaSource.innerHTML;
  
          const mediaImage = mediaWrapper.querySelector('img');
  
          mediaImage.style = 'visibility: hidden;';
          mediaImage.addEventListener('load', () => {
            mediaImage.style = '';
            mediaImage.nextSibling.remove();

            if (mediaImage.nextSibling) mediaImage.nextSibling.remove();
          });
          mediaDestination.insertBefore(mediaImage, mediaDestination.firstChild);
        }
        if (priceSource && priceDestination) priceDestination.innerHTML = priceSource.innerHTML;
        if (badgeSource && badgeDestination) badgeDestination.innerHTML = badgeSource.innerHTML;
        if (badgeDestination) badgeDestination.classList.remove('visibility-hidden');

        const price = product.querySelector('.card-information__price');

        if (price) price.classList.remove('visibility-hidden');
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut, false, !this.currentVariant.available);
      });
    } else {
      fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const priceId = `price-${this.dataset.section}`;
        const skuId = `Sku-${this.dataset.section}`;
        const stockId = `stock-${this.dataset.section}`;
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const priceDestination = document.getElementById(priceId);
        const priceSource = html.getElementById(priceId);
        const skuDestination = document.getElementById(skuId);
        const skuSource = html.getElementById(skuId);
        const stockDestination = document.getElementById(stockId);
        const stockSource = html.getElementById(stockId);
        const inventorySource = html.getElementById(
          `Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`
        );
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);

        if (priceSource && priceDestination) priceDestination.innerHTML = priceSource.innerHTML;
        if (skuSource && skuDestination) skuDestination.innerHTML = skuSource.innerHTML;
        if (stockSource && stockDestination) stockDestination.innerHTML = stockSource.innerHTML;
        if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;

        const price = document.getElementById(`price-${this.dataset.section}`);
        const sku = document.getElementById(`Sku-${this.dataset.section}`);
        const stock = document.getElementById(`stock-${this.dataset.section}`);

        if (price) price.classList.remove('visibility-hidden');
        if (sku) sku.classList.remove('visibility-hidden');
        if (stock) stock.classList.remove('visibility-hidden');
        if (stock) stock.classList[!stock.querySelector('.product__stock-content') ? 'add' : 'remove']('hidden');
        if (inventoryDestination)
          inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');
        
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut, false, !this.currentVariant.available);
      });
    }
  }

  toggleAddButton(disable = true, text, modifyClass = true, isSoldOut) {
    const productForm = this.dataset.productType === 'card' ? this.closest('form') : document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');

    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if(isSoldOut !== undefined) {
      if (isSoldOut) {
        addButton.classList.add('button--sold-out');
      } else {
        addButton.classList.remove('button--sold-out');
      }
    }

    if(this.dataset.productType !== 'card') {
      const productFootbarForm = document.getElementById(`product-form-${this.dataset.section}-footbar`);
      if (!productFootbarForm) return;
      const footbarAddButton = productFootbarForm.querySelector('[name="add"]');
      const footbarAddButtonText = productFootbarForm.querySelector('[name="add"] > span');

      if (disable) {
        footbarAddButton.setAttribute('disabled', 'disabled');
        if (text) footbarAddButtonText.textContent = text;
      } else {
        footbarAddButton.removeAttribute('disabled');
        footbarAddButtonText.textContent = window.variantStrings.addToCart;
      }
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = this.dataset.productType === 'card' ? this.closest('form') : document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    let price;

    if(this.dataset.productType === 'card') {
      const productForm = this.closest('.product-form');
      price = productForm.querySelector('.card-information__price');
    } else {
      price = document.getElementById(`price-${this.dataset.section}`);
    }

    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');

    if(this.dataset.productType === 'card') {
      const product = this.closest('product-form');
      const badge = product.querySelector('.card__badge');
      
      if (badge) badge.classList.add('visibility-hidden');
    }
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }

  changeOptions(options) {
    const fieldsets = this.querySelectorAll('fieldset');

    options.forEach((optionValue, index) => {
      const inputs = fieldsets[index].querySelectorAll('input');
      
      inputs.forEach(input => {
        input.checked = input.value === optionValue;
      });
    });
  }
}

customElements.define('variant-radios', VariantRadios);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (!this.querySelector('slider-component') && this.classList.contains('complementary-products')) {
            this.remove();
          }

          if (html.querySelector('.slider__slide')) {
            this.classList.add('product-recommendations--loaded');
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };

    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px 400px 0px' }).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class TickerSection extends HTMLElement {
  constructor() {
    super();
    window.addEventListener('MutationObserver', this.update.bind(this), {once: true});
    window.addEventListener('MutationObserverLoaded', this.update.bind(this), {once: true});
  }

  connectedCallback() {
    this.content = this.querySelector('.ticker__content');
    this.speed = parseInt(this.dataset.speed);

    this.classList.remove('hidden');
    this.update();
  }

  update() {
    this.classList.remove('animate');
    this.getSizes();
    this.cloning();
    this.setSpeed();
    this.classList.add('animate');
  }

  getSizes() {
    this.width = this.clientWidth;
    this.contentWidth = 0;

    this.content.childNodes.forEach(element => {
      if(!element.clientWidth) return;
      this.contentWidth = this.contentWidth + element.clientWidth;
    });
  }

  setSpeed() {
    this.style.setProperty('--scroll-duration', `${this.contentWidth / (60 + 30 / 3 * this.speed)}s`);
  }

  cloning() {
    const clonningIndex = parseInt(this.width / this.contentWidth) + 1;
    const clones = this.querySelectorAll('.ticker__content--clone');
    
    if(clones.length >= clonningIndex) return;
    
    for(let i = 0; i < clonningIndex; i++) {
      let clonedContent = this.content.cloneNode(true);

      clonedContent.classList.add('ticker__content--clone');
      this.insertBefore(clonedContent, this.content.nextSibling);
    }
  }
}

customElements.define('ticker-section', TickerSection);

class GoogleMap extends HTMLElement {
  constructor() {
    super();
    window?.google?.maps ? this.initMap() : this.loadScript();
  }

  loadScript() {
    const script = document.createElement('script');
    
    script.onload = this.initMap.bind(this);
    script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?sensor=false&key=${this.dataset.apiKey}`);
    document.head.appendChild(script);
  }

  getStyle(style = '1') {
    const styles = {
      'default': [],
      'greyscale': [{"featureType":"all","elementType":"geometry.fill","stylers":[{"weight":"2.00"}]},{"featureType":"all","elementType":"geometry.stroke","stylers":[{"color":"#9c9c9c"}]},{"featureType":"all","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"landscape.man_made","elementType":"geometry.fill","stylers":[{"color":"#ffffff"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"color":"#eeeeee"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#7b7b7b"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry.fill","stylers":[{"color":"#c8d7d4"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#070707"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"}]}],
      'dark': [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.country","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.country","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.country","elementType":"labels.text","stylers":[{"visibility":"simplified"}]},{"featureType":"administrative.province","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"administrative.locality","elementType":"all","stylers":[{"visibility":"simplified"},{"saturation":"-100"},{"lightness":"30"}]},{"featureType":"administrative.neighborhood","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"simplified"},{"gamma":"0.00"},{"lightness":"74"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"lightness":"3"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}],
      'light': [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}],
      'avocado': [{"featureType":"water","elementType":"geometry","stylers":[{"visibility":"on"},{"color":"#aee2e0"}]},{"featureType":"landscape","elementType":"geometry.fill","stylers":[{"color":"#abce83"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"color":"#769E72"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#7B8758"}]},{"featureType":"poi","elementType":"labels.text.stroke","stylers":[{"color":"#EBF4A4"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"visibility":"simplified"},{"color":"#8dab68"}]},{"featureType":"road","elementType":"geometry.fill","stylers":[{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#5B5B3F"}]},{"featureType":"road","elementType":"labels.text.stroke","stylers":[{"color":"#ABCE83"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#A4C67D"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#9BBF72"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#EBF4A4"}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"visibility":"on"},{"color":"#87ae79"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#7f2200"},{"visibility":"off"}]},{"featureType":"administrative","elementType":"labels.text.stroke","stylers":[{"color":"#ffffff"},{"visibility":"on"},{"weight":4.1}]},{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#495421"}]},{"featureType":"administrative.neighborhood","elementType":"labels","stylers":[{"visibility":"off"}]}],
      'blue-water': [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}]
    };

    return styles[style];
  }

  initMap() {
    const { address, zoom, showMarker, style } = this.dataset;

    const map = new google.maps.Map(this, Object.assign({
      zoom: +zoom,
      scrollwheel: false,
      styles: this.getStyle(style)
    }, address === '' ? { center: { lat: -34.397, lng: 150.644 } } : {} ));

    new google.maps.Geocoder()
    .geocode({ address })
    .then(result => {
      const { results } = result;

      map.setCenter(results[0].geometry.location);
      if(showMarker === 'true') this.initMarker(map, results);
      return results;
    })
    .catch(e => log(`Geocoder error: ${e}`));
  }

  initMarker(map, results) {
    const marker = new google.maps.Marker({ map });
    marker.setMap();
    marker.setPosition(results[0].geometry.location);
    marker.setMap(map);
  }
}

customElements.define('google-map', GoogleMap);

class LookbookSection extends HTMLElement {
  constructor() {
    super();
    
    this.items = this.querySelectorAll('.lookbook__item');
    this.columns = this.querySelectorAll('.lookbook__column');

    this.items.forEach((element, index) => {
      element.addEventListener('mouseenter', () => {
        this.columns[index].classList.add('active');
      });
      element.addEventListener('mouseleave', () => {
        this.columns[index].classList.remove('active');
      });
    });

    this.columns.forEach((element, index) => {
      element.addEventListener('mouseenter', () => {
        this.items[index].classList.add('active');
      });
      element.addEventListener('mouseleave', () => {
        this.items[index].classList.remove('active');
      });
    });
  }
}

customElements.define('lookbook-section', LookbookSection);

class RvideoComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.video = this.querySelector('video');
    this.playButton = this.querySelector('.rvideo-component__play');

    this.addEventListener('click', () => {
      if (this.video.paused) {
        this.video.play();
        this.classList.remove('rvideo-component--paused');
      } else {
        this.video.pause();
        this.classList.add('rvideo-component--paused');
      }
    });
  }
}

customElements.define('rvideo-component', RvideoComponent);