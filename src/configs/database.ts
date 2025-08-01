import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from 'jeep-sqlite/loader';

import { Platform } from '~/shared/enums/app.enum';

let dbInstance: SQLiteDBConnection;

const sqlite = new SQLiteConnection(CapacitorSQLite);

const createConnect = async () => {
  return await sqlite.createConnection('SpendWise', false, 'no-encryption', 1, false);
};

export async function database(): Promise<SQLiteDBConnection> {
  if (dbInstance) return dbInstance;

  try {
    if (Capacitor.getPlatform() === Platform.Web) {
      defineCustomElements(window);
      await sqlite.initWebStore();
    }

    const ret = await sqlite.checkConnectionsConsistency();
    if (!ret.result && Capacitor.getPlatform() == 'web') {
      dbInstance = await createConnect();
    }
    dbInstance = dbInstance ?? (await createConnect());

    await dbInstance.open();
    console.log('Connect to database successfully');

    return dbInstance;
  } catch (error) {
    console.error('Error when connect to database', error);
    throw error;
  }
}
