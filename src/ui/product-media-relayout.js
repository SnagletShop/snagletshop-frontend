(function (window, document) {
  window.__SS_BOOT__?.onReady(function () {
    const mediaQuery = window.matchMedia('(max-width: 680px)');

    function rememberOriginalPlacement(imagesDiv) {
      if (!imagesDiv || imagesDiv.dataset.originalParentId) return;
      const parent = imagesDiv.parentElement;
      if (!parent) return;
      if (!parent.id) parent.id = 'original-parent-' + Math.random().toString(36).slice(2, 11);
      imagesDiv.dataset.originalParentId = parent.id;
      imagesDiv.dataset.originalIndex = String(Array.from(parent.children).indexOf(imagesDiv));
    }

    function restoreImages(imagesDiv) {
      if (!imagesDiv) return;
      const originalParent = document.getElementById(imagesDiv.dataset.originalParentId || '');
      const originalIndex = parseInt(imagesDiv.dataset.originalIndex || '0', 10);
      if (!originalParent) return;
      if (originalParent.children[originalIndex] === imagesDiv) return;
      const referenceNode = originalParent.children[originalIndex] || null;
      originalParent.insertBefore(imagesDiv, referenceNode);
    }

    function positionImages(productWrapper) {
      const imagesDiv = productWrapper?.querySelector?.('.Product_Images');
      const productNameHeading = productWrapper?.querySelector?.('.Product_Name_Heading');
      if (!imagesDiv || !productNameHeading) return;
      rememberOriginalPlacement(imagesDiv);
      if (mediaQuery.matches) {
        if (productNameHeading.nextElementSibling !== imagesDiv) {
          productNameHeading.parentNode.insertBefore(imagesDiv, productNameHeading.nextElementSibling);
        }
        return;
      }
      restoreImages(imagesDiv);
    }

    function refreshCurrentProductPage() {
      const pages = Array.from(document.querySelectorAll('.Product_Detail_Page'));
      if (!pages.length) return;
      const activePage = pages.find((page) => page.offsetParent !== null) || pages[pages.length - 1];
      positionImages(activePage);
      for (const page of pages) {
        if (page !== activePage) {
          const imagesDiv = page.querySelector('.Product_Images');
          if (imagesDiv) restoreImages(imagesDiv);
        }
      }
    }

    const scheduleRefresh = (() => {
      let rafId = 0;
      return function scheduleRefresh() {
        if (rafId) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          refreshCurrentProductPage();
        });
      };
    })();

    const globalObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        if ((mutation.addedNodes && mutation.addedNodes.length) || (mutation.removedNodes && mutation.removedNodes.length)) {
          scheduleRefresh();
          break;
        }
      }
    });

    mediaQuery.addEventListener('change', scheduleRefresh);
    globalObserver.observe(document.body, { childList: true, subtree: true });
    scheduleRefresh();
  });
})(window, document);
