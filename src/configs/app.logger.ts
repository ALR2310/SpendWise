class AppLogs {
  private modal: HTMLDialogElement | null = null;
  private logContainer: HTMLDivElement | null = null;

  init() {
    if (!this.modal) {
      this.modal = document.createElement('dialog');
      this.modal.id = 'logModal';
      this.modal.className = 'modal';
      this.modal.innerHTML = `
          <div class="modal-box">
              <h3 class="text-lg text-center font-bold">Dev Logs</h3>
              <div id="logContent" class="py-4"></div>
          </div>
          <form method="dialog" class="modal-backdrop"><button>Close</button></form>
        `;
      document.body.appendChild(this.modal);
    }
    this.logContainer = this.modal.querySelector('#logContent') as HTMLDivElement;

    document.getElementById('app-title')!.addEventListener('dblclick', () => this.show());
  }

  log(...messages: any[]) {
    if (!this.modal) this.init();
    if (!this.logContainer) return;

    messages.forEach((msg) => {
      const logItem = document.createElement('pre');
      logItem.style.whiteSpace = 'pre-wrap';
      logItem.innerText = msg;
      this.logContainer!.appendChild(logItem);
    });

    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  show() {
    if (!this.modal) this.init();
    this.modal!.showModal();
  }

  close() {
    if (this.modal) this.modal.close();
  }
}

type LoggerFunction = ((...messages: any[]) => void) & {
  init: () => void;
  show: () => void;
  close: () => void;
};
const appLogs = new AppLogs();

const logger: LoggerFunction = Object.assign((...messages: any[]) => appLogs.log(...messages), {
  init: () => appLogs.init(),
  show: () => appLogs.show(),
  close: () => appLogs.close(),
});

export default logger;
