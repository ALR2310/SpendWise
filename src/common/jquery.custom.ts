import $ from 'jquery';

declare global {
  interface JQuery<TElement = HTMLElement> {
    selectControl(action: 'init' | 'set' | 'get' | 'name' | 'del' | 'change', value?: any): JQuery | string | void;
    comboboxControl(): JQuery;
  }
}

$.fn.selectControl = function (action, value) {
  let result: any;

  return this.each(function () {
    const selectElement = $(this);
    const selectedValue = selectElement.find('.select-value');
    const optionsList = selectElement.find('ul');

    // Helper function to get text content from li
    const getTextContent = (element: any) =>
      Array.from(element.childNodes)
        .filter((node: any) => node.nodeType === Node.TEXT_NODE)
        .map((node: any) => node.textContent.trim())
        .join(' ');

    // Initialize or set value if action is 'init' or 'set'
    if (action === 'init' || action === 'set') {
      const optionToSelect =
        action === 'init' ? optionsList.find('li').first() : optionsList.find(`li[data-value="${value}"]`);

      if (optionToSelect.length) {
        const text = getTextContent(optionToSelect[0]);
        const newValue = optionToSelect.data('value');
        const currentValue = selectElement.attr('value');

        if (currentValue !== newValue) {
          selectedValue.text(text);
          selectElement.attr('value', newValue);
          // Callback when use method set
          if (action === 'set') {
            const callback = selectElement.data('onChangeCallback');
            if (typeof callback === 'function') callback(newValue, text);
          }
        }
      }
    }

    // Get the current selected value if action is 'get'
    if (action === 'get') result = selectElement.attr('value');

    // Get the name of the selected option if action is 'name'
    if (action === 'name') {
      const currentValue = selectElement.attr('value');
      const selectedOption = optionsList.find(`li[data-value="${currentValue}"]`);
      result = selectedOption.length ? getTextContent(selectedOption[0]) : null;
    }

    // Remove option by data-value if action is 'del'
    if (action === 'del') {
      optionsList.find(`li[data-value="${value}"]`).remove();

      const firstOption = optionsList.find('li').first();
      if (firstOption.length) {
        const text = getTextContent(firstOption[0]);
        selectedValue.text(text);
        const newValue = firstOption.data('value');
        selectElement.attr('value', newValue);
      } else {
        selectedValue.text('');
        selectElement.attr('value', '');
      }
    }

    // Callback when use method change
    if (action === 'change' && typeof value === 'function') {
      selectElement.data('onChangeCallback', value);
    }

    // Assign click event to open/close options and select an option
    selectElement.off('click').on('click', () => {
      optionsList.toggle();
    });
    optionsList
      .find('li')
      .off('click')
      .on('click', function (e) {
        e.stopPropagation();
        const text = getTextContent(this);
        selectedValue.text(text);
        const newValue = $(this).data('value');
        selectElement.attr('value', newValue);
        optionsList.hide();

        const callback = selectElement.data('onChangeCallback');
        if (typeof callback === 'function') {
          callback(newValue, text);
        }
      });

    // Hide options when clicking outside
    $(document)
      .off('click')
      .on('click', (e) => {
        $('div.select ul').each(function () {
          if (!this.parentNode!.contains(e.target)) {
            $(this).hide();
          }
        });
      });
  }).length === 1
    ? result
    : this;
};

$.fn.comboboxControl = function () {
  return this.each(function () {
    const combobox = $(this);
    const input = combobox.find('input');
    const list = combobox.find('ul');
    let items = list.find('li').toArray();

    const getTextContent = (element: HTMLLIElement) => $(element).text().trim();

    input.on('input', function () {
      const filter = input.val()!.trim().toLowerCase();
      let hasVisibleItem = false;

      if (!filter) {
        items.sort((a, b) => new Intl.Collator('vi').compare(getTextContent(a), getTextContent(b)));
      } else {
        items = items.sort((a, b) => {
          const textA = getTextContent(a);
          const textB = getTextContent(b);

          const startsWithA = textA.toLowerCase().startsWith(filter);
          const startsWithB = textB.toLowerCase().startsWith(filter);

          if (startsWithA && !startsWithB) return -1;
          if (!startsWithA && startsWithB) return 1;
          return new Intl.Collator('vi').compare(textA, textB);
        });
      }

      list.empty().append(items.map((item) => $(item).show()));
      list.find('li').each(function () {
        const itemText = getTextContent(this).toLowerCase();
        if (itemText.includes(filter)) {
          $(this).show();
          hasVisibleItem = true;
        } else {
          $(this).hide();
        }
      });

      list.toggle(hasVisibleItem);
    });

    list.on('click', 'li', function () {
      input.val(getTextContent(this));
      list.hide();
    });

    $(document).on('click', function (e) {
      if (!combobox[0].contains(e.target)) list.hide();
    });
  });
};
