import { createContext, ReactNode, useCallback, useState } from 'react';

import DownloadProgress from '~/components/DownloadProgress';
import { checkAndUpdateApp } from '~/pages/settings/logic/updater';

type UpdaterContextType = {
  downloadProgress: number;
  triggerUpdate: () => void;
};

const UpdaterContext = createContext<UpdaterContextType>({
  downloadProgress: 0,
  triggerUpdate: () => {},
});

const UpdaterProvider = ({ children }: { children: ReactNode }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);

  const triggerUpdate = useCallback(() => {
    checkAndUpdateApp({
      onProgress: setDownloadProgress,
    });
  }, []);

  return (
    <UpdaterContext.Provider value={{ downloadProgress, triggerUpdate }}>
      {downloadProgress > 0 && downloadProgress < 100 && <DownloadProgress value={downloadProgress} />}
      {children}
    </UpdaterContext.Provider>
  );
};

export { UpdaterContext, UpdaterProvider };
