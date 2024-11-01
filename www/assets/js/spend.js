// Initialize the custom select
document.querySelectorAll('div.select').forEach(select => {
    $.fn.selectControl = function (action, value) {
        let result;

        return this.each(function () {
            const selectElement = $(this);
            const selectedValue = selectElement.find('.select-value');
            const optionsList = selectElement.find('ul');

            // Helper function to get text content from li
            const getTextContent = (element) => Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join(' ');

            // Initialize or set value if action is 'init' or 'set'
            if (action === 'init' || action === 'set') {
                const optionToSelect = action === 'init'
                    ? optionsList.find('li').first()
                    : optionsList.find(`li[data-value="${value}"]`);

                if (optionToSelect.length) {
                    const text = getTextContent(optionToSelect[0]);
                    selectedValue.text(text);
                    const newValue = optionToSelect.data('value');
                    selectElement.attr('value', newValue);
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

            // Assign click event to open/close options and select an option
            selectElement.off('click').on('click', () => { optionsList.toggle(); });
            optionsList.find('li').off('click').on('click', function (e) {
                e.stopPropagation();
                const text = getTextContent(this);
                selectedValue.text(text);
                const newValue = $(this).data('value');
                selectElement.attr('value', newValue);
                optionsList.hide();
            });
        }).length === 1 ? result : this;
    };

    // Initialize the select
    $(select).selectControl('init');

    // Hide options when clicking outside - chỉ gán một lần
    $(document).off('click').on('click', (e) => {
        $('div.select ul').each(function () {
            if (!this.parentNode.contains(e.target)) {
                $(this).hide();
            }
        });
    });
});

// Initialize the custom combobox
document.querySelectorAll('.combobox').forEach((combobox) => {
    const input = combobox.querySelector('input');
    const list = combobox.querySelector('ul');
    const items = list.querySelectorAll('li');

    input.addEventListener('input', () => {
        const filter = input.value.trim().toLowerCase();
        let hasVisibleItem = false;

        items.forEach((item) => {
            if (item.textContent.toLowerCase().includes(filter)) {
                item.style.display = 'block';
                hasVisibleItem = true;
            } else item.style.display = 'none';

        });

        list.style.display = hasVisibleItem ? 'block' : 'none';
    });

    items.forEach((item) => {
        item.addEventListener('click', () => {
            input.value = item.textContent;
            list.style.display = 'none';
        });
    });

    document.addEventListener('click', (e) => {
        if (!combobox.contains(e.target)) {
            list.style.display = 'none';
        }
    });
});

// Button create new SpendList
$('#btn_spendList_create').on('click', async function () {
    const name = $('#input_spendList_name').val().trim();

    if (name)
        try {
            const result = await db.query(`INSERT INTO SpendList (Name) VALUES (?)`, [name]);
            showToast('Tạo danh sách thành công', 'success', 3000);
            $('#input_spendList_name').val('');
            modal_spendList.close();
            const html = `
                <li class="flex justify-between" data-value="${result.insertId}">${name}
                    <button class="btn btn-ghost btn-sm text-error" 
                        onclick="modal_spendList_delete.showModal();setTimeout(() => {$('#modal_spendList_delete').find('h3').text($('#select_spendList').selectControl('name'))}, 50);">
                        <i class="fa-sharp fa-trash"></i> Xoá
                    </button>
                </li>`;
            $('#select_spendList').find('ul').append(html);
            $('#select_spendList').selectControl('init');
            $('#select_spendList').selectControl('set', `${result.insertId}`);
        } catch (e) {
            console.log(e);
            showToast('Tạo danh sách thất bại', 'error');
        }
    else showToast('Vui lồng nhập tên danh sách chi tiêu', 'warning');
});

// Button delete SpendList
$('#btn_spendList_delete').on('click', async function () {
    const listId = $('#select_spendList').selectControl('get');
    if (listId)
        try {
            await db.query(`DELETE FROM SpendList WHERE Id = ?`, [listId]);
            showToast('Xoá danh sách thành công', 'success');
            modal_spendList_delete.close();
            $('#select_spendList').selectControl('del', listId);
        } catch (e) {
            console.log(e);
            showToast('Xoá danh sách thất bại', 'error');
        }
    else showToast('Vui lòng chọn danh sách muốn xoá', 'warning');
});

// Button create new SpendItem
$('#btn_spendItem_create').on('click', async function () {
    const listId = $('#select_spendList').selectControl('get');
    const name = $('#input_spendItem_name').val().trim();
    const dateTime = $('#input_spendItem_date').val().trim() + ` ${getTime()}`;
    const price = $('#input_spendItem_price').val().trim().replace(/\./g, '') || 0;
    const info = $('#input_spendItem_info').val().trim() || "Không có thông tin";

    try {
        await db.query("INSERT INTO SpendItem (ListId, Name, Price, Details, AtCreate, AtUpdate) VALUES (?, ?, ?, ?, ?, ?)",
            [listId, name, price, info, dateTime, dateTime]);
        modal_spendItem.close();
        loadSpendItem();
    } catch (e) {
        console.log(e);
        showToast('Thêm chi tiêu thất bại', 'error');
    }
});

// Function to load SpendItems when the app starts
async function loadSpendItem() {
    const listId = $('#select_spendList').selectControl('get');
    const sortValue = $('#select_spendItem_sort').selectControl('get');
    try {
        const spendItems = await db.query(`SELECT * FROM SpendItem WHERE ListId = ? AND Status = 1 ORDER BY ?`, [listId, sortValue]);

        const template = convertPlaceHbs($('#table_spendItem_template').html());
        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({ spendItems: spendItems });
        $('#table_spendItem').find('tbody').html(html);
    } catch (e) {
        console.log(e);
        showToast('Tải dữ liệu thất bại', 'error');
    }
}

loadSpendItem();