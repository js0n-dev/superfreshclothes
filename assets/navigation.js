
if(!window.navJsLoaded) {
    class NavigationControler {
        constructor() {
            this.headerSection = document.getElementsByTagName('header-section')[0];
            // this.menuPopup = document.getElementsByTagName('menu-popup')[0];
            this.buttons = this.headerSection.querySelectorAll('[data-menu-button]');
            this.megaMenus = document.querySelectorAll('mega-menu');
            this.dropdownMenus = document.querySelectorAll('dropdown-menu, popup-menu-dropdown');
            this.background = document.getElementById('megaMenuBackground');
            this.dataOpenOnclick = this.headerSection.hasAttribute('data-open-onclick');

            this.buttons.forEach(element => {
                const hasDropdownMenu = !!element.closest('dropdown-menu');
                const hasMegaMenu = !!this.getMegaMenuByHandle(element.dataset.menuButton);

                if(element.dataset.action === 'hover') {
                    element.addEventListener('mouseenter', this.onButtonsMouseenter.bind(this, element, hasDropdownMenu, false));
                } else {
                    element.addEventListener(this.dataOpenOnclick ? 'click' : 'mouseenter', this.onButtonsMouseenter.bind(this, element, hasDropdownMenu, hasMegaMenu));
                }
            });

            // if(this.menuPopup) {
            //     this.menuPopupButton = document.querySelector('.popup-menu-button');

            //     const setMenuPopupSpacingCSSVariable = () => {
            //         const menuPopupButtonBounds = this.menuPopupButton.getBoundingClientRect();

            //         document.documentElement.style.setProperty('--menu-popup-spacing', `${Math.floor(menuPopupButtonBounds.bottom + 10) / 10}rem`);

            //         log(`${Math.floor(menuPopupButtonBounds.bottom + 10) / 10}rem`)
            //     };

            //     this.menuPopupButton.addEventListener('click', setMenuPopupSpacingCSSVariable);
            // }
        }

        

        onButtonsMouseenter(button, hasDropdownMenu, hasMegaMenu, event) {
            if(button.classList.contains('menu-button-active')) return;

            const closeWithoutAnimation = hasDropdownMenu || hasMegaMenu;
            const visibleMegaMenu = this.getVisibleMegaMenu();
            const visibleDropdown = this.getVisibleDropdown();

            if(hasMegaMenu && visibleMegaMenu) return;
            if(!visibleMegaMenu && !visibleDropdown) return;

            helpers.addEventInfo(event, 'onButtonsMouseenter');
            
            if(visibleMegaMenu) {
                closeWithoutAnimation ? visibleMegaMenu.megaMenuCloseWithoutAnimation() : visibleMegaMenu.megaMenuClose(event);
            } else if(visibleDropdown) {
                closeWithoutAnimation ? visibleDropdown.dropdownMenuCloseWithoutAnimation() : visibleDropdown.dropdownMenuClose(event);
            }
        }

        getVisibleMegaMenu() {
            return helpers.findElementsByClass(this.megaMenus, 'mega-menu--visible')[0];
        }

        getVisibleDropdown() {
            return helpers.findElementsByClass(this.dropdownMenus, 'dropdown-menu--visible')[0];
        }

        getMegaMenuByHandle(handle) {
            return document.querySelector(`mega-menu[data-link-handle="${handle}"]`);
        }

        backgroundCloseWithoutAnimation() {
            this.background.removeAttribute('style');
        }

        allContentsCloseWithoutAnimation() {
            const visibleMegaMenu = this.getVisibleMegaMenu();

            if(visibleMegaMenu) visibleMegaMenu.contentCloseWithoutAnimation();
        }

        allDropdownsCloseWithoutAnimation() {
            const visibleDropdown = this.getVisibleDropdown();

            if(visibleDropdown) visibleDropdown.dropdownMenuCloseWithoutAnimation();
        }
    }

    const navigationControler = new NavigationControler;

    class MegaMenuBasis extends HTMLElement {
        constructor() {
            super();
            this.duration = 300;
            this.button = navigationControler.headerSection.querySelector(`[data-menu-button="${this.dataset.linkHandle}"]`);
            // this.button = navigationControler.headerSection.querySelector(`[data-link-handle="${this.dataset.linkHandle}"]`);

            if(!this.button) return;
            
            this.button.dataset.linkHandle = this.dataset.linkHandle;
            this.button.querySelector('.header__icons-menu-item-text')?.classList?.add('header__icons-menu-item-text--has-arrow');
            this.button.querySelector('.header__text-menu-item')?.classList?.add('header__text-menu-item--has-arrow');

            this.list = this.button.closest('ul');
            this.buttons = this.list.querySelectorAll('[data-menu-button]');
            this.spacer = this.querySelector('.mega-menu__spacer');
            this.content = this.querySelector('.mega-menu__content');
            this.close = this.querySelector('.mega-menu__close');

            this.close.addEventListener('keypress', event => {
                if (event.key !== 'Enter') return;
                this.onButtonClick(event);
            });
        }

        onButtonClick(event) {
            event.preventDefault();
            if(event.type !== 'click' && event.key !== 'Enter') return;
            helpers.addEventInfo(event, 'onButtonClick');

            if (this.classList.contains('mega-menu--visible')) {
                this.megaMenuClose(event);
                this.button.focus();
            } else {
                this.megaMenuOpen(event);
                this.close.focus();
            }
        }

        megaMenuOpen(event) {
            helpers.addEventInfo(event, 'megaMenuOpen');
            
            animation.stop(navigationControler.background, false);
            navigationControler.allContentsCloseWithoutAnimation();
            animation.slideDown(
                navigationControler.background,
                {
                    duration: this.duration,
                    boundingRect: this,
                    duplicate: [this],
                    event: event,
                    complete: () => {
                        this.removeAttribute('style');
                    }
                }
            );
            this.button.classList.add('menu-button-active');
            this.classList.add('mega-menu--visible');
            setTimeout(() => this.classList.add('mega-menu--active'));
            document.body.classList.add('mega-menu-visible');
            setTimeout(() => document.body.classList.add('mega-menu-active'));
        }

        megaMenuClose(event) {
            if(!this.classList.contains('mega-menu--visible') || animation.hasEventInfo(navigationControler.background, 'megaMenuClose')) {
                return;
            }

            helpers.addEventInfo(event, 'megaMenuClose');
            animation.stop(navigationControler.background);

            animation.slideUp(
                navigationControler.background,
                {
                    duration: this.duration,
                    duplicate: [this],
                    complete: () => {
                        this.classList.remove('mega-menu--visible');
                        document.body.classList.remove('mega-menu-visible');
                    },
                    event: event
                }
            );
            
            this.button.classList.remove('menu-button-active');
            this.classList.remove('mega-menu--active');
            document.body.classList.remove('mega-menu-active');
        }

        contentCloseWithoutAnimation() {
            this.button.classList.remove('menu-button-active');
            this.classList.remove('mega-menu--active', 'mega-menu--visible');
        }

        megaMenuCloseWithoutAnimation() {
            document.body.classList.add('close-without-animation');
            animation.stop(navigationControler.background, false);
            this.contentCloseWithoutAnimation();
            navigationControler.backgroundCloseWithoutAnimation();
            document.body.classList.remove('mega-menu-active', 'mega-menu-visible');
            setTimeout(() => document.body.classList.remove('close-without-animation'));
        }
    }

    if (navigationControler.dataOpenOnclick) {
        class MegaMenu extends MegaMenuBasis {
            constructor() {
                super();

                if(!this.button) return;

                this.button.addEventListener('click', this.onButtonClick.bind(this));
                document.body.addEventListener('click', this.onDocumentClick.bind(this));
            }

            onDocumentClick(event) {
                if (this.classList.contains('mega-menu--visible') && !helpers.containsOrIs(this.list, event.target) && !helpers.containsOrIs(this, event.target)) {
                    helpers.addEventInfo(event, 'onDocumentClick');
                    this.megaMenuClose(event);
                }
            }
        }

        customElements.define('mega-menu', MegaMenu);
    } else {
        class MegaMenu extends MegaMenuBasis {
            constructor() {
                super();

                if(!this.button) return;
                
                this.button.addEventListener('click', event => {
                    if(event.pointerType === 'mouse') return;
                    this.onButtonClick(event);

                    const link = this.button.tagName === 'A' ? this.button : this.button.querySelector('a');
                    const href = link.getAttribute('href') || null; 

                    if(href) {
                        window.location.href = href;
                    }
                });
                this.button.addEventListener('mouseenter', this.onButtonMouseenter.bind(this));
                this.list.addEventListener('mouseleave', this.onListMouseleave.bind(this));
                this.addEventListener('mouseleave', this.onMenuMouseleave.bind(this));
                this.spacer.addEventListener('mouseleave', this.onSpacerMouseleave.bind(this));
            }

            onButtonMouseenter(event) {
                if(helpers.containsOrIs(this, event.relatedTarget)) {
                    return;
                }
                
                helpers.addEventInfo(event, 'onButtonMouseenter');
                this.megaMenuOpen(event);
            }

            onListMouseleave(event) {
                if(!this.classList.contains('mega-menu--visible') || helpers.containsOrIs(this, event.relatedTarget)) {
                    return;
                }

                helpers.addEventInfo(event, 'onListMouseleave');
                this.megaMenuClose(event);
            }

            onMenuMouseleave(event) {
                if(helpers.findElement(navigationControler.buttons, event.relatedTarget)) {
                    return;
                }

                helpers.addEventInfo(event, 'onMenuMouseleave');
                this.megaMenuClose(event);
            }

            onSpacerMouseleave(event) {
                if(event.relatedTarget === this.button) {
                    return;
                }

                this.trimSpacer();
            }

            contentCloseWithoutAnimation() {
                super.contentCloseWithoutAnimation();
                this.spacerHide();
            }

            megaMenuOpen(event) {
                super.megaMenuOpen(event);
                this.spacerShow();
            }

            megaMenuClose(event) {
                super.megaMenuClose(event);
                this.spacerHide();
            }

            spacerShow() {
                const megaMenuRect = this.getBoundingClientRect();
                const buttonRect = this.button.getBoundingClientRect();
        
                this.spacer.style.height = `${(megaMenuRect.top - buttonRect.bottom) / 10}rem`;
            }
        
            spacerHide() {
                this.spacer.removeAttribute('style');
            }

            trimSpacer() {
                const buttonRect = this.button.getBoundingClientRect();

                this.spacer.style.width = `${buttonRect.width + 30}px`;
                this.spacer.style.left = `${buttonRect.left - 15}px`;
            }
        }

        customElements.define('mega-menu', MegaMenu);
    }

    class DropdownMenuBasis extends HTMLElement {
        constructor() {
            super();
            this.duration = 300;
            this.button = this.querySelector('summary');

            if(this.button.dataset.linkHandle) return;

            this.dropdown = this.querySelector('.header__submenu');
            this.list = this.button.closest('ul');
            this.buttons = this.list.querySelectorAll('[data-menu-button]');
            this.content = this.querySelector('.header__submenu');
            this.urlButtons = this.querySelectorAll('[data-url]');

            const detailsButton = this.button.closest('details');
            const detailsButtons = detailsButton.querySelectorAll('details');

            [...detailsButtons, detailsButton].forEach(element => element.setAttribute('open', true));
            detailsButtons.forEach(element => {
                element.querySelector('summary').addEventListener('click', this.onChildSummaryClick.bind(this));
                element.addEventListener('click', event => {
                    this.onChildClick(event, element);
                });
                element.addEventListener('mouseenter', this.onChildMouseenter.bind(this));
                element.addEventListener('mouseleave', this.onChildMouseleave.bind(this));
            });
            this.urlButtons.forEach(element => {
                element.addEventListener('click', () => {
                    window.location.href = element.dataset.url;
                });
            });
        }

        onChildSummaryClick(event) {
            event.preventDefault();
        }

        onChildClick(event, element) {
            // event.preventDefault();
            if(event.pointerType === 'mouse') return;

            const submenu = element.querySelector('.header__submenu');

            if(!submenu.classList.contains('header__submenu--visible')) {
                this.onChildMouseenter(event, element);
            } else {
                this.onChildMouseleave(event, element);
            }
        }

        onChildMouseenter(event, element) {
            const target = element || event.target;
            const submenu = target.querySelector('.header__submenu');
            const width = parseInt(getComputedStyle(submenu).width);
            const itemRect = target.getBoundingClientRect();

            submenu.classList[itemRect.right + width + 20 >= document.documentElement.clientWidth ? 'add' : 'remove']('header__submenu--right');
            submenu.classList.add('header__submenu--visible');
            setTimeout(() => submenu.classList.add('header__submenu--active'), 10);
        }

        onChildMouseleave(event, element) {
            const target = element || event.currentTarget;
            const submenu = target.querySelector('.header__submenu');

            submenu.classList.remove('header__submenu--visible', 'header__submenu--active');
        }

        dropdownMenuOpen(event) {
            helpers.addEventInfo(event, 'dropdownMenuOpen');
            animation.stop(this.dropdown, false);
            navigationControler.allDropdownsCloseWithoutAnimation();

            const submenu = this.querySelector('.header__submenu');
            const itemRect = this.button.getBoundingClientRect();

            submenu.classList[itemRect.left + 210 >= document.documentElement.clientWidth ? 'add' : 'remove']('header__submenu--right');
            animation.slideDown(
                this.dropdown, {
                    duration: this.duration,
                    event: event
                }
            );
            this.button.classList.add('menu-button-active');
            this.classList.add('dropdown-menu--visible');
            setTimeout(() => this.classList.add('dropdown-menu--active'));
            document.body.classList.add('dropdown-menu-visible');
            setTimeout(() => document.body.classList.add('dropdown-menu-active'));
        }

        dropdownMenuClose(event) {
            if(!this.classList.contains('dropdown-menu--visible') || animation.hasEventInfo(this.dropdown, 'dropdownMenuClose')) return;

            helpers.addEventInfo(event, 'dropdownMenuClose');
            animation.stop(this.dropdown);
            animation.slideUp(
                this.dropdown,
                {
                    duration: this.duration,
                    complete: () => {
                        this.classList.remove('dropdown-menu--visible');
                        document.body.classList.remove('dropdown-menu-visible');
                    },
                    event: event
                }
            );
            this.button.classList.remove('menu-button-active');
            this.classList.remove('dropdown-menu--active');
            document.body.classList.remove('dropdown-menu-active');
        }

        dropdownMenuCloseWithoutAnimation() {
            document.body.classList.add('close-without-animation');
            animation.stop(this.dropdown, false);
            this.button.classList.remove('menu-button-active');
            this.classList.remove('dropdown-menu--active', 'dropdown-menu--visible');
            this.dropdown.removeAttribute('style');
            document.body.classList.remove('dropdown-menu-active', 'dropdown-menu-visible');
            setTimeout(() => document.body.classList.remove('close-without-animation'), 10);
        }

        onButtonClick(event) {
            helpers.addEventInfo(event, 'onButtonClick');

            if (this.classList.contains('dropdown-menu--visible')) {
                this.dropdownMenuClose(event);
            } else {
                this.dropdownMenuOpen(event);
            }
        }
    }

    if (navigationControler.dataOpenOnclick) {
        class DropdownMenu extends DropdownMenuBasis {
            constructor() {
                super();

                if(this.button.dataset.linkHandle) return;

                const hasMegaMenu = navigationControler.getMegaMenuByHandle(this.button.dataset.linkHandle);

                this.button.addEventListener('click', event => {
                    if(event.pointerType !== 'mouse' || (event.pointerType === 'mouse' && !hasMegaMenu)) {
                        event.preventDefault();
                        this.onButtonClick(event);
                    }
                });

                if(hasMegaMenu) return;
                
                document.body.addEventListener('click', this.onDocumentClick.bind(this));
            }

            onDocumentClick(event) {
                if (this.classList.contains('dropdown-menu--visible') && !helpers.containsOrIs(this.list, event.target)) {
                    helpers.addEventInfo(event, 'onDocumentClick');
                    this.dropdownMenuClose(event);
                }
            }
        }

        customElements.define('dropdown-menu', DropdownMenu);
    } else {
        class DropdownMenu extends DropdownMenuBasis {
            constructor() {
                super();

                if(this.button.dataset.linkHandle) return;

                this.button.addEventListener('click', event => {
                    if(event.pointerType === 'mouse') return;
                    event.preventDefault();
                    this.onButtonClick(event);
                });

                if(navigationControler.getMegaMenuByHandle(this.button.dataset.linkHandle)) return;

                this.button.addEventListener('mouseenter', this.onButtonMouseenter.bind(this));
                this.list.addEventListener('mouseleave', this.onListMouseleave.bind(this));
            }

            onButtonMouseenter(event) {
                if(this.classList.contains('dropdown-menu--visible') && this.classList.contains('dropdown-menu--active')) {
                    return;
                }

                helpers.addEventInfo(event, 'onButtonMouseenter');
                this.dropdownMenuOpen(event);
            }

            onListMouseleave(event) {
                if(!this.classList.contains('dropdown-menu--visible') || helpers.containsOrIs(this.dropdown, event.relatedTarget)) {
                    return;
                }

                helpers.addEventInfo(event, 'onListMouseleave');
                this.dropdownMenuClose(event);
            }


            onMenuMouseleave(event) {
                if(event.relatedTarget === this.dropdown || event.relatedTarget === this.button) {
                    return;
                }

                helpers.addEventInfo(event, 'onMenuMouseleave');
                this.dropdownMenuClose(event);
            }
        }

        customElements.define('dropdown-menu', DropdownMenu);
    }

    const menuPopupButton = document.querySelector('.js-popup-menu-button');

    if(menuPopupButton) {

        function delegate(parentElement, eventType, targetSelector, callback) {
            parentElement.querySelectorAll(targetSelector).forEach(element => {
                element.addEventListener(eventType, callback);
            });
        };

        class MenuPopup {
            constructor() {
                this.onWindowResize = this.onWindowResize.bind(this);
                this.onMenuClick = this.onMenuClick.bind(this);
                this.onMenuWrapClick = this.onMenuWrapClick.bind(this);
                this.show = this.show.bind(this);
                this.hide = this.hide.bind(this);
                this.documentKeyPress = this.documentKeyPress.bind(this);
                this.onMenuItemEnter = this.onMenuItemEnter.bind(this);
                this.onMenuItemLeave = this.onMenuItemLeave.bind(this);
                this.menuWrap = document.getElementById('jsPopupMenuWrapper');
                this.hoveredMenuItems = [];
                this.init();
            }

            subscribeEvents() {
                if(this.subscribed) return;

                delegate(document, 'mouseover', '.popup-menu__list-item:not(.active)', this.onMenuItemEnter);
                delegate(document, 'mouseleave', '.popup-menu__list-item:not(.active)', this.onMenuItemLeave);
                delegate(document, 'mouseover', '.popup-menu__submenu-item', this.onMenuItemEnter);
                delegate(document, 'mouseleave', '.popup-menu__submenu-item', this.onMenuItemEnter);
                delegate(document, 'click', '#jsPopupMenu', this.onMenuClick);
                delegate(document, 'click', '#jsPopupMenuWrapper', this.onMenuWrapClick);

                window.addEventListener('resize', this.onWindowResize);
                document.addEventListener("keydown", this.documentKeyPress);

                this.subscribed = true;
            }

            unsubscribeEvents() {
                delegate(document, 'mouseover', '.popup-menu__list-item:not(.active)', this.onMenuItemEnter);
                delegate(document, 'mouseleave', '.popup-menu__list-item:not(.active)', this.onMenuItemLeave);
                delegate(document, 'mouseover', '.popup-menu__submenu-item', this.onMenuItemEnter);
                delegate(document, 'mouseleave', '.popup-menu__submenu-item', this.onMenuItemEnter);
                document.removeEventListener("click", this.onMenuClick);
                document.removeEventListener("click", this.onMenuWrapClick);

                window.removeEventListener('resize', this.onWindowResize);
                document.removeEventListener("keydown", this.documentKeyPress);
            }

            init() {
                this.menu = document.getElementById('jsPopupMenu');
                this.asyncMenuItems = document.querySelectorAll('#jsPopupMenu [data-async-item]');
                this.show();
            }

            documentKeyPress(e) {
                if (e.which === 27 || e.keyCode === 27) {
                    this.hide();
                }
            }

            removeFromHoverMenuArr(e) {
                this.hoveredMenuItems = this.hoveredMenuItems.filter((t) => t.el !== e);
            }

            onMenuItemEnter(e) {
                const t = e.currentTarget;
                this.currentHoveredMenuItem = t;
                const hasSubmenuClass = t.classList.contains("popup-menu__submenu-item") || e.target.closest(".popup-menu__submenu-item");
                this.hoveredMenuItems.push({
                    el: t,
                    time: Date.now()
                });
            
                if (hasSubmenuClass) {
                    e.stopPropagation();
                }
            
                this.hoverTimeout = setTimeout(() => {
                    const hoveredItem = this.hoveredMenuItems.find(item => item.el === t);
                    const menuElement = t;

                    if (this.currentHoveredMenuItem === t && hoveredItem) {
                        if (hasSubmenuClass) {
                            const submenuItem = menuElement.classList.contains("popup-menu__submenu-item") ? menuElement : e.target.closest(".popup-menu__submenu-item");
                            document.querySelectorAll(".popup-menu__submenu-item").forEach(item => item.classList.remove("active"));
                            submenuItem.classList.add("active");
                        } else {
                            document.querySelectorAll(".popup-menu__list-item, .popup-menu__submenu-item").forEach(item => item.classList.remove("active"));
            
                            const listItem = menuElement.closest(".popup-menu__list-item");
                            const submenuItem = listItem.querySelector(".popup-menu__submenu-item.popup-menu__has-submenu");
            
                            listItem.classList.add("active");
                            submenuItem && submenuItem.classList.add("active");
                        }
            
                        this.removeFromHoverMenuArr(t);
                    }
                }, 150);
            }

            onMenuItemLeave(e) {
                const t = e.currentTarget;
                const n = this.hoveredMenuItems.find((el) => el.el === t);

                if (n) {
                    if (Date.now() - n.time < 150) {
                        this.removeFromHoverMenuArr(t);
                    }
                }
            }

            onMenuClick(e) {
                if (e.target === this.menu) {
                    this.hide();
                }
            }

            onMenuWrapClick(e) {
                if (e.target === this.menuWrap) {
                    this.hide();
                }
            }

            show() {
                document.body.classList.add("no-scroll");
                this.menuWrap.classList.add("active");
                this.initMenuPosition();
                this.subscribeEvents();

                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                document.body.classList.add('overflow-hidden');
                document.body.classList.add('position-fixed');
                document.body.style.top = `${scrollTop * -1}px`;
                document.body.dataset.scrollTop = scrollTop;
            }

            hide() {
                this.menuWrap.classList.remove("active");
                // this.unsubscribeEvents();
                document.body.classList.remove("no-scroll");
                document.querySelectorAll(".popup-menu__list-item, .popup-menu__submenu-item").forEach(item => item.classList.remove("active"));

                document.body.classList.remove('overflow-hidden');
                document.body.classList.remove('position-fixed');
                document.body.style.top = '';
                window.scrollTo(0, document.body.dataset.scrollTop);
                document.body.removeAttribute('data-scroll-top');
            }

            initMenuPosition() {
                this.menu.style.setProperty('--menu-align-offset-top', `${Math.floor(menuPopupButton.getBoundingClientRect().bottom) / 10}rem`);
            }

            onWindowResize() {
                this.initMenuPosition();
            }
        }

        const menuWrap = document.querySelector('#jsPopupMenuWrapper');
        let menuPopup;

        menuPopupButton.addEventListener('click', () => {
            if(menuPopup !== undefined) {
                menuWrap.classList.contains('active') ? menuPopup.hide() : menuPopup.show();
            } else {
                menuPopup = new MenuPopup();
            }
        });
    }
}

window.navJsLoaded = true;