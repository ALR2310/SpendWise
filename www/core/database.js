import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from "jeep-sqlite/loader";

let dbInstance = null;

const db = {
    init: async () => {
        try {
            const sqlite = new SQLiteConnection(CapacitorSQLite);

            if (Capacitor.getPlatform() == 'web') {
                defineCustomElements(window);
                await sqlite.initWebStore();
            }

            const Database = await sqlite.createConnection("SpendWise.db", false, "no-encryption", 1, false);
            await Database.open();

            console.log('Database initialized successfully');
            dbInstance = Database;
            return Database;
        } catch (e) {
            console.error('Error initializing database', e);
            throw e;
        }
    },

    query: async (sql, params = [], transaction = false) => {
        if (!dbInstance) await db.init();

        if (sql.trim().toLowerCase().startsWith('select'))
            return (await dbInstance.query(sql, params)).values;
        else
            return (await dbInstance.run(sql, params, transaction)).changes;
    },

    queryAll: async (queries) => {
        const promises = queries.map(({ sql, params = [] }) =>
            db.query(sql, params).catch(error => ({ error }))
        );

        const results = await Promise.all(promises);

        const errors = results.filter(result => result && result.error);
        if (errors.length > 0) console.warn("One or more queries failed:", errors);

        return results;
    },

    queryAllSafe: async (queries) => {
        const promises = queries.map(({ sql, params = [] }) => db.query(sql, params));
        return Promise.all(promises)
            .then(results => { return results; })
            .catch(error => { throw error; });
    },

    transaction: async (queries) => {
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

    initTable,
};


async function initTable() {
    try {
        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS SpendList (
                Id          INTEGER PRIMARY KEY,
                Name        TEXT,
                AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                LastEntry   TEXT,
                Status      INTEGER DEFAULT 1
            )`);

        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS SpendItem (
                Id          INTEGER PRIMARY KEY,
                ListId      INTEGER REFERENCES SpendList (Id),
                Name        TEXT,
                Price       REAL DEFAULT 0,
                Details     TEXT,
                AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER DEFAULT 1
            )`);

        await dbInstance.execute(`
            CREATE TABLE IF NOT EXISTS Note (
                Id          INTEGER  PRIMARY KEY,
                Name        TEXT,
                Content     TEXT,
                AtCreate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                Status      INTEGER  DEFAULT 1
            )`);

        console.log('Table initialized successfully');
    } catch (e) {
        console.error('Error initializing table', e);
        throw e;
    }
}

export default db;
