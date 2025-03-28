import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { backupData, exportData, importData, syncData } from '~/configs/app.data';
import { showToast } from '~/common/toast';
import download from 'downloadjs';
import { Toast } from '@capacitor/toast';
import { appConfig, Language, Page, Theme } from '~/configs/app.settings';
import dayjs from 'dayjs';
import $ from 'jquery';
import '~/common/jquery.custom';
import { appUpdater } from '~/configs/app.updater';
import templateBuilder from '~/common/template.builder';
import template from '~/page/setting.hbs';
import driveIcon from '~/assets/images/drive.png';
import { googleAuthenticate } from '~/configs/app.auth';

// When module loaded
async function settingOnLoad() {
  $('#page-setting').html(
    templateBuilder(template, {
      driveIcon,
      appVersion: __APP_VERSION__,
    }),
  );

  // Global variable
  window.settingOnLoad = settingOnLoad;

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

  // Setting change default page
  $('#setting_general-page').selectControl('set', appConfig.general.defaultPage);
  $('#setting_general-page').selectControl('change', function (value: string) {
    appConfig.general.defaultPage = value as Page;
  });

  // Setting change language
  $('#setting_general-language').selectControl('set', appConfig.general.language);
  $('#setting_general-language').selectControl('change', function (value: Language) {
    appConfig.general.language = value;
    window.location.reload();
  });

  // Setting auto update
  $('#setting_general-update').prop('checked', appConfig.general.autoUpdate);
  $('#setting_general-update').on('change', function () {
    appConfig.general.autoUpdate = $(this).prop('checked');
  });

  // Setting auto sync
  $('#setting_data-auto-sync').prop('checked', appConfig.general.autoSync);
  $('#setting_data-auto-sync').on('change', function () {
    appConfig.general.autoSync = $(this).prop('checked');
  });

  // Setting auto backup
  $('#setting_data-auto-backup').prop('checked', appConfig.general.autoBackup);
  $('#setting_data-auto-backup').on('change', function () {
    appConfig.general.autoBackup = $(this).prop('checked');
  });

  // Button login
  $('#setting_data-login').on('click', async () => {
    await googleAuthenticate.login();

    $('#login-button-container').hide();
    $('#logout-button-container').show();
  });

  // Button logout
  $('#setting_data-logout').on('click', async () => {
    const result = await googleAuthenticate.logout();

    showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      $('#login-button-container').show();
      $('#logout-button-container').hide();
    }
  });

  (async () => {
    const isLogged = (await googleAuthenticate.isLoggedIn()).success;

    if (isLogged) {
      $('#login-button-container').hide();
      $('#logout-button-container').show();
    }
  })();

  // Backup data
  $('#setting_data-backup').on('click', async function () {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');

    const isLogged = (await googleAuthenticate.isLoggedIn()).success;

    if (!isLogged) {
      $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
      return showToast('Please login to use this feature', 'warning');
    }

    const accessToken = (await googleAuthenticate.getAccessToken()).data.access_token;

    const result = await backupData(accessToken);
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
    showToast(result.message, result.success ? 'success' : 'error');
  });

  // Sync data
  $('#setting_data-sync').on('click', async function () {
    $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
    const isLogged = (await googleAuthenticate.isLoggedIn()).success;

    if (!isLogged) {
      $(this).toggleClass('btn-disabled').find('i').toggleClass('fa-spin fa-loader');
      return showToast('Please login to use this feature', 'warning');
    }

    const accessToken = (await googleAuthenticate.getAccessToken()).data.access_token;

    const result = await syncData(accessToken);
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

  // Check update
  $('#setting_data-check-update').on('click', () => appUpdater());
}

settingOnLoad();

export {};
