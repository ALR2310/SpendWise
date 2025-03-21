import { UniqueId } from './utils';

export function showToast(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info',
  duration: number = 3000,
  callback?: (toastElement: HTMLElement) => Promise<void>,
) {
  const toastContainer = document.getElementById('toast-container');
  const toastId = `toast-${UniqueId()}`;

  if (!toastContainer) return;

  const classMap = {
    success: { toast: 'alert-success', button: 'btn-success', icon: 'fa-circle-check' },
    error: { toast: 'alert-error', button: 'btn-error', icon: 'fa-circle-xmark' },
    warning: { toast: 'alert-warning', button: 'btn-warning', icon: 'fa-triangle-exclamation' },
    info: { toast: 'alert-info', button: 'btn-info', icon: 'fa-circle-info' },
  };

  const { toast: toastClass, button: buttonClass, icon: iconClass } = classMap[type];

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `alert ${toastClass} alert-soft p-2 flex justify-between`;

  toast.innerHTML = `
          <div>
              <i id="${toastId}-icon" class="fa-sharp fa-regular ${iconClass}"></i>
              <span class="text-wrap">${message}</span>
          </div>
          <button class="btn ${buttonClass} btn-xs btn-circle text-white" onclick="closeToast('${toastId}')">
              <i class="fa-light fa-xmark"></i>
          </button>`;

  toastContainer.appendChild(toast);

  if (callback) {
    const iconElement = document.getElementById(`${toastId}-icon`);
    if (iconElement) {
      iconElement.className = 'fa-solid fa-spinner fa-spin';
    }

    callback(toast)
      .then(() => {
        if (iconElement) {
          iconElement.className = `fa-sharp fa-regular fa-circle-check`;
        }
        setTimeout(() => closeToast(toastId), duration);
      })
      .catch(() => {
        if (iconElement) {
          iconElement.className = `fa-sharp fa-regular fa-circle-xmark`;
        }
        setTimeout(() => closeToast(toastId), duration);
      });
  } else {
    setTimeout(() => closeToast(toastId), duration);
  }
}

export function closeToast(toastId: string) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.style.animation = 'toast-pop-out 0.5s ease-out forwards';
    setTimeout(() => {
      toast.remove();
    }, 500);
  }
}
