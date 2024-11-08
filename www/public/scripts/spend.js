// Initialize the custom select
document.querySelectorAll('div.select').forEach(select => {
    $(select).selectControl('init');
});

// Initialize the custom combobox
document.querySelectorAll('.combobox').forEach((combobox) => {
    $(combobox).comboboxControl();
});

// Load suggest for Combobox
async function loadSuggest() {
    try {
        const suggest = await db.query('SELECT DISTINCT Name FROM SpendItem WHERE Status = 1 COLLATE NOCASE');
        $('#combobox_spendItem_name').find('ul').html(
            suggest.map(item => `<li>${item.Name}</li>`).join('')
        ).closest('.combobox').comboboxControl();
    } catch (e) {
        console.error(e);
    }
}

// Function to load SpendItems when the app starts
async function loadSpendItem() {
    const listId = $('#select_spendList').selectControl('get');
    const searchKey = $('#input_spendItem_search').val().trim();
    const sortValue = $('#select_spendItem_sort').selectControl('get');
    const dateValue = $('#input_spendItem_search_date').val();

    loadSuggest();

    try {
        if (!listId) return;

        let sql = `SELECT * FROM SpendItem WHERE ListId = ? AND Status = 1`;
        const params = [listId];

        if (searchKey) {
            sql += ` AND (Name LIKE ? OR Price LIKE ? OR Details LIKE ?)`;
            params.push(`%${searchKey}%`, `%${searchKey}%`, `%${searchKey}%`);
        }

        if (dateValue) {
            sql += ` AND DATE(AtUpdate) = DATE(?)`;
            params.push(dateValue);
        }

        sql += ` ORDER BY ${sortValue}`;

        const spendItems = await db.query(sql, params);
        const template = convertPlaceHbs($('#table_spendItem_template').html());
        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({ spendItems: spendItems });
        $('#table_spendItem').find('tbody').html(html);
    } catch (e) {
        console.error(e);
        showToast('Tải dữ liệu thất bại', 'error');
    }
}

// Search SpendItem
$('#input_spendItem_search').on('input', _.debounce(async function () {
    loadSpendItem();
}, 200));

// Load spendItems when the app starts and when the list and sort changes
loadSpendItem();
$('#select_spendList, #select_spendItem_sort').selectControl('change', function () {
    loadSpendItem();
});

// Show/Hide date input
$('#input_spendItem_search_date').on('input', async function () {
    loadSpendItem();
    if ($(this).val()) $(this).css('width', '128px');
    else $(this).css('width', '42px');
});

// Button create SpendList
$('#btn_spendList_create').on('click', async function () {
    const name = $('#input_spendList_name').val().trim();

    if (name) {
        try {
            const result = await db.query(`INSERT INTO SpendList (Name) VALUES (?)`, [name]);
            showToast('Tạo danh sách thành công', 'success', 3000);
            $('#input_spendList_name').val('');
            modal_spendList.close();

            const escapedName = $('<div>').text(name).html();
            const html = `
                <li class="flex justify-between" data-value="${result.lastId}">${escapedName}
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
    } else {
        showToast('Vui lòng nhập tên danh sách chi tiêu', 'warning');
    }
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

// Function to open modal Create and Update SpendItem
function showSpendItemModal(id) {
    modal_spendItem.showModal();
    const spendItem = $('#table_spendItem').find(`tbody`).find(`tr[data-id="${id}"]`);

    if (id) {
        $('#modal_spendItem').find('h3').text('Cập nhật chi tiêu');
        $('#btn_spendItem_update').show();
        $('#btn_spendItem_create').hide();
        $('#input_spendItem_id').val(id);
        $('#combobox_spendItem_name').find('input').val(spendItem.find('td').eq(1).text());
        $('#input_spendItem_date').val(formatDate(spendItem.find('td').eq(0).text(), 'yyyy-mm-dd', 'dd/mm/yyyy'));
        $('#input_spendItem_price').val(spendItem.find('td').eq(2).text());
        $('#input_spendItem_info').val(spendItem.find('td').eq(3).text());
    } else {
        $('#modal_spendItem').find('h3').text('Thêm chi tiêu');
        $('#btn_spendItem_update').hide();
        $('#btn_spendItem_create').show();
        $('#input_spendItem_id').val('');
        $('#combobox_spendItem_name').find('input').val('');
        $('#input_spendItem_date').val(new Date().toISOString().split('T')[0]);
        $('#input_spendItem_price').val('');
        $('#input_spendItem_info').val('');
    }
}

// Button create SpendItem
$('#btn_spendItem_create').on('click', async function () {
    const listId = $('#select_spendList').selectControl('get');
    const name = $('#combobox_spendItem_name').find('input').val().trim();
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

// Button update SpendItem
$('#btn_spendItem_update').on('click', async function () {
    const id = $('#input_spendItem_id').val();
    const name = $('#combobox_spendItem_name').find('input').val().trim();
    const dateTime = $('#input_spendItem_date').val().trim() + ` ${getTime()}`;
    const price = $('#input_spendItem_price').val().trim().replace(/\./g, '') || 0;
    const info = $('#input_spendItem_info').val().trim() || "Không có thông tin";

    try {
        await db.query("UPDATE SpendItem SET Name = ?, Price = ?, Details = ?, AtUpdate = ? WHERE Id = ?",
            [name, price, info, dateTime, id]);
        modal_spendItem.close();

        const spendItem = $('#table_spendItem').find(`tbody`).find(`tr[data-id="${id}"]`);
        spendItem.find("td").eq(0).text(formatDate(dateTime, 'dd/mm/yyyy'));
        spendItem.find('td').eq(1).text(name);
        spendItem.find('td').eq(2).text(formatCurrency(price));
        spendItem.find('td').eq(3).text(info);
    } catch (e) {
        console.log(e);
        showToast('Cập nhật chi tiêu thất bại', 'error');
    }
});

// Function to delete SpendItem
async function deleteSpendItem(id) {
    try {
        await db.query("DELETE FROM SpendItem WHERE Id = ?", [id]);
        loadSpendItem();
    } catch (e) {
        console.log(e);
        showToast('Xóa thất bại', 'error');
    }
}

