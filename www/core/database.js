import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements } from "jeep-sqlite/loader";

async function initializeDatabase() {
    const dbReadyEvent = new CustomEvent('dbready');

    try {
        const sqlite = new SQLiteConnection(CapacitorSQLite);

        if (Capacitor.getPlatform() == 'web') {
            defineCustomElements(window);
            await sqlite.initWebStore();
        }

        const Database = await sqlite.createConnection("SpendWise.db", false, "no-encryption", 1, false);
        await Database.open();

        console.log('Database initialized successfully');
        document.dispatchEvent(dbReadyEvent);
        return Database;
    } catch (e) {
        console.error('Error initializing database', e);
        throw e;
    }
};

export { initializeDatabase };
