declare global {
  interface Window {
    showToast;
    closeToast;
    formatDate;
    getDateTime;
    formatCurrency;
    Query;
    $;
    showPage;
    appConfig;
    showSpendItemModal;
    deleteSpendItem;
    toggleDetailsRow;
    spendOnLoad;
    statsOnLoad;
    noteOnLoad;
    settingOnLoad;
  }
}

export {};
