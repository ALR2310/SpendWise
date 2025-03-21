import { CapacitorHttp } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { compareVersions } from 'compare-versions';
import { showToast } from '~/common/toast';
import $ from 'jquery';
import { confirmBox } from '~/common/confirm.box';
import logger from './app.logger';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

async function getFileUri(path: string): Promise<string | null> {
  try {
    const result = await Filesystem.stat({
      directory: Directory.Cache,
      path,
    });
    return result.uri;
  } catch (e) {
    return null;
  }
}

async function downloadFile(pathSave: string, urlFile: string): Promise<string | null> {
  const progressBar = $('#download-update-progress');

  const listener = await Filesystem.addListener('progress', (progress) => {
    const { bytes, contentLength } = progress;
    const percentage = ((bytes / contentLength) * 100).toFixed(2);
    progressBar.removeClass('hidden').find('progress').attr('value', percentage);
  });

  try {
    await Filesystem.downloadFile({
      url: urlFile,
      recursive: true,
      directory: Directory.Cache,
      path: pathSave,
      progress: true,
    });

    return await getFileUri(pathSave);
  } catch (e) {
    console.log(e);
    showToast('Failed to download update', 'error');
    logger('Failed to download update', e);
    throw e;
  } finally {
    listener.remove();
    progressBar.addClass('hidden');
  }
}

export async function appUpdater() {
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
      logger('Failed to check for updates', getLatestRelease);
      return showToast('Failed to check for updates', 'error');
    }

    // Get version and compare
    const latestVersion = getLatestRelease.data.tag_name.replace('v', '');
    const currentVersion = __APP_VERSION__;
    const isLatest = compareVersions(latestVersion, currentVersion);

    if (isLatest == 1) {
      const allowDownload = await confirmBox({
        message: 'Found new update, do you want to download and update?',
        buttonOk: {
          color: 'success',
        },
      });
      if (!allowDownload) return;

      const assetInfo: any = getLatestRelease.data.assets.find((asset: any) => asset.name.endsWith('.apk'));
      const downloadUrl = assetInfo.browser_download_url;
      const fileName = assetInfo.name;

      let fileUri = await getFileUri(fileName);

      if (!fileUri) {
        fileUri = await downloadFile(fileName, downloadUrl);
      }

      const allowInstall = await confirmBox({
        message: 'Download complete, do you want to install?',
        buttonOk: {
          color: 'success',
        },
      });
      if (!allowInstall) return;

      if (!fileUri) {
        return showToast('Cannot find the file', 'error');
      }

      await FileOpener.openFile({
        path: fileUri,
        mimeType: 'application/vnd.android.package-archive',
      });
    }
  } catch (e) {
    console.log(e);
    logger('Failed to check for updates', e);
    showToast('Failed to check for updates', 'error');
  }
}
