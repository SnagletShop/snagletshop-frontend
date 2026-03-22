
(function (window, document) {
  window.__SS_BOOT__?.onReady(function () {
    const mediaQuery = window.matchMedia('(max-width: 680px)');
    let placeholder = null;
    const moveDownBy = 4;

    function moveProductWrapper() {
      const productWrapper = document.getElementById('ProductWrapper');
      const modalDiv = mediaQuery.matches
        ? (document.querySelector('.mobileModalDiv') || document.getElementById('MobileModalDiv') || document.getElementById('ModalDiv'))
        : document.getElementById('ModalDiv');
      if (!productWrapper || !modalDiv) return;
      if (mediaQuery.matches) {
        if (!placeholder && productWrapper.parentNode) {
          placeholder = document.createComment('Original ProductWrapper location');
          productWrapper.parentNode.insertBefore(placeholder, productWrapper);
        }
        let targetElement = modalDiv;
        for (let i = 0; i < moveDownBy; i++) {
          if (targetElement.nextElementSibling) targetElement = targetElement.nextElementSibling;
          else break;
        }
        if (targetElement.nextElementSibling) document.body.insertBefore(productWrapper, targetElement.nextElementSibling);
        else document.body.appendChild(productWrapper);
      } else if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.insertBefore(productWrapper, placeholder);
      }
    }

    const observer = new MutationObserver(() => {
      const productWrapper = document.getElementById('ProductWrapper');
      if (productWrapper) {
        moveProductWrapper();
        mediaQuery.addEventListener('change', moveProductWrapper);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})(window, document);
