import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { appImages } from '~/assets';
import logger from '~/configs/logger';
import { appSettings } from '~/configs/settings';
import { toast } from '~/hooks/useToast';
import { googleAuth } from '~/services/googleAuth';
import { LANGUAGE, PAGE, THEME } from '~/shared/types/settings.type';

import SettingsItem from './components/SettingsItem';
import { handleSyncData } from './logic/data';
import SettingsUpdatePage from './SettingsUpdatePage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Apply theme setting
  const [theme, setTheme] = useState(appSettings.general.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    appSettings.general.theme = theme;

    if (Capacitor.isNativePlatform()) {
      if (theme === THEME.DARK || theme === THEME.DRACULA) StatusBar.setStyle({ style: Style.Dark });
      else if (theme === THEME.SYSTEM) {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) StatusBar.setStyle({ style: Style.Dark });
        else StatusBar.setStyle({ style: Style.Light });
      } else StatusBar.setStyle({ style: Style.Light });
    }
  }, [theme]);

  // Apply language setting
  const [language, setLanguage] = useState(appSettings.general.language);
  useEffect(() => {
    appSettings.general.language = language;
  }, [language]);

  // Apply default page setting
  const [defaultPage, setDefaultPage] = useState(appSettings.general.defaultPage);
  useEffect(() => {
    appSettings.general.defaultPage = defaultPage;
  }, [defaultPage]);

  // Apply notification setting
  const [notification, setNotification] = useState(appSettings.general.notification);
  useEffect(() => {
    appSettings.general.notification = notification;
  }, [notification]);

  // Check isLogin
  const [isLogin, setIsLogin] = useState(false);
  useEffect(() => {
    googleAuth.isLoggedIn().then((res) => setIsLogin(res.data!));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-4"
    >
      <SettingsItem
        title={isLogin ? t('settings.account.google.logout.title') : t('settings.account.google.login.title')}
        description={isLogin ? t('settings.account.google.logout.desc') : t('settings.account.google.login.desc')}
        type={'button'}
        iconEl={<img src={appImages.icons.google} />}
        onClick={async () => {
          if (isLogin) {
            const result = await googleAuth.logout();
            if (result.success) {
              setIsLogin(false);
              toast.success(t('settings.account.google.logout.success'));
            }
          } else {
            const result = await googleAuth.login();
            logger(result);
            if (result.success) {
              setIsLogin(true);
              toast.success(t('settings.account.google.login.success'));

              // Check and sync data
              toast.info('Sync data', async () => {
                const result = await handleSyncData({ askBeforeReplace: true });
                if (result.success) {
                  queryClient.invalidateQueries({ queryKey: ['expenses'] });
                  queryClient.invalidateQueries({ queryKey: ['notes'] });
                  toast.success(t('settings.data.sync.success'));
                } else toast.error(result.message);
              });
            } else toast.error(result.message);
          }
        }}
      />

      <SettingsItem
        title={t('settings.theme.title')}
        description={t('settings.theme.desc')}
        type={'select'}
        iconEl={<img src={appImages.icons.theme} />}
        options={Object.values(THEME).map((value) => ({
          value,
          label: value,
        }))}
        onSelectChange={(value) => setTheme(value as THEME)}
        defaultSelect={theme}
      />

      <SettingsItem
        title={t('settings.language.title')}
        description={t('settings.language.desc')}
        type={'select'}
        iconEl={<img src={appImages.icons.language} />}
        options={Object.values(LANGUAGE).map((value) => ({
          value,
          label: value,
        }))}
        onSelectChange={(value) => {
          i18next.changeLanguage(value as LANGUAGE);
          setLanguage(value as LANGUAGE);
        }}
        defaultSelect={language}
      />

      <SettingsItem
        title={t('settings.defaultPage.title')}
        description={t('settings.defaultPage.desc')}
        type={'select'}
        iconEl={<img src={appImages.icons.page} />}
        options={Object.values(PAGE).map((value) => ({
          value,
          label: value,
        }))}
        onSelectChange={(value) => {
          setDefaultPage(value as PAGE);
        }}
        defaultSelect={defaultPage}
      />

      <SettingsItem
        title={t(`settings.notification.title`)}
        description={t(`settings.notification.desc`)}
        type="toggle"
        iconEl={<img src={appImages.icons.notify} />}
        onToggleChange={(value) => setNotification(value as boolean)}
        defaultToggle={notification}
      />

      <SettingsItem
        title={t(`settings.data.title`)}
        description={t(`settings.data.desc`)}
        type={'link'}
        iconEl={<img src={appImages.icons.data} />}
        linkTo="data"
      />

      <SettingsUpdatePage />
    </motion.div>
  );
}
