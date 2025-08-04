import { CapacitorHttp } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { compareVersions } from 'compare-versions';

import { confirm } from '~/hooks/useConfirm';
import { toast } from '~/hooks/useToast';

export async function checkFileExists(path: string, directory: Directory = Directory.Documents): Promise<boolean> {
  try {
    await Filesystem.stat({ directory: directory, path });
    return true;
  } catch {
    return false;
  }
}

export async function getFileUri(path: string, directory: Directory = Directory.Documents): Promise<string> {
  const result = await Filesystem.getUri({ directory: directory, path });
  return result.uri;
}

export async function downloadFile({
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
    const res = await CapacitorHttp.get({
      url: `${import.meta.env.VITE_GIT_API_URL}/releases/latest`,
      headers: {
        Authorization: `token ${import.meta.env.VITE_GIT_ACCESS_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status !== 200) return toast.error('Failed to check update');

    const data = res.data;
    const latestVersion = data.tag_name.replace('v', '');
    const isLatest = compareVersions(latestVersion, __APP_VERSION__);

    if (isLatest !== 1) return;

    const allowDownload = await confirm({
      title: 'New version available',
      content: `A new version (${latestVersion}) is available. Do you want to download it?`,
    });
    if (!allowDownload) return;

    const assetInfo = data.assets.find((a: any) => a.name.endsWith('.apk'));
    const fileName = assetInfo.name;
    const downloadUrl = assetInfo.browser_download_url;

    const [fileUri, exists] = await Promise.all([getFileUri(fileName), checkFileExists(fileName)]);
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
