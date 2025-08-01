import { useContext } from 'react';

import { ToastContext, ToastProps } from '~/providers/ToastProvider';

interface ToastOptions {
  message: string;
  title?: string;
  duration?: number;
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// Export Global Toast Function
let showToastFunction: ((toast: Omit<ToastProps, 'id'>, callback?: () => Promise<void>) => void) | null = null;

export const setToastFunction = (fn: typeof showToastFunction) => {
  showToastFunction = fn;
};

export const toast = {
  success: (options: ToastOptions | string, callback?: () => Promise<void>) => {
    if (showToastFunction) {
      if (typeof options === 'string') options = { message: options };
      showToastFunction({ type: 'success', ...options }, callback);
    } else {
      console.warn('showToast is not initialized yet.');
    }
  },
  error: (options: ToastOptions | string, callback?: () => Promise<void>) => {
    if (showToastFunction) {
      if (typeof options === 'string') options = { message: options };
      showToastFunction({ type: 'error', ...options }, callback);
    } else {
      console.warn('showToast is not initialized yet.');
    }
  },
  warning: (options: ToastOptions | string, callback?: () => Promise<void>) => {
    if (showToastFunction) {
      if (typeof options === 'string') options = { message: options };
      showToastFunction({ type: 'warning', ...options }, callback);
    } else {
      console.warn('showToast is not initialized yet.');
    }
  },
  info: (options: ToastOptions | string, callback?: () => Promise<void>) => {
    if (showToastFunction) {
      if (typeof options === 'string') options = { message: options };
      showToastFunction({ type: 'info', ...options }, callback);
    } else {
      console.warn('showToast is not initialized yet.');
    }
  },
};

// export const toast = (toast: Omit<ToastProps, 'id'>, callback?: () => Promise<void>) => {
//   if (showToastFunction) {
//     showToastFunction(toast, callback);
//   } else {
//     console.warn('showToast is not initialized yet.');
//   }
// };
