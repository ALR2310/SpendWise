import { SocialLogin } from '@capgo/capacitor-social-login';
import { drive } from './google.drive';
import { Query, QueryAll } from '~/configs/nosql/db.wrapper';
import pako from 'pako';
import { appSettings } from '~/configs/app.settings';
import dayjs from 'dayjs';
import { compare } from 'compare-versions';

let accessToken: any = null;

export async function backupData(): Promise<
  | { success: boolean; message: string; error?: undefined }
  | { success: boolean; message: string; error: unknown }
> {
  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' }))
    .isLoggedIn;

  if (isLogin) {
    accessToken = (
      await SocialLogin.getAuthorizationCode({ provider: 'google' })
    ).accessToken;
  } else
    return {
      success: false,
      message: 'not logged in',
    };

  drive.setAccessToken(accessToken);

  try {
    // remove old backup file
    const listOldFiles = await drive.get({ spaces: 'appDataFolder' });
    for (const file of listOldFiles.data.files) await drive.delete(file.id);

    // get data for backup
    const [spendList, spendItem, note] = await QueryAll([
      { sql: 'SELECT * FROM SpendList' },
      { sql: 'SELECT * FROM SpendItem' },
      { sql: 'SELECT * FROM Note' },
    ]);

    // compress data
    const spendData = { spendList, spendItem, note };
    const data = JSON.stringify(spendData, null, 2);
    const compressedData = pako.gzip(data);

    // upload compressed data
    const result = await drive.upload({
      fileName: 'spendData.json.gz',
      mimeType: 'application/gzip',
      content: compressedData,
      appDataFolder: true,
    });
    appSettings.set('data.fileId', result.data.id);
    appSettings.set('data.lastBackup', dayjs().format('DD/MM/YYYY'));
    return { success: true, message: 'Sao lưu thành công' };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: 'Có lỗi trong quá trình sao lưu dữ liệu',
      error: err,
    };
  }
}

export async function syncData(): Promise<
  | { success: boolean; message: string; data?: undefined; error?: undefined }
  | { success: boolean; message: string; data: Blob; error?: undefined }
  | { success: boolean; message: string; error: any; data?: undefined }
> {
  const isLogin = (await SocialLogin.isLoggedIn({ provider: 'google' }))
    .isLoggedIn;

  if (isLogin) {
    accessToken = await SocialLogin.getAuthorizationCode({
      provider: 'google',
    });
  } else
    return {
      success: false,
      message: 'not logged in',
    };

  drive.setAccessToken(accessToken);

  let fileId = await appSettings.get('data.fileId');

  if (!fileId)
    fileId = (await drive.get({ spaces: 'appDataFolder' })).data.files[0].id;

  const result = await drive.download(fileId);
  if (!result.success) return result;

  const arrayBuffer = await result?.data?.arrayBuffer();
  if (!arrayBuffer) {
    return {
      success: false,
      message: 'Lỗi dữ liệu tải về',
    };
  }

  const decompressedData = pako.ungzip(new Uint8Array(arrayBuffer), {
    to: 'string',
  });
  const spendData = JSON.parse(decompressedData);

  console.log(spendData);

  return {
    success: true,
    message: 'Đồng bộ dữ liệu thành công',
  };
}

interface SpendData {
  V1: {
    spendingList: {
      forEach(arg0: (item: SpendData['V1']['spendingList']) => void): unknown;
      id: number;
      namelist: string;
      atcreate: string;
      atupdate: string;
      lastentry: string;
      status: number;
    };
    spendingItem: {
      forEach(arg0: (item: SpendData['V1']['spendingItem']) => void): unknown;
      id: number;
      spendlistid: string;
      nameitem: string;
      price: number;
      details: string;
      atcreate: string;
      atupdate: string;
      status: number;
    };
    noted: {
      forEach(arg0: (item: SpendData['V1']['noted']) => void): unknown;
      id: number;
      namelist: string;
      content: string;
      atcreate: string;
      atupdate: string;
      status: number;
    };
  };
  V2: {
    SpendList: {
      _id: string;
      name: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      _v: number;
    };
    SpendItem: {
      _id: string;
      listId: string;
      name: string;
      price: number;
      details: string;
      status: string;
      date: string;
      createdAt: string;
      updatedAt: string;
      _v: number;
    };
    Note: {
      _id: string;
      name: string;
      content: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      _v: number;
    };
  };
}

