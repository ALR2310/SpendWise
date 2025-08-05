import { useContext } from 'react';

import { UpdaterContext } from '~/providers/UpdaterProvider';

export const useUpdater = () => {
  const context = useContext(UpdaterContext);
  if (!context) throw new Error('useUpdater must be used within a UpdaterProvider');
  return context;
};
