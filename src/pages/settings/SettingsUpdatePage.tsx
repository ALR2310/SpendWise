import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { appImages } from '~/assets';
import DownloadProgress from '~/components/DownloadProgress';
import { appSettings } from '~/configs/settings';

import SettingsItem from './components/SettingsItem';
import { checkAndUpdateApp } from './logic/updater';

export default function SettingsUpdatePage() {
  const { t } = useTranslation();

  const [downloadProgress, setDownloadProgress] = useState(0);

  // Apply auto update setting
  const [autoUpdate, setAutoUpdate] = useState<boolean>(appSettings.general.autoUpdate);
  useEffect(() => {
    appSettings.general.autoUpdate = autoUpdate;
  }, [autoUpdate]);

  return (
    <React.Fragment>
      {downloadProgress > 0 && downloadProgress < 100 && <DownloadProgress value={downloadProgress} />}

      <SettingsItem
        title={t(`settings.autoUpdate.title`)}
        description={t(`settings.autoUpdate.desc`)}
        type="toggle"
        iconEl={<img src={appImages.icons.update} />}
        onToggleChange={(value) => setAutoUpdate(value as boolean)}
        defaultToggle={autoUpdate}
      />

      <SettingsItem
        title={t(`settings.checkUpdate.title`)}
        description={t(`settings.general.checkUpdate.desc`)}
        type="button"
        iconEl={<img src={appImages.icons.update} />}
        onClick={async () => {
          checkAndUpdateApp({
            onProgress: setDownloadProgress,
          });
        }}
      />
    </React.Fragment>
  );
}
