import { WebPlugin } from '@capacitor/core';

import type { ApkInstallerPlugin } from './definitions';

export class ApkInstallerWeb extends WebPlugin implements ApkInstallerPlugin {
  async install(options: { filePath: string }): Promise<void> {
    throw new Error('Web not implemented');
  }
}
