import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { backupData, exportData, importData, syncData } from '~/common/data.backup';
import { showToast } from '~/common/utils';
import download from 'downloadjs';
import { Toast } from '@capacitor/toast';
import { appConfig, Theme } from '~/configs/app.settings';
import dayjs from 'dayjs';
import $ from 'jquery';
import '~/common/jquery.custom';

// Initialize the custom select
document.querySelectorAll('div.select').forEach((select) => {
  $(select).selectControl('init');
});

// Setting change theme
$('#setting_general-theme').selectControl('set', appConfig.general.theme);
$('#setting_general-theme').selectControl('change', function (value: string) {
  appConfig.general.theme = value as Theme;
  localStorage.setItem('theme', appConfig.general.theme);
  window.location.reload();
});

$('#setting_data-login').on('click', async () => {
  await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.appdata',
      ],
      disableOneTap: true,
    },
  });

  $('#login-button-container').hide();
  $('#logout-button-container').show();
});

$('#setting_data-logout').on('click', async () => {
  await SocialLogin.logout({ provider: 'google' });

  $('#login-button-container').show();
  $('#logout-button-container').hide();
});

(async () => {
  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' })).isLoggedIn;

  if (isLogin) {
    $('#login-button-container').hide();
    $('#logout-button-container').show();

    console.log(await SocialLogin.getAuthorizationCode({ provider: 'google' }));
  }
})();

// Backup data
$('#setting_data-backup').on('click', async function () {
  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');

  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' })).isLoggedIn;

  if (!isLogin) {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
    return showToast('Please login to use this feature', 'warning');
  }

  const accessToken = (await SocialLogin.getAuthorizationCode({ provider: 'google' })).accessToken;

  const result = await backupData(accessToken!);
  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
  showToast(result.message, result.success ? 'success' : 'error');
});

// Sync data
$('#setting_data-sync').on('click', async function () {
  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' })).isLoggedIn;

  if (!isLogin) {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
    return showToast('Please login to use this feature', 'warning');
  }

  const accessToken = (await SocialLogin.getAuthorizationCode({ provider: 'google' })).accessToken;

  const result = await syncData(accessToken!);
  showToast(result.message, result.success ? 'success' : 'error');
  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
});

// Export data
$('#setting_data-export').on('click', async function () {
  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-file-export fa-spin fa-loader');
  const spendData = await exportData();
  const spendDataStr = JSON.stringify(spendData, null, 2);

  try {
    if (Capacitor.getPlatform() == 'web') {
      const blob = new Blob([spendDataStr], {
        type: 'application/json;charset=utf-8',
      });
      download(blob, 'SpendWise.json', 'application/json');
    } else {
      const result = await Filesystem.writeFile({
        path: 'SpendWise.json',
        data: spendDataStr,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      appConfig.data.dateBackup = dayjs().toISOString();

      await Toast.show({
        text: 'File saved at ' + result.uri,
        duration: 'long',
      });
    }

    showToast('Export data successfully', 'success');
  } catch (e) {
    console.error(e);
    showToast('An error occurred when exporting data', 'error');
  } finally {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-file-export fa-spin fa-loader');
  }
});

// Import data
$('#setting_data-import').on('click', async function () {
  const result = await FilePicker.pickFiles({
    limit: 1,
    readData: true,
  });

  $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');

  const base64Data = result.files[0].data;
  if (!base64Data) return { success: false, message: 'An error occurred when importing data' };

  try {
    const textDecoder = new TextDecoder();
    const decodedContent = textDecoder.decode(Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)));
    const data = JSON.parse(decodedContent);
    const result = await importData(data, true);
    showToast(result.message, result.success ? 'success' : 'error');
  } catch (e) {
    console.error(e);
    showToast('An error occurred when importing data', 'error');
  } finally {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
  }
});

export {};
