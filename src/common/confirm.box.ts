import $ from 'jquery';

interface ButtonOptions {
  show?: boolean;
  text?: string;
  width?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

interface ConfirmBoxOptions {
  title?: string;
  titlePosition?: 'left' | 'center' | 'right';
  message: string;
  buttonOk?: ButtonOptions;
  buttonCancel?: ButtonOptions;
}
/**
 * Displays a confirmation dialog with customizable title, message, and buttons.
 *
 * @param {ConfirmBoxOptions} options - Configuration options for the confirmation box.
 * @returns {Promise<boolean>} - Resolves to `true` if Ok is clicked, `false` if Cancel is clicked.
 *
 * @example
 * confirmBox({
 *   title: 'Delete item',
 *   message: 'Are you sure you want to delete this item?',
 *   buttonOk: { text: 'Delete', color: 'error' },
 *   buttonCancel: { text: 'Cancel', color: 'secondary' }
 * });
 */
export function confirmBox(options: ConfirmBoxOptions): Promise<boolean> {
  const confirmModal = $('#confirmModal');

  if (confirmModal.length === 0) {
    console.error('Dialog element not found!');
    return Promise.reject('Dialog element not found');
  }

  confirmModal.empty();
  renderDialog(confirmModal, options);
  (confirmModal[0] as HTMLDialogElement)?.showModal();

  let resolvePromise: (result: boolean) => void;
  return new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
  });

  function renderDialog(container: JQuery, options: ConfirmBoxOptions) {
    const modalBox = $('<div>', { class: 'modal-box p-4' });

    if (options.title) {
      const title = $('<h3>', { class: 'text-lg font-bold', text: options.title });
      title.addClass(
        options.titlePosition === 'center'
          ? 'text-center'
          : options.titlePosition === 'right'
            ? 'text-end'
            : 'text-start',
      );
      modalBox.append(title);
    }

    modalBox.append($('<p>', { class: 'py-4', text: options.message }));

    const modalAction = $('<div>', { class: 'modal-action mt-4' });
    const form = $('<form>', { method: 'dialog', class: 'flex gap-3' });

    addButton(form, options.buttonCancel, false);
    addButton(form, options.buttonOk, true);

    modalAction.append(form);
    modalBox.append(modalAction);
    container.append(modalBox);
  }

  function addButton(form: JQuery, buttonOptions: ButtonOptions | undefined, isOk: boolean) {
    if (buttonOptions?.show !== false) {
      const sizeClass = buttonOptions?.size ? `btn-${buttonOptions.size}` : '';
      const button = $('<button>', {
        class: `btn ${buttonOptions?.color ? 'btn-' + buttonOptions.color : ''} ${sizeClass}`,
        text: buttonOptions?.text || (isOk ? 'Ok' : 'Cancel'),
        style: `width: ${buttonOptions?.width || '80px'}`,
      }).on('click', () => resolvePromise(isOk));

      form.append(button);
    }
  }
}

// @ts-ignore
window.confirmBox = confirmBox;
