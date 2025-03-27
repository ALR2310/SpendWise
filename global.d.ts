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
    deleteSpendItem;
    toggleDetailsRow;
    spendOnLoad;
    statsOnLoad;
    noteOnLoad;
    settingOnLoad;
    t;
    openModalSpendList;
    openModalSpendItem;
  }
}

export {};
