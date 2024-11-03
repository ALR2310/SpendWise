import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from "jeep-sqlite/loader";

var Database;

async function initializeDatabase() {
    const dbReadyEvent = new CustomEvent('dbready');

    try {
        const sqlite = new SQLiteConnection(CapacitorSQLite);

        if (Capacitor.getPlatform() === 'web') {
            defineCustomElements(window);
            await sqlite.initWebStore();
        }

        Database = await sqlite.createConnection("SpendWise.db", false, "no-encryption", 1, false);
        await Database.open();

        console.log('Database initialized successfully');
        document.dispatchEvent(dbReadyEvent);
        return window.Database = Database;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
} initializeDatabase();

document.addEventListener('dbready', async () => {
    try {
        await Database.execute(`
            CREATE TABLE IF NOT EXISTS SpendList (
                    Id          INTEGER PRIMARY KEY,
                    Name        TEXT,
                    AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    LastEntry   TEXT,
                    Status      INTEGER DEFAULT 1
                )
            `);

        await Database.execute(`
            CREATE TABLE IF NOT EXISTS SpendItem (
                    Id          INTEGER PRIMARY KEY,
                    ListId      INTEGER REFERENCES SpendingList (Id),
                    Name        TEXT,
                    Price       REAL DEFAULT 0,
                    Details     TEXT,
                    AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
                    Status      INTEGER DEFAULT 1
                )
            `);

        await Database.execute(`
            CREATE TABLE IF NOT EXISTS Note (
                    Id          INTEGER  PRIMARY KEY,
                    NameList    TEXT,
                    Content     TEXT,
                    AtCreate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                    AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
                    Status      INTEGER  DEFAULT 1
                );
            `);
    } catch (e) {
        console.error('Error initializing table:', e);
    }
});