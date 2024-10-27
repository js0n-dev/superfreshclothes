(function() {
    const popupCloseButtons = document.querySelectorAll('.js-popup-close');

    popupCloseButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            themeCookie.set(button.dataset.popupNamespace, '');

            const popup = button.closest('.popups__block');

            popup.classList.remove('popups__block--show');
        });
    });

    setTimeout(() => {
        if(window.hidePopups) {
            window.hidePopups.forEach(namespace => themeCookie.set(namespace, ''));
            window.hidePopups = null;
        }

        popupCloseButtons.forEach(button => {
            const cookieValue = themeCookie.get(button.dataset.popupNamespace);
            const urlCall = button.dataset.urlCall;

            if(cookieValue === undefined || window.location.href.indexOf(urlCall) !== -1) {
                const popup = button.closest('.popups__block');
    
                popup.classList.add('popups__block--show');
            }
        });
    }, window.popupsDelay * 1000);
})();