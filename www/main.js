import { themeChange } from 'theme-change';
import Handlebars from 'handlebars';
import { initializeDatabase } from "./core/database";
import * as echarts from 'echarts';
import $ from "jquery";
import myUtilis from './core/myUtilis';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

window.$ = $;
window.Handlebars = Handlebars;
window.echarts = echarts;
window.GoogleAuth = GoogleAuth;
Object.assign(window, myUtilis);

Handlebars.registerHelper('formatDate', myUtilis.formatDate);
Handlebars.registerHelper('formatCurrency', myUtilis.formatCurrency);

themeChange();

document.addEventListener('DOMContentLoaded', async function () {
    GoogleAuth.initialize({
        clientId: '292298338560-pags40si86ac2o49jjthi6e23c7b1tsl.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.appdata'],
        grantOfflineAccess: true,
    });
    
    const Database = await initializeDatabase();

    const db = {
        query: async (sql, params = [], transaction = false) => {
            if (sql.trim().toLowerCase().startsWith('select'))
                return (await Database.query(sql, params)).values;
            else
                return (await Database.run(sql, params, transaction)).changes;
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
        }
    };

    window.db = db;

    await Database.execute(`
        CREATE TABLE IF NOT EXISTS SpendList (
            Id          INTEGER PRIMARY KEY,
            Name        TEXT,
            AtCreate    TEXT DEFAULT CURRENT_TIMESTAMP,
            AtUpdate    TEXT DEFAULT CURRENT_TIMESTAMP,
            LastEntry   TEXT,
            Status      INTEGER DEFAULT 1
        )`);

    await Database.execute(`
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

    await Database.execute(`
        CREATE TABLE IF NOT EXISTS Note (
            Id          INTEGER  PRIMARY KEY,
            NameList    TEXT,
            Content     TEXT,
            AtCreate    DATETIME DEFAULT CURRENT_TIMESTAMP,
            AtUpdate    DATETIME DEFAULT CURRENT_TIMESTAMP,
            Status      INTEGER  DEFAULT 1
        )`);

    console.log('Table initialized successfully');


    await Database.run(`INSERT INTO SpendList(Name) VALUES (?)`, ["Chi tiêu cá nhân 1"]);
    await Database.run(`INSERT INTO SpendList(Name) VALUES (?)`, ["Chi tiêu cá nhân 2"]);

    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [1, "Ăn sáng", 10000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [1, "Ăn trưa", 15000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [1, "Ăn chiều", 20000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [1, "Ăn tối", 25000]);

    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn sáng", 110000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn trưa", 12000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn chiều", 30000]);
    await Database.run(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn tối", 45000]);
});