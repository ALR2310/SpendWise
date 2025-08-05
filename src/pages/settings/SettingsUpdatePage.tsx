import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { appImages } from '~/assets';
import { appSettings } from '~/configs/settings';
import { useUpdater } from '~/hooks/useUpdater';

import SettingsItem from './components/SettingsItem';

export default function SettingsUpdatePage() {
  const { t } = useTranslation();
  const { triggerUpdate } = useUpdater();

  // Apply auto update setting
  const [autoUpdate, setAutoUpdate] = useState<boolean>(appSettings.general.autoUpdate);
  useEffect(() => {
    appSettings.general.autoUpdate = autoUpdate;
  }, [autoUpdate]);

  return (
    <React.Fragment>
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
        onClick={triggerUpdate}
      />
    </React.Fragment>
  );
}
