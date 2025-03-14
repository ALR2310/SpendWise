import dayjs from 'dayjs';

export function UniqueId() {
  const timestamp = dayjs().valueOf().toString(16);
  const randomPart = Math.random().toString(16).slice(2, 16);
  return (timestamp + randomPart).slice(0, 24);
}

export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number = 3000) {
  const toastContainer = document.getElementById('toast-container');
  const toastId = `toast-${UniqueId()}`;

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `alert alert-${type} p-2 flex justify-between text-white`;

  toast.innerHTML = `
        <div>
            <i class="fa-sharp fa-regular ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : type === 'info' ? 'fa-circle-info' : 'fa-triangle-exclamation'}"></i>
            <span class="text-wrap">${message}</span>
        </div>
        <button class="btn btn-${type} btn-xs btn-circle text-white" onclick="closeToast('${toastId}')">
            <i class="fa-light fa-xmark"></i>
        </button>`;

  toastContainer!.appendChild(toast);
  setTimeout(() => {
    closeToast(toastId);
  }, duration);
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

export function convertPlaceHbs(
  template: string,
  options = { from: { start: '%', end: '%' }, to: { start: '{{', end: '}}' } },
) {
  try {
    const { from, to } = options;
    const startRegex = new RegExp(
      from.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
        '([^]*?)' +
        from.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
      'g',
    );

    return template.replace(startRegex, function (_match, p1) {
      return (
        to.start +
        p1
          .replace(new RegExp(to.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.start)
          .replace(new RegExp(to.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.end) +
        to.end
      );
    });
  } catch (e) {
    console.error(e);
    return '';
  }
}

export function formatDate(dateStr: string, output: string = 'DD/MM/YYYY'): string {
  const date = dayjs(dateStr);
  return date.format(output.toUpperCase());
}

export function getDateTime(dateStr: string): string {
  const date = dayjs(dateStr, 'YYYY/MM/DD');
  const now = dayjs();
  const dateTime = date.hour(now.hour()).minute(now.minute()).second(now.second()).millisecond(now.millisecond());
  return dateTime.toISOString();
}

export function formatCurrency(value: any, symbol: boolean = true) {
  value = value.toString().replace(/\./g, '');
  let formattedValue = new Intl.NumberFormat('vi-VN').format(value);
  return symbol ? `${formattedValue} ₫` : formattedValue;
}

export function fixDate(dateStr: string | string[]): string | string[] {
  const possibleFormats = ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm', 'DD/MM/YYYY'];

  if (Array.isArray(dateStr)) {
    return dateStr.map((date) => fixDate(date) as string);
  }

  if (!dateStr) return '';

  let date = dayjs.utc(dateStr);

  if (!date.isValid()) {
    for (const format of possibleFormats) {
      const parsedDate = dayjs(dateStr, format, true);
      if (parsedDate.isValid()) {
        date = parsedDate;
        break;
      }
    }
  }

  return date.isValid() ? date.toISOString() : '';
}

export function devLog(message?: string) {
  const devLogHtml = `
    <dialog id="modal_devLog" class="modal">
        <div class="modal-box">
            <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 class="text-lg font-bold">Dev log</h3>
        </div>
    </dialog>
  `;

  let modal_devLog = document.getElementById('modal_devLog');

  if (!modal_devLog) {
    const temp = document.createElement('div');
    temp.innerHTML = devLogHtml.trim();
    modal_devLog = temp.firstElementChild as HTMLElement;
    document.body.appendChild(modal_devLog);
  }

  const devLogContent = modal_devLog.querySelector('.modal-box');

  if (devLogContent && message) {
    const logMessage = document.createElement('p');
    logMessage.textContent = message;
    devLogContent.appendChild(logMessage);
  }

  return modal_devLog;
}
