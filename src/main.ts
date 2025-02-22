import {
  formatCurrency,
  formatDate,
  getDateTime,
  showToast,
  closeToast,
} from './common/utils';
import $ from 'jquery';
import Handlebars from 'handlebars';
import { pageManager, themeIconChange } from './configs/page.manager';
import { NoSqliteInit, Query } from './configs/nosql/db.wrapper';
import {
  NoteModel,
  SpendItemModel,
  SpendListModel,
} from './configs/nosql/db.models';
import { SocialLogin } from '@capgo/capacitor-social-login';
// import { backupData } from './common/data.backup';
import { appSettings } from './configs/app.settings';

// Global variable
window.$ = $;
window.showToast = showToast;
window.closeToast = closeToast;
window.formatDate = formatDate;
window.getDateTime = getDateTime;
window.formatCurrency = formatCurrency;
window.Query = Query;

// Helper handlebars
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);

// Set theme
themeIconChange();

(async () => {
  // Init database
  await NoSqliteInit([SpendListModel, SpendItemModel, NoteModel]);
  // Init social login
  await SocialLogin.initialize({
    google: {
      webClientId:
        '292298338560-h9i7cv3nh68qvril0kdfe96cu5ttf87f.apps.googleusercontent.com',
    },
  });

  // backupData().then((res) => console.log(res));

  // Set version app when start
  appSettings.set('general.version', __APP_VERSION__);

  // console.log(await Query('SELECT * FROM sqlite_master'));
  // console.log(await Query('SELECT * FROM SpendList'));
  // console.log(await Query('SELECT * FROM SpendItem'));

  pageManager.show('setting');
})();
