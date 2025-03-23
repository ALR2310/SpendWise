import { formatCurrency, formatDate, getDateTime } from './common/utils';
import { closeToast, showToast } from './common/toast';
import $ from 'jquery';
import Handlebars from 'handlebars';
import { pageManager } from './configs/app.page';
import { NoSqliteInit, Query } from './configs/nosql/db.wrapper';
import { IncomeModel, NoteModel, SpendItemModel, SpendListModel } from './configs/nosql/db.models';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { themeChange } from 'theme-change';
import { appConfig, Theme } from './configs/app.settings';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import 'animate.css';
import { appUpdater } from './configs/app.updater';
import logger from './configs/app.logger';
import { handleSyncData } from './configs/app.data';
import { App } from '@capacitor/app';

// Initialize dayjs plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);

// Global variable
window.$ = $;
window.showToast = showToast;
window.closeToast = closeToast;
window.formatDate = formatDate;
window.getDateTime = getDateTime;
window.formatCurrency = formatCurrency;
window.Query = Query;
window.appConfig = appConfig;
defineCustomElements(window);

// Helper handlebars
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);

// Set theme
themeChange();

(async () => {
  logger.init(); // Init logger

  // Init database
  try {
    await NoSqliteInit([SpendListModel, SpendItemModel, NoteModel, IncomeModel]);
  } catch (e) {
    logger('Error init database: ', e);
  }

  // Init social login
  await SocialLogin.initialize({
    google: {
      webClientId: __GOOGLE_CLIENT_ID__,
    },
  });

  // Load default page when start
  pageManager.show(appConfig.general.defaultPage);
})();

// Minimize app when back button is pressed
App.addListener('backButton', () => {
  App.minimizeApp();
});

document.addEventListener('DOMContentLoaded', async () => {
  // check auto update
  if (appConfig.general.autoUpdate) appUpdater();
  // check auto sync
  if (appConfig.general.autoSync) handleSyncData();
  // change theme when start
  $('.theme-controller')
    .prop('checked', $('html').attr('data-theme') === 'light')
    .on('change', () => (appConfig.general.theme = $('html').attr('data-theme') as Theme));
});
