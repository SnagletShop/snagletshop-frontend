
(function (window, document) {
  window.__SS_BOOT__?.onReady(function () {
    const mediaQuery = window.matchMedia('(max-width: 680px)');
    function moveImagesIfNeeded(productWrapper) {
      const imagesDiv = productWrapper.querySelector('.Product_Images');
      const productNameHeading = productWrapper.querySelector('.Product_Name_Heading');
      if (!imagesDiv || !productNameHeading) return;
      if (!imagesDiv.dataset.originalParentId) {
        const parent = imagesDiv.parentElement;
        if (!parent.id) parent.id = 'original-parent-' + Math.random().toString(36).slice(2, 11);
        imagesDiv.dataset.originalParentId = parent.id;
        imagesDiv.dataset.originalIndex = String(Array.from(parent.children).indexOf(imagesDiv));
      }
      function moveImages() {
        if (mediaQuery.matches) {
          if (productNameHeading.nextElementSibling !== imagesDiv) {
            productNameHeading.parentNode.insertBefore(imagesDiv, productNameHeading.nextElementSibling);
          }
        } else {
          const originalParent = document.getElementById(imagesDiv.dataset.originalParentId);
          const originalIndex = parseInt(imagesDiv.dataset.originalIndex || '0', 10);
          if (originalParent && originalParent.children[originalIndex] !== imagesDiv) {
            const referenceNode = originalParent.children[originalIndex] || null;
            originalParent.insertBefore(imagesDiv, referenceNode);
          }
        }
      }
      moveImages();
      mediaQuery.addEventListener('change', moveImages);
    }
    const globalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const detailPage = node.matches('.Product_Detail_Page') ? node : node.querySelector?.('.Product_Detail_Page');
          if (detailPage) moveImagesIfNeeded(detailPage);
        });
      });
    });
    globalObserver.observe(document.body, { childList: true, subtree: true });
    const existingPage = document.querySelector('.Product_Detail_Page');
    if (existingPage) moveImagesIfNeeded(existingPage);
  });
})(window, document);
