import { CapacitorHttp } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { compareVersions } from 'compare-versions';

import { confirm } from '~/hooks/useConfirm';
import { toast } from '~/hooks/useToast';

async function checkFileExists(path: string, directory: Directory | 'DOWNLOADS' = Directory.Cache): Promise<boolean> {
  try {
    if (directory === 'DOWNLOADS') {
      directory = Directory.Documents;
      path = `../Download/${path}`;
    }

    await Filesystem.stat({ directory, path });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function getFileUri(path: string, directory: Directory | 'DOWNLOADS' = Directory.Cache): Promise<string> {
  if (directory === 'DOWNLOADS') {
    const result = await Filesystem.getUri({ directory: Directory.Documents, path });
    return result.uri.replace('Documents', 'Download');
  }

  const result = await Filesystem.getUri({ directory, path });
  return result.uri;
}

async function downloadFile({
  url,
  path,
  onProgress,
}: {
  url: string;
  path: string;
  onProgress?: (percent: number) => void;
}) {
  const listener = await FileTransfer.addListener('progress', (progress) => {
    const { bytes, contentLength } = progress;
    const percentage = (bytes / contentLength) * 100;
    onProgress?.(percentage);
  });

  try {
    await FileTransfer.downloadFile({
      url,
      path,
      progress: true,
    });
  } catch (e) {
    console.error(e);
  } finally {
    listener.remove();
  }
}

export async function checkAndUpdateApp({ onProgress }: { onProgress?: (percent: number) => void }) {
  try {
    let res = await CapacitorHttp.get({
      url: `${import.meta.env.VITE_GIT_API_URL}/releases/latest`,
      headers: {
        Authorization: `token ${import.meta.env.VITE_GIT_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status !== 200) {
      res = await CapacitorHttp.get({
        url: `${import.meta.env.VITE_GIT_API_URL}/releases?per_page=1`,
        headers: {
          Authorization: `token ${import.meta.env.VITE_GIT_ACCESS_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.status !== 200) return toast.info('No new version available');
    }

    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    const latestVersion = data.tag_name.replace('v', '');
    const isUpdateAvailable = compareVersions(latestVersion, __APP_VERSION__);

    if (isUpdateAvailable !== 1) return;

    const allowDownload = await confirm({
      title: 'New version available',
      content: `A new version (${latestVersion}) is available. Do you want to download it?`,
    });
    if (!allowDownload) return;

    const assetInfo = data.assets.find((a: any) => a.name.endsWith('.apk'));
    const fileName = assetInfo.name;
    const downloadUrl = assetInfo.browser_download_url;

    const [fileUri, exists] = await Promise.all([
      getFileUri(fileName, 'DOWNLOADS'),
      checkFileExists(fileName, 'DOWNLOADS'),
    ]);
    if (!exists) await downloadFile({ url: downloadUrl, path: fileUri, onProgress });

    const allowInstall = await confirm({
      title: 'Install update',
      content: 'Download complete. Do you want to install?',
    });
    if (!allowInstall) return;

    await FileOpener.openFile({
      path: fileUri,
      mimeType: 'application/vnd.android.package-archive',
    });
  } catch (e) {
    console.error(e);
    toast.error('Something went wrong');
  }
}

export async function cleanCache(name?: string, directory: Directory = Directory.Cache) {
  try {
    const result = await Filesystem.readdir({ directory, path: '' });

    for (const file of result.files) {
      const matchesName = name ? file.name.includes(name) : true;
      if (matchesName) await Filesystem.deleteFile({ directory, path: file.name });
    }

    return { success: true, message: 'Clean cache successfully' };
  } catch (e: any) {
    console.error(e);
    return { success: false, message: e.message };
  }
}
