import { CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { compareVersions } from 'compare-versions';
import { showToast } from '~/common/utils';
import $ from 'jquery';
import { confirmBox } from '~/common/confirm.box';

export async function appUpdater() {
  const progressBar = $('#download-update-progress');

  try {
    // Get latest release
    const getLatestRelease = await CapacitorHttp.get({
      url: `${__GIT_API_URL__}/releases/latest`,
      headers: {
        Authorization: `token ${__GIT_ACCESS_TOKEN__}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (getLatestRelease.status !== 200) {
      return showToast('Failed to check for updates', 'error');
    }

    // Get version and compare
    const latestVersion = getLatestRelease.data.tag_name.replace('v', '');
    const currentVersion = __APP_VERSION__;
    const isLatest = compareVersions(latestVersion, currentVersion);

    if (isLatest == 0) {
      const allowDownload = await confirmBox({
        message: 'Có bản cập nhật mới, bạn có muốn tải về và cập nhật không?',
        buttonOk: {
          color: 'success',
        },
      });
      if (!allowDownload) return;

      const findAsset: any = getLatestRelease.data.assets.find((asset: any) => asset.name.endsWith('.apk'));
      const downloadUrl = findAsset.browser_download_url;

      // Add listener
      const listener = await Filesystem.addListener('progress', (progress) => {
        const { bytes, contentLength } = progress;
        const percentage = ((bytes / contentLength) * 100).toFixed(2);
        progressBar.removeClass('hidden').find('progress').attr('value', percentage);
      });

      // Download file
      await Filesystem.downloadFile({
        url: downloadUrl,
        recursive: true,
        directory: Directory.Documents,
        path: `../Download/${findAsset.name}`,
        progress: true,
      });

      const allowInstall = await confirmBox({
        message: 'Tải xuống hoàn tất, bạn có muốn cài đặt không?',
        buttonOk: {
          color: 'success',
        },
      });
      if (!allowInstall) return;

      // Get file uri
      const fileUri = (
        await Filesystem.getUri({
          directory: Directory.Documents,
          path: `../Download/${findAsset.name}`,
        })
      ).uri;

      // Remove listener
      listener.remove();

      // Open file
      await FileOpener.openFile({
        path: fileUri,
        mimeType: 'application/vnd.android.package-archive',
      });
    }
  } catch (e) {
    console.log(e);
    showToast('Failed to download update', 'error');
  } finally {
    progressBar.addClass('hidden');
  }
}
