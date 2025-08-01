import 'reflect-metadata';
import './configs/i18n';
import 'animate.css';

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import React from 'react';
import { createRoot } from 'react-dom/client';

import RootApp from './App';
import { NoSqliteInit, query } from './assets/libs/nosqlite';
import { database } from './configs/database';
import { appSettings } from './configs/settings';
import { toast } from './hooks/useToast';
import { ExpenseModel } from './models/expenseModel';
import { NoteModel } from './models/noteModel';
import { googleAuth } from './services/googleAuth';

// Initialize dayjs plugin
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('vi');

const container = document.getElementById('root');
const root = createRoot(container!);

(window as any).query = query;
(window as any).toast = toast;
(window as any).appSettings = appSettings;

// Load current theme
document.documentElement.setAttribute('data-theme', appSettings.general.theme);

// Minimize app when back button is pressed
App.addListener('backButton', () => {
  App.minimizeApp();
});

if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false });
}

(async () => {
  const db = await database();
  await NoSqliteInit([ExpenseModel, NoteModel], db);

  // Init google account
  await googleAuth.initialize();

  // Render GUI
  root.render(
    <React.StrictMode>
      <RootApp />
    </React.StrictMode>,
  );
})();
