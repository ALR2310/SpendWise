import { formatCurrency, formatDate, getDateTime, showToast, closeToast } from './common/utils';
import $ from 'jquery';
import Handlebars from 'handlebars';
import { pageManager } from './configs/page.manager';
import { NoSqliteInit, Query } from './configs/nosql/db.wrapper';
import { NoteModel, SpendItemModel, SpendListModel } from './configs/nosql/db.models';
import { SocialLogin } from '@capgo/capacitor-social-login';
// import { backupData } from './common/data.backup';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { themeChange } from 'theme-change';
import { appConfig, Theme } from './configs/app.settings';

// Global variable
window.$ = $;
window.showToast = showToast;
window.closeToast = closeToast;
window.formatDate = formatDate;
window.getDateTime = getDateTime;
window.formatCurrency = formatCurrency;
window.Query = Query;
defineCustomElements(window);

// Helper handlebars
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);

// Set theme
themeChange();

(async () => {
  // Init database
  await NoSqliteInit([SpendListModel, SpendItemModel, NoteModel]);
  // Init social login
  await SocialLogin.initialize({
    google: {
      webClientId: __GOOGLE_CLIENT_ID__,
    },
  });

  // backupData().then((res) => console.log(res));

  // Set version app when start
  appConfig.general.version = __APP_VERSION__;

  // console.log(await Query('SELECT * FROM sqlite_master'));
  // console.log(await Query('SELECT * FROM SpendList'));
  // console.log(await Query('SELECT * FROM SpendItem'));

  pageManager.show('spend');
})();

// change theme icon
document.addEventListener('DOMContentLoaded', () => {
  $('.theme-controller')
    .prop('checked', $('html').attr('data-theme') === 'light')
    .on('change', () => (appConfig.general.theme = $('html').attr('data-theme') as Theme));
});
