import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';

import { appSettings } from '~/configs/settings';
import { toast } from '~/hooks/useToast';
import { handleSyncData } from '~/pages/settings/logic/data';
import { googleAuth } from '~/services/googleAuth';

import DockNavBar from './DockNavBar';
import NavBar from './NavBar';

export default function MainLayout() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const defaultPage = appSettings.general.defaultPage;

  const [isLogin, setIsLogin] = useState(false);
  useEffect(() => {
    googleAuth.isLoggedIn().then((res) => setIsLogin(res.data!));
  }, []);

  // Check sync data
  useEffect(() => {
    if (!isLogin) return;

    toast.info('Sync data', async () => {
      const result = await handleSyncData({ askBeforeReplace: true });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        toast.success(t('settings.data.sync.success'));
      } else toast.error(result.message);
    });
  }, [isLogin, queryClient, t]);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate(`/${defaultPage}`);
    }
  }, [defaultPage, location.pathname, navigate]);

  return (
    <div className="flex flex-col h-screen pt-[env(safe-area-inset-top)]">
      <NavBar />
      <main className="flex-1 overflow-auto no-scrollbar">
        <Outlet />
      </main>
      <DockNavBar />
    </div>
  );
}
