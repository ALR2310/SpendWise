import { drive } from './google.drive';
import { Query, QueryAll } from '~/configs/nosql/db.wrapper';
import pako from 'pako';
import { appConfig } from '~/configs/app.settings';
import dayjs from 'dayjs';
import { filter } from 'lodash';
import { fixDate } from './utils';

export async function backupData(accessToken: string) {
  if (!drive.getAccessToken()) drive.setAccessToken(accessToken);

  try {
    // remove old backup file
    const listOldFiles = await drive.get({ spaces: 'appDataFolder' });
    for (const file of listOldFiles.data.files) await drive.delete(file.id);

    // get data for backup
    const spendWise = await exportData();

    // compress data
    const dataStr = JSON.stringify(spendWise, null, 2);
    const compressedData = pako.gzip(dataStr);

    // upload compressed data
    const result = await drive.upload({
      fileName: 'SpendWise.json.gz',
      mimeType: 'application/gzip',
      content: compressedData,
      appDataFolder: true,
    });

    // save info
    appConfig.data.fileId = result.data.id;
    appConfig.data.dateBackup = dayjs().toISOString();
    return { success: true, message: 'Backup data successfully' };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: 'An error occurred when backing up data',
      error: err,
    };
  }
}

export async function syncData(accessToken: string) {
  if (!drive.getAccessToken()) drive.setAccessToken(accessToken);

  // get Id file backup
  let fileId = appConfig.data.fileId;
  if (!fileId) fileId = (await drive.get({ spaces: 'appDataFolder' })).data.files[0].id;

  // download file backup
  const result = await drive.download(fileId);
  if (!result.success) return result;

  // convert data
  const arrayBuffer = await result?.data?.arrayBuffer();
  if (!arrayBuffer) {
    return {
      success: false,
      message: 'An error occurred when downloading data',
    };
  }

  // decompress data
  const decompressedData = pako.ungzip(new Uint8Array(arrayBuffer), {
    to: 'string',
  });
  const spendData = JSON.parse(decompressedData);

  // import data
  let importResult: any;
  const dateSync = dayjs(appConfig.data.dateSync);
  if (!dateSync.isValid()) {
    importResult = await importData(spendData);
  } else {
    // filter data
    const filterData = (data: any[], dateSync: dayjs.Dayjs) => {
      return filter(data, (item: any) => {
        const updateDate = dayjs(item.updatedAt);
        return updateDate.isValid() && updateDate.isAfter(dateSync);
      });
    };

    importResult = await importData({
      SpendList: filterData(spendData.SpendList, dateSync),
      SpendItem: filterData(spendData.SpendItem, dateSync),
      Note: filterData(spendData.Note, dateSync),
      Income: filterData(spendData.Income, dateSync),
    });
  }

  if (importResult.success) {
    appConfig.data.dateSync = dayjs().toISOString();
    return {
      success: true,
      message: 'Sync data successfully',
    };
  }

  return {
    success: false,
    message: 'An error occurred when sync data',
  };
}

interface SpendData {
  V1: {
    spendingList: {
      id: number;
      namelist: string;
      atcreate: string;
      atupdate: string;
      lastentry: string;
      status: number;
    };
    spendingItem: {
      id: number;
      spendlistid: number;
      nameitem: string;
      price: number;
      details: string;
      atcreate: string;
      atupdate: string;
      status: number;
    };
    noted: {
      id: number;
      namelist: string;
      content: string;
      atcreate: string;
      atupdate: string;
      status: number;
    };
    income: {
      id: number;
      spendlistid: number;
      price: number;
      atcreate: string;
      atupdate: string;
      status: number;
    };
    version: number;
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
    Income: {
      _id: string;
      listId: string;
      name: string;
      price: number;
      status: string;
      date: string;
      createdAt: string;
      updatedAt: string;
      _v: number;
    };
    Version?: number;
  };
}

