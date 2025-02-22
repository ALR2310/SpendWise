import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { backupData, exportData, importData } from '~/common/data.backup';
import { showToast } from '~/common/utils';
import download from 'downloadjs';

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
  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' }))
    .isLoggedIn;

  if (isLogin) {
    $('#login-button-container').hide();
    $('#logout-button-container').show();

    console.log(await SocialLogin.getAuthorizationCode({ provider: 'google' }));
  }
})();

// Backup data
$('#setting_data-backup').on('click', async function () {
  $(this).prop('disabled', true).find('i').toggleClass('fa-spin fa-loader');

  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' }))
    .isLoggedIn;

  if (!isLogin)
    return showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'warning');

  const result = await backupData();
  $(this).prop('disabled', false).find('i').toggleClass('fa-spin fa-loader');
  showToast(result.message, result.success ? 'success' : 'error');
});

// Export data
$('#setting_data-export').on('click', async function () {
  const spendData = await exportData();
  const spendDataStr = JSON.stringify(spendData, null, 2);

  try {
    if (Capacitor.getPlatform() == 'web') {
      const blob = new Blob([spendDataStr], {
        type: 'application/json;charset=utf-8',
      });
      download(blob, 'spendData.json', 'application/json');
    } else
      await Filesystem.writeFile({
        path: 'spendData.json',
        data: spendDataStr,
        directory: Directory.External,
        encoding: Encoding.UTF8,
      });

    showToast('Xuất dữ liệu thành công', 'success');
  } catch (e) {
    console.error(e);
    showToast('Có lỗi khi xuất dữ liệu', 'error');
  }
});

// Import data
$('#setting_data-import').on('click', async function () {
  const result = await FilePicker.pickFiles({
    limit: 1,
    readData: true,
  });

  const base64Data = result.files[0].data;
  if (!base64Data) return { success: false, message: 'Lỗi dữ liệu' };

  try {
    const textDecoder = new TextDecoder();
    const decodedContent = textDecoder.decode(
      Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)),
    );
    const data = JSON.parse(decodedContent);

    importData(data)
      .then((result) => {
        showToast(result!.message, result!.success ? 'success' : 'error');
      })
      .catch((e) => {
        console.error(e);
        showToast('Có lỗi khi nhập dữ liệu', 'error');
      });
  } catch (e) {
    console.error(e);
    showToast('Có lỗi khi nhập dữ liệu', 'error');
  }
});

export {};
