import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from 'jeep-sqlite/loader';

let dbInstance: any = null;

const sqlite = new SQLiteConnection(CapacitorSQLite);

const createConnection = async () => {
  return await sqlite.createConnection(
    'SpendWise',
    false,
    'no-encryption',
    1,
    false,
  );
};

const db = {
  sqlite: () => dbInstance,

  init: async () => {
    if (dbInstance) return dbInstance;

    try {
      if (Capacitor.getPlatform() == 'web') {
        defineCustomElements(window);
        await sqlite.initWebStore();
      }

      const ret = await sqlite.checkConnectionsConsistency();
      if (!ret.result) dbInstance = await createConnection();
      dbInstance = dbInstance ?? (await createConnection());

      await dbInstance.open();
      console.log('Database initialized successfully');
      return dbInstance;
    } catch (e) {
      console.error('Error initializing database', e);
      throw e;
    }
  },

  query: async (
    sql: string,
    params: any[] = [],
    transaction: boolean = false,
  ) => {
    if (!dbInstance) await db.init();

    if (
      sql.trim().toLowerCase().startsWith('select') ||
      sql.trim().toLowerCase().startsWith('pragma')
    )
      return (await dbInstance.query(sql, params)).values;
    else return (await dbInstance.run(sql, params, transaction)).changes;
  },

  queryAll: async (queries: any) => {
    const promises = queries.map(({ sql, params = [] }) =>
      db.query(sql, params).catch((error) => ({ error })),
    );

    const results = await Promise.all(promises);

    const errors = results.filter((result) => result && result.error);
    if (errors.length > 0) console.warn('One or more queries failed:', errors);

    return results;
  },

  queryAllSafe: async (queries: any) => {
    const promises = queries.map(({ sql, params = [] }) =>
      db.query(sql, params),
    );
    return Promise.all(promises)
      .then((results) => {
        return results;
      })
      .catch((error) => {
        throw error;
      });
  },

  transaction: async (queries: any) => {
    await db.query('BEGIN');
    try {
      for (const { sql, params } of queries) await db.query(sql, params);
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },

  close: async () => {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      console.log('Database connection closed');
    }
  },
};

export default db;
