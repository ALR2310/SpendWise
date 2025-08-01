import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';

import { Platform } from '~/shared/enums/app.enum';

export default async function logger(data: any) {
  if (Capacitor.getPlatform() !== Platform.Web) {
    const dataStr = JSON.stringify(data, null, 4);

    const result = await Filesystem.writeFile({
      path: `log_${Date.now()}.txt`,
      data: dataStr,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });

    await Toast.show({
      text: 'File saved at ' + result.uri,
      duration: 'short',
    });
  }
}