export async function importData(data: any) {
  const version = await appSettings.get('general.version');

  if (compare('0.0.0', version, '<=')) {
    const spendData: SpendData['V1'] = data;
    try {
      await QueryAll([
        { sql: 'DELETE FROM SpendItem' },
        { sql: 'DELETE FROM SpendList' },
        { sql: 'DELETE FROM Note' },
      ]);

      Query('VACUUM');

      let spendListQueries: any[] = [];
      let spendItemQueries: any[] = [];
      let noteQueries: any[] = [];

      spendData.spendingList.forEach(
        (item: SpendData['V1']['spendingList']) => {
          spendListQueries.push({
            sql: 'INSERT INTO SpendList (_id, name, status, createdAt, updatedAt, _v) VALUES (?, ?, ?, ?, ?, ?)',
            params: [
              item.id,
              item.namelist,
              item.status == 1 ? 'Active' : 'Inactive',
              item.atcreate,
              item.atupdate,
              0,
            ],
          });
        },
      );

      spendData.spendingItem.forEach(
        (item: SpendData['V1']['spendingItem']) => {
          spendItemQueries.push({
            sql: `INSERT INTO SpendItem (_id, listId, name, price, details, status, date, createdAt, updatedAt, _v)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
              item.id,
              item.spendlistid,
              item.nameitem,
              item.price,
              item.details,
              item.status == 1 ? 'Active' : 'Inactive',
              item.atupdate,
              item.atcreate,
              item.atupdate,
              0,
            ],
          });
        },
      );

      spendData.noted.forEach((item: SpendData['V1']['noted']) => {
        noteQueries.push({
          sql: `INSERT INTO Note (_id, name, content, status, createdAt, updatedAt, _v)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          params: [
            item.id,
            item.namelist,
            item.content,
            item.status == 1 ? 'Active' : 'Inactive',
            item.atcreate,
            item.atupdate,
            0,
          ],
        });
      });

      if (spendListQueries.length > 0) await QueryAll(spendListQueries);
      if (spendItemQueries.length > 0) await QueryAll(spendItemQueries);
      if (noteQueries.length > 0) await QueryAll(noteQueries);

      return {
        success: true,
        message: 'Nhập dữ liệu thành công',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Có lỗi khi nhập dữ liệu',
      };
    }
  } else if (compare('1.0.0', version, '<=')) {
    // execute other func for version 2
  }
}

export async function exportData() {
  const version = await appSettings.get('general.version');

  const [spendList, spendItem, note] = await QueryAll([
    { sql: 'SELECT * FROM SpendList' },
    { sql: 'SELECT * FROM SpendItem' },
    { sql: 'SELECT * FROM Note' },
  ]);

  if (compare('0.0.0', version, '<=')) {
    const today = dayjs().toISOString();

    const spendingList: SpendData['V1']['spendingList'] = spendList.map(
      (item: SpendData['V2']['SpendList']) => ({
        id: item._id,
        namelist: item.name,
        atcreate: item.createdAt,
        atupdate: item.createdAt,
        lastentry: today,
        status: item.status == 'Active' ? 1 : 0,
      }),
    );

    const spendingItem: SpendData['V1']['spendingItem'] = spendItem.map(
      (item: SpendData['V2']['SpendItem']) => ({
        id: item._id,
        spendlistid: item.listId,
        nameitem: item.name,
        price: item.price,
        details: item.details,
        atcreate: item.createdAt,
        atupdate: item.createdAt,
        status: item.status == 'Active' ? 1 : 0,
      }),
    );

    const noted: SpendData['V1']['noted'] = note.map(
      (item: SpendData['V2']['Note']) => ({
        id: item._id,
        namelist: item.name,
        content: item.content,
        atcreate: item.createdAt,
        atupdate: item.createdAt,
        status: item.status == 'Active' ? 1 : 0,
      }),
    );

    return { spendingList, spendingItem, noted };
  } else if (compare('1.0.0', version, '<=')) {
  }
}
