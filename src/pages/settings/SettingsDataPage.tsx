import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import dayjs from 'dayjs';
import download from 'downloadjs';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { appImages } from '~/assets';
import { appSettings } from '~/configs/settings';
import { toast } from '~/hooks/useToast';
import { Platform } from '~/shared/enums/app.enum';

import SettingsItem from './components/SettingsItem';
import { handleBackupData, handleExportData, handleImportData, handleSyncData } from './logic/data';
import { cleanCache } from './logic/updater';

export default function SettingsDataPage() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-4"
    >
      <SettingsItem
        title={t(`settings.data.backup.title`)}
        description={t(`settings.data.backup.description`)}
        type="button"
        iconEl={<img src={appImages.icons.cloudUpload} />}
        onClick={async () => {
          toast.info('Backup data', async () => {
            const result = await handleBackupData();
            if (result.success) toast.success(t('settings.data.backup.success'));
            else toast.error(t('settings.data.backup.error'));
          });
        }}
      />

      <SettingsItem
        title={t(`settings.data.sync.title`)}
        description={t(`settings.data.sync.description`)}
        type="button"
        iconEl={<img src={appImages.icons.cloudSync} />}
        onClick={() => {
          toast.info('Sync data', async () => {
            const result = await handleSyncData();
            if (result.success) toast.success(t('settings.data.sync.success'));
            else toast.error(t('settings.data.sync.error'));
          });
        }}
      />

      <SettingsItem
        title={t(`settings.data.import.title`)}
        description={t(`settings.data.import.desc`)}
        type="button"
        iconEl={<img src={appImages.icons.importFile} />}
        onClick={async () => {
          const result = await FilePicker.pickFiles({
            limit: 1,
            readData: true,
          });

          const base64Data = result.files[0].data;
          if (!base64Data) return toast.error(t('settings.data.import.error'));

          try {
            const textDecoder = new TextDecoder();
            const decodedContent = textDecoder.decode(Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)));
            const data = JSON.parse(decodedContent);
            await handleImportData(data, true);
            toast.success(t('settings.data.import.success'));
          } catch (e) {
            console.log(e);
            toast.error(t('settings.data.import.error'));
          }
        }}
      />

      <SettingsItem
        title={t(`settings.data.export.title`)}
        description={t(`settings.data.export.desc`)}
        type="button"
        iconEl={<img src={appImages.icons.exportFile} />}
        onClick={async () => {
          const dataExport = await handleExportData();
          const dataStr = JSON.stringify(dataExport, null, 2);

          try {
            if (Capacitor.getPlatform() == Platform.Web) {
              const blob = new Blob([dataStr], {
                type: 'application/json;charset=utf-8',
              });
              download(blob, 'expensesData.json', 'application/json');
            } else {
              const result = await Filesystem.writeFile({
                path: 'expensesData.json',
                data: dataStr,
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
              });

              appSettings.data.dateBackup = dayjs().toISOString();

              await Toast.show({
                text: 'File saved at ' + result.uri,
                duration: 'long',
              });
            }

            toast.success(t('settings.data.export.success'));
          } catch (e) {
            console.log(e);
            toast.error(t('settings.data.export.error'));
          }
        }}
      />

      <SettingsItem
        title={t(`settings.data.cache.title`)}
        description={t(`settings.data.cache.desc`)}
        type="button"
        iconEl={<img src={appImages.icons.dataClean} />}
        onClick={async () => {
          toast.info(t('settings.data.cache.toast.title'), async () => {
            const result = await cleanCache();
            return result.success
              ? toast.success(t('settings.data.cache.toast.success'))
              : toast.error(t('settings.data.cache.toast.error'));
          });
        }}
      />
    </motion.div>
  );
}
