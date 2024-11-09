import $ from "jquery";
import _ from 'lodash';
import pages from './core/page';
import db from "./core/database";
import drive from './core/drive';
import * as echarts from 'echarts';
import Handlebars from 'handlebars';
import { App } from '@capacitor/app';
import myUtilis from './core/myUtilis';
import { Device } from '@capacitor/device';
import { themeChange } from 'theme-change';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

window.$ = $;
window._ = _;
window.db = db;
window.App = App;
window.drive = drive;
window.echarts = echarts;
window.Encoding = Encoding;
window.Capacitor = Capacitor;
Object.assign(window, pages);
window.Directory = Directory;
window.FilePicker = FilePicker;
window.Filesystem = Filesystem;
window.GoogleAuth = GoogleAuth;
window.Handlebars = Handlebars;
Object.assign(window, myUtilis);

Handlebars.registerHelper('formatDate', myUtilis.formatDate);
Handlebars.registerHelper('formatCurrency', myUtilis.formatCurrency);

themeChange();

document.addEventListener('DOMContentLoaded', async function () {
    pages.themeIconChange();

    GoogleAuth.initialize({
        clientId: '292298338560-pags40si86ac2o49jjthi6e23c7b1tsl.apps.googleusercontent.com',
        scopes: ['email', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.appdata'],
        grantOfflineAccess: true,
    });

    await db.init();
    await db.initTable();

    await db.query(`INSERT INTO SpendList(Name) VALUES (?)`, ["Chi tiêu cá nhân 1"]);
    await db.query(`INSERT INTO SpendList(Name) VALUES (?)`, ["Chi tiêu cá nhân 2"]);

    await db.query(`INSERT INTO SpendItem(ListId, Name, Price, AtUpdate) VALUES (?, ?, ?, ?)`, [1, "Ăn sáng", 10000, '2021-01-01 00:00:00']);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price, AtUpdate) VALUES (?, ?, ?, ?)`, [1, "Ăn trưa", 15000, '2022-02-01 00:00:00']);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price, AtUpdate) VALUES (?, ?, ?, ?)`, [1, "Ăn chiều", 20000, '2023-03-01 00:00:00']);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price, AtUpdate) VALUES (?, ?, ?, ?)`, [1, "Ăn tối", 25000, '2024-04-01 00:00:00']);

    await db.query(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn sáng", 110000]);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn trưa", 12000]);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn chiều", 30000]);
    await db.query(`INSERT INTO SpendItem(ListId, Name, Price) VALUES (?, ?, ?)`, [2, "Ăn tối", 45000]);

    console.log(await drive.checkLogin());
    
    pages.showPage('spend');
});