export async function importData(data: any, removeOldData = false): Promise<{ success: boolean; message: string }> {
  let spendData = data;

  // Old format data
  if (data.spendingList) spendData = convertData(data);

  try {
    if (removeOldData) {
      await QueryAll([
        { sql: 'DELETE FROM SpendItem' },
        { sql: 'DELETE FROM SpendList' },
        { sql: 'DELETE FROM Note' },
        { sql: 'DELETE FROM Income' },
      ]);
      await Query('VACUUM');
    }

    const spendListQueries: any[] = [];
    const spendItemQueries: any[] = [];
    const noteQueries: any[] = [];
    const incomeQueries: any[] = [];

    for (const i of spendData?.SpendList ?? []) {
      const [createdAt, updatedAt] = fixDate([i.createdAt, i.updatedAt]);
      if (!createdAt || !updatedAt) throw new Error('Error date on record:' + JSON.stringify(i, null, 2));

      spendListQueries.push({
        sql: 'INSERT INTO SpendList (_id, name, status, createdAt, updatedAt, _v) VALUES (?, ?, ?, ?, ?, ?)',
        params: [i._id, i.name, i.status, createdAt, updatedAt, i._v],
      });
    }

    for (const i of spendData?.SpendItem ?? []) {
      const [createdAt, updatedAt, date] = fixDate([i.createdAt, i.updatedAt, i.date]);
      if (!updatedAt || !date) throw new Error('Error date on record:' + JSON.stringify(i, null, 2));

      spendItemQueries.push({
        sql: `INSERT INTO SpendItem (_id, listId, name, price, details, status, date, createdAt, updatedAt, _v)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [i._id, i.listId, i.name, i.price, i.details, i.status, date, createdAt ?? updatedAt, updatedAt, i._v],
      });
    }

    for (const i of spendData?.Note ?? []) {
      const [createdAt, updatedAt] = fixDate([i.createdAt, i.updatedAt]);
      if (!createdAt || !updatedAt) throw new Error('Error date on record:' + JSON.stringify(i, null, 2));

      noteQueries.push({
        sql: `INSERT INTO Note (_id, name, content, status, createdAt, updatedAt, _v)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [i._id, i.name, i.content, i.status, createdAt, updatedAt, i._v],
      });
    }

    for (const i of spendData?.Income ?? []) {
      const [createdAt, updatedAt, date] = fixDate([i.createdAt, i.updatedAt, i.date]);
      if (!createdAt || !updatedAt || !date) throw new Error('Error date on record:' + JSON.stringify(i, null, 2));

      incomeQueries.push({
        sql: `INSERT INTO Income (_id, listId, name, price, status, date, createdAt, updatedAt, _v)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [i._id, i.listId, i.name, i.price, i.status, date, createdAt, updatedAt, i._v],
      });
    }

    if (spendListQueries.length > 0) await QueryAll(spendListQueries);
    if (spendItemQueries.length > 0) await QueryAll(spendItemQueries);
    if (noteQueries.length > 0) await QueryAll(noteQueries);
    if (incomeQueries.length > 0) await QueryAll(incomeQueries);

    return {
      success: true,
      message: 'Import data successfully',
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: 'An error occurred when importing data',
    };
  }
}

export async function exportData() {
  const [SpendList, SpendItem, Note, Income] = await QueryAll([
    { sql: 'SELECT * FROM SpendList' },
    { sql: 'SELECT * FROM SpendItem' },
    { sql: 'SELECT * FROM Note' },
    { sql: 'SELECT * FROM Income' },
  ]);

  return { SpendList, SpendItem, Note, Income };
}

function convertData(data: any): SpendData['V2'] {
  const SpendList: SpendData['V2']['SpendList'] = data.spendingList.map((item: SpendData['V1']['spendingList']) => ({
    _id: item.id,
    name: item.namelist,
    status: item.status == 1 ? 'Active' : 'Inactive',
    createdAt: item.atcreate,
    updatedAt: item.atupdate,
    _v: 0,
  }));

  const SpendItem: SpendData['V2']['SpendItem'] = data.spendingItem.map((item: SpendData['V1']['spendingItem']) => ({
    _id: item.id,
    listId: item.spendlistid,
    name: item.nameitem,
    price: item.price,
    details: item.details,
    date: item.atupdate,
    createdAt: item.atcreate,
    updatedAt: item.atupdate,
    status: item.status == 1 ? 'Active' : 'Inactive',
    _v: 0,
  }));

  const Note: SpendData['V2']['Note'] = data.noted.map((item: SpendData['V1']['noted']) => ({
    _id: item.id,
    name: item.namelist,
    content: item.content,
    createdAt: item.atcreate,
    updatedAt: item.atupdate,
    status: item.status == 1 ? 'Active' : 'Inactive',
    _v: 0,
  }));

  const Income: SpendData['V2']['Income'] = data.income.map((item: SpendData['V1']['income']) => ({
    _id: item.id,
    listId: item.spendlistid,
    name: '',
    price: item.price,
    status: item.status == 1 ? 'Active' : 'Inactive',
    date: item.atupdate,
    createdAt: item.atcreate,
    updatedAt: item.atupdate,
    _v: 0,
  }));

  return { SpendList, SpendItem, Note, Income };
}
