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

  const version = appSettings.get('general.version');

  try {
    if (compare(version, '0.0.0', '>=')) {
      // remove old backup file
      const listOldFiles = await drive.get({ spaces: 'appDataFolder' });
      for (const file of listOldFiles.data.files) await drive.delete(file.id);

      // get data for backup
      const [spendList, spendItem, note] = await QueryAll([
        { sql: 'SELECT * FROM SpendList' },
        { sql: 'SELECT * FROM SpendItem' },
        { sql: 'SELECT * FROM Note' },
      ]);

      // convert and compress data
      const spendData = convertData({ spendList, spendItem, note }, 'V2', 'V1');
      const dataStr = JSON.stringify(spendData, null, 2);
      const compressedData = pako.gzip(dataStr);

      // upload compressed data
      const result = await drive.upload({
        fileName: 'spendData.json.gz',
        mimeType: 'application/gzip',
        content: compressedData,
        appDataFolder: true,
      });

      // save info
      appSettings.set('data.fileId', result.data.id);
      appSettings.set('data.lastBackup', dayjs().toISOString());
      return { success: true, message: 'Sao lưu thành công' };
    } else if (compare(version, '1.0.0', '>=')) {
      return { success: false, message: 'Version is not supported' };
    } else {
      return { success: false, message: 'Version is not supported' };
    }
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
  const version = appSettings.get('general.version');

  if (compare(version, '0.0.0', '>=')) {
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
  } else if (compare(version, '1.0.0', '>=')) {
    // execute other func for version 2
  }
}

export async function exportData() {
  const version = appSettings.get('general.version');

  const [spendList, spendItem, note] = await QueryAll([
    { sql: 'SELECT * FROM SpendList' },
    { sql: 'SELECT * FROM SpendItem' },
    { sql: 'SELECT * FROM Note' },
  ]);

  if (compare(version, '0.0.0', '>=')) {
    const result = convertData({ spendList, spendItem, note }, 'V2', 'V1');
    return result;
  }

  return { spendList, spendItem, note };
}

function convertData(data: any, input: 'V1' | 'V2', output: 'V1' | 'V2') {
  if (input == output) return data;

  if (input == 'V1' && output == 'V2') {
    const spendList: SpendData['V2']['SpendList'] = data.spendingList.map(
      (item: SpendData['V1']['spendingList']) => ({
        _id: item.id,
        name: item.namelist,
        status: item.status == 1 ? 'Active' : 'Inactive',
        createdAt: item.atcreate,
        updatedAt: item.atupdate,
        _v: 0,
      }),
    );

    const spendItem: SpendData['V2']['SpendItem'] = data.spendingItem.map(
      (item: SpendData['V1']['spendingItem']) => ({
        _id: item.id,
        listId: item.spendlistid,
        name: item.nameitem,
        price: item.price,
        details: item.details,
        createdAt: item.atcreate,
        updatedAt: item.atupdate,
        status: item.status == 1 ? 'Active' : 'Inactive',
        _v: 0,
      }),
    );

    const note: SpendData['V2']['Note'] = data.noted.map(
      (item: SpendData['V1']['noted']) => ({
        _id: item.id,
        name: item.namelist,
        content: item.content,
        createdAt: item.atcreate,
        updatedAt: item.atupdate,
        status: item.status == 1 ? 'Active' : 'Inactive',
        _v: 0,
      }),
    );

    return { spendList, spendItem, note };
  } else if (input == 'V2' && output == 'V1') {
    const today = dayjs().toISOString();

    const spendingList: SpendData['V1']['spendingList'] = data.spendList.map(
      (item: SpendData['V2']['SpendList']) => ({
        id: item._id,
        namelist: item.name,
        atcreate: item.createdAt,
        atupdate: item.createdAt,
        lastentry: today,
        status: item.status == 'Active' ? 1 : 0,
      }),
    );

    const spendingItem: SpendData['V1']['spendingItem'] = data.spendItem.map(
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

    const noted: SpendData['V1']['noted'] = data.note.map(
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
  }
}
