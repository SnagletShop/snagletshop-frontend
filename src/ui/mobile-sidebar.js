
(function (window, document) {
  window.__SS_BOOT__?.onReady(function () {
    const sidebar = document.querySelector('.mobileSideBar');
    const modal = document.querySelector('.mobileModalDiv');
    const openBtn = document.getElementById('openSidebarButton');
    const closeBtn = document.getElementById('closeSidebarButton');
    const sidebarLogo = document.querySelector('.mobileSideBar .mobileLogo');
    const mediaQuery = window.matchMedia('(max-width: 680px)');
    if (!sidebar || !modal) return;

    function toggleSidebar() {
      sidebar.classList.toggle('open');
      modal.classList.toggle('active');
    }

    const boundHandlers = {
      open: () => toggleSidebar(),
      close: () => toggleSidebar(),
      modal: () => toggleSidebar(),
      categoryClick: function (e) {
        const target = e.target.closest('.Category_Button');
        if (target) toggleSidebar();
      },
      sidebarLogoClick: () => toggleSidebar(),
    };

    function addListeners() {
      openBtn?.addEventListener('click', boundHandlers.open);
      closeBtn?.addEventListener('click', boundHandlers.close);
      modal?.addEventListener('click', boundHandlers.modal);
      document.body.addEventListener('click', boundHandlers.categoryClick);
      sidebarLogo?.addEventListener('click', boundHandlers.sidebarLogoClick);
    }

    function removeListeners() {
      openBtn?.removeEventListener('click', boundHandlers.open);
      closeBtn?.removeEventListener('click', boundHandlers.close);
      modal?.removeEventListener('click', boundHandlers.modal);
      document.body.removeEventListener('click', boundHandlers.categoryClick);
      sidebarLogo?.removeEventListener('click', boundHandlers.sidebarLogoClick);
    }

    function handleResize(e) { if (e.matches) addListeners(); else removeListeners(); }
    handleResize(mediaQuery);
    mediaQuery.addEventListener('change', handleResize);
  });
})(window, document);
