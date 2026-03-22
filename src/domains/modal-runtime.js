(function (window) {
  "use strict";

  function clearLegacyPaymentSuccessLocalStorage(keys) {
    try {
      localStorage.removeItem(keys?.flagKey || "payment_successful");
      localStorage.removeItem(keys?.reloadKey || "payment_successful_reload_on_ok");
    } catch {}
  }

  function setPaymentSuccessFlag(deps, options = {}) {
    try {
      const store = deps?.getStore?.();
      if (!store) return;
      const reloadOnOk = options?.reloadOnOk !== false;
      store.setItem(deps.flagKey, "1");
      if (reloadOnOk) store.setItem(deps.reloadKey, "1");
      else store.removeItem(deps.reloadKey);
      deps.clearLegacy?.({ flagKey: deps.flagKey, reloadKey: deps.reloadKey });
    } catch (e) {
      console.warn("Could not set payment success flag:", e);
    }
  }

  function checkAndShowPaymentSuccess(deps) {
    try {
      deps?.clearLegacy?.({ flagKey: deps.flagKey, reloadKey: deps.reloadKey });
      const store = deps?.getStore?.();
      if (!store) return false;
      const flag = store.getItem(deps.flagKey);
      if (flag !== "1") return false;
      const msg = deps?.getSuccessMessage?.() || "Thank you for shopping with us! Your payment was successful and we are hard at work to get you your order as soon as possible!";
      requestAnimationFrame(() => deps?.showOverlay?.(msg));
      return true;
    } catch (e) {
      console.warn("Could not check payment success flag:", e);
      return false;
    }
  }

  function handleOutsideClick(deps, event) {
    const modal = document.getElementById("paymentModal");
    if (!modal) return;
    if (event?.target === modal) deps?.closeModal?.({ preserveDraft: true });
  }

  async function openModal(deps, options = {}) {
    const opts = (options && typeof options === "object") ? options : {};
    const fromHistory = opts.fromHistory === true;

    await deps?.createPaymentModal?.();

    const modal = document.getElementById("paymentModal");
    if (modal) modal.style.display = "flex";

    if (!deps?.getModalHistoryPushed?.() && !fromHistory) {
      try {
        const currentState = (history.state && typeof history.state === "object") ? history.state : {};
        const nextIndex = Number.isFinite(deps?.getCurrentIndex?.()) ? deps.getCurrentIndex() : currentState.index;
        history.pushState({
          ...currentState,
          index: Number.isFinite(nextIndex) ? nextIndex : -1,
          modalOpen: true
        }, "", window.location.href);
        deps?.setModalHistoryPushed?.(true);
      } catch {}
    } else if (fromHistory) {
      deps?.setModalHistoryPushed?.(true);
    }

    await deps?.initPaymentModalLogic?.();
  }

  function closeModal(deps, opts = {}) {
    const options = (opts && typeof opts === "object") ? opts : {};
    const preserveDraft = options.preserveDraft !== false;
    const clearDraft = options.clearDraft === true;
    const fromHistory = options.fromHistory === true;

    if (!fromHistory && !deps?.isHandlingPopstate?.() && history.state?.modalOpen) {
      try { history.back(); return; } catch {}
    }

    if (preserveDraft) deps?.saveCheckoutDraftFromModal?.();
    if (clearDraft) deps?.clearCheckoutDraft?.();

    try {
      const escHandler = deps?.getEscHandler?.();
      if (escHandler) {
        document.removeEventListener("keydown", escHandler);
        deps?.setEscHandler?.(null);
      }
    } catch {}

    const modal = document.getElementById("paymentModal");
    if (modal) modal.remove();

    deps?.resetWalletPaymentRequestButton?.();

    try { deps?.getPaymentElementInstance?.()?.unmount?.(); } catch {}
    deps?.setElementsInstance?.(null);
    deps?.setPaymentElementInstance?.(null);
    deps?.syncCentralState?.("checkout-runtime-reset", {
      clientSecret: deps?.getClientSecret?.(),
      stripeInstance: deps?.getStripeInstance?.(),
      elementsInstance: null,
      paymentElementInstance: null
    });

    deps?.setLatestClientSecret?.(null);
    deps?.setLatestOrderId?.(null);
    deps?.setLatestPaymentIntentId?.(null);
    deps?.setModalHistoryPushed?.(false);
  }

  function formatCardNumber(event) {
    let value = String(event?.target?.value || "").replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    if (event?.target) event.target.value = value;
  }

  function formatExpiryDate(event) {
    let value = String(event?.target?.value || "").replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
    if (event?.target) event.target.value = value;
  }

  function calculateTotal(cartItems) {
    return Object.values(cartItems || {}).reduce((sum, item) => sum + ((parseFloat(item?.price) || 0) * (item?.quantity || 0)), 0).toFixed(2);
  }

  function removeSortContainer() {
    console.log("✅ SortContainer removed engaged!");
    const sortContainer = document.getElementById("SortContainer");
    if (sortContainer) {
      sortContainer.remove();
      console.log("✅ SortContainer removed successfully!");
    } else {
      console.log("⚠️ SortContainer not found.");
    }
  }

  function calculateTotalAmount(deps) {
    return Object.values(deps?.getBasket?.() || {}).reduce((sum, item) => sum + ((parseFloat(item?.price) || 0) * (item?.quantity || 0)), 0).toFixed(2);
  }

  function basketButtonFunction(deps) {
    try {
      const router = window.__SS_ROUTER__ || null;
      if (router && typeof router.navigate === "function") {
        return router.navigate("GoToCart", [], { replaceCurrent: false });
      }
      if (typeof window.GoToCart === "function") return window.GoToCart();
      const screens = window.__SS_APP__?.resolve?.("screens.manager", null) || null;
      if (screens?.show) return screens.show("basket", { action: "GoToCart", data: [] });
    } catch {}
    try { window.location.href = '/'; } catch {}
    return null;
  }

  window.__SS_MODAL_RUNTIME__ = {
    clearLegacyPaymentSuccessLocalStorage,
    setPaymentSuccessFlag,
    checkAndShowPaymentSuccess,
    handleOutsideClick,
    openModal,
    closeModal,
    formatCardNumber,
    formatExpiryDate,
    calculateTotal,
    removeSortContainer,
    calculateTotalAmount,
    basketButtonFunction
  };
})(window);
