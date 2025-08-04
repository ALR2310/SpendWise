import { Network } from '@capacitor/network';
import dayjs from 'dayjs';
import i18n from 'i18next';
import pako from 'pako';

import { query } from '~/assets/libs/nosqlite';
import { expenseModel, noteModel } from '~/configs/model';
import { appSettings } from '~/configs/settings';
import { confirm } from '~/hooks/useConfirm';
import { ExpenseModel, ExpenseType } from '~/models/expenseModel';
import { NoteModel } from '~/models/noteModel';
import { googleAuth } from '~/services/googleAuth';
import { DriveFile, googleDrive } from '~/services/googleDrive';
import { formatBytes } from '~/shared/utils/general.utils';

export async function handleImportData(data: { expenses: ExpenseModel[]; notes: NoteModel[] }, deleteData?: boolean) {
  if (deleteData) {
    await query('DELETE FROM expense');
    await query('DELETE FROM note');
  }

  data = convertData(data);

  await expenseModel.insertMany(data.expenses);
  await noteModel.insertMany(data.notes);
}

export async function handleExportData() {
  const [expenses, notes] = await Promise.all([expenseModel.find(), noteModel.find()]);

  return { expenses, notes };
}

export function convertData(data: any): { expenses: ExpenseModel[]; notes: NoteModel[] } {
  if (data.spendingItem) {
    const expenses = data.spendingItem.map((item: any) => {
      const date = dayjs(item.atupdate).format('YYYY-MM-DD HH:mm:ss');
      return {
        name: item.nameitem,
        date: date,
        amount: item.price,
        type: ExpenseType.Expense,
        description: item.details == 'Không có thông tin' ? '' : item.details,
        recurring: false,
        createdAt: date,
        updatedAt: date,
      };
    });

    const notes = data.noted.map((item: any) => {
      const date = dayjs(item.atupdate).format('YYYY-MM-DD HH:mm:ss');
      return {
        title: item.namelist,
        content: item.content,
        createdAt: date,
        updatedAt: date,
      };
    });

    return { expenses, notes };
  } else return data;
}

async function prepareBackup() {
  // Check network
  const currentNetwork = await Network.getStatus();
  if (!currentNetwork.connected) throw new Error('No internet connection');

  // Check access token
  const accessToken = await googleAuth.getValidAccessToken();
  if (!accessToken.success || !accessToken.data) throw new Error('No valid access token');

  // Set access token for drive service
  googleDrive.initialize({ accessToken: accessToken.data });
}

export async function handleBackupData() {
  try {
    await prepareBackup();

    // Handle remove old files
    const backupFiles = await googleDrive.find({ spaces: 'appDataFolder', query: "name = 'spendwise.gzip'" });
    if (backupFiles.success) for (const file of backupFiles.data as DriveFile[]) await googleDrive.delete(file.id);

    // Get data from database
    const data = await handleExportData();
    const dataStr = JSON.stringify(data);
    const dataCompressed = pako.gzip(dataStr);

    const upload = await googleDrive.upload({
      fileName: `spendwise.gzip`,
      mimeType: 'application/gzip',
      content: dataCompressed,
      appDataFolder: true,
    });

    if (!upload.success) throw new Error(upload.message);

    // save info
    appSettings.data.fileId = upload.data!.id;
    appSettings.data.dateBackup = dayjs().format('YYYY-MM-DD HH:mm:ss');

    return { success: true, message: 'Backup successfully' };
  } catch (e: any) {
    console.log(e);
    return { success: false, message: e.message, error: e };
  }
}

export async function handleSyncData(options = { askBeforeReplace: false }) {
  const { askBeforeReplace } = options;
  const t = i18n.t;

  try {
    await prepareBackup();

    // Get backup file
    let fileId = appSettings.data.fileId;
    if (fileId) {
      const backupFiles = await googleDrive.find({ fileId });
      if (!backupFiles.success) throw new Error(backupFiles.message);
    } else {
      const backupFiles = await googleDrive.find({ spaces: 'appDataFolder', query: "name = 'spendwise.gzip'" });
      if (!backupFiles.success) throw new Error(backupFiles.message);
      fileId = (backupFiles.data as DriveFile[])[0].id;
    }

    const [download, localData] = await Promise.all([googleDrive.download(fileId), handleExportData()]);
    if (!download.success) throw new Error(download.message);

    const downloadSize = formatBytes(download.data?.byteLength ?? 0);
    const localDataStr = JSON.stringify(localData);
    const localCompressed = pako.gzip(localDataStr);
    const localDataSize = formatBytes(localCompressed.byteLength);

    if (askBeforeReplace) {
      const result = await confirm({
        title: 'Confirm',
        content: `
        <div>
          <p class="font-semibold">${t('settings.data.sync.confirm')}.</p>
          <p>New data size: <span class="text-primary">${downloadSize}</span> bytes</p>
          <p>Local data size: <span class="text-primary">${localDataSize}</span> bytes</p>
        </div>`,
        contentAsHTML: true,
        btnOk: { color: 'success' },
      });

      if (!result) return { success: false, message: 'Cancelled' };
    }

    // Decompress data
    const decompressed = pako.ungzip(download.data!, { to: 'string' });
    const data = JSON.parse(decompressed) as { expenses: ExpenseModel[]; notes: NoteModel[] };

    await handleImportData(data, true);

    appSettings.data.dateSync = dayjs().format('YYYY-MM-DD HH:mm:ss');

    return { success: true, message: 'Sync data success' };
  } catch (e: any) {
    console.log(e);
    return { success: false, message: e.message, error: e };
  }
}
