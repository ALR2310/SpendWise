declare global {
  interface Window {
    showToast: typeof showToast;
    closeToast: typeof closeToast;
    formatDate: typeof formatDate;
    getDateTime: typeof getDateTime;
    formatCurrency: typeof formatCurrency;
    Query: typeof Query;
    $: typeof $;
    showPage: typeof showPage;
    appConfig: typeof appConfig;
  }
}

export {};
