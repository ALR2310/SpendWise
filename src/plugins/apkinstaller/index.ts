import { registerPlugin } from '@capacitor/core';

import type { ApkInstallerPlugin } from './definitions';

const ApkInstaller = registerPlugin<ApkInstallerPlugin>('ApkInstaller', {
  web: () => import('./web').then((m) => new m.ApkInstallerWeb()),
});

export * from './definitions';
export { ApkInstaller };
