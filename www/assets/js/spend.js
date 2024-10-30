// Logic cho combobox
document.querySelectorAll('.combobox').forEach((combobox) => {
    const input = combobox.querySelector('input');
    const list = combobox.querySelector('ul');
    const items = list.querySelectorAll('li');

    input.addEventListener('input', () => {
        const filter = input.value.trim().toLowerCase();
        let hasVisibleItem = false;

        // Lọc các mục trong danh sách
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


// Nút thêm danh sách chi tiêu
$('#btn_spendList_create').on('click', async function () {
    const name = $('#input_spendList_name').val().trim();

    if (name) {
        try {
            const result = await db.query(`INSERT INTO SpendList (Name) VALUES (?)`, [name]);
            showToast('Tạo danh sách thành công', 'success', 3000);
            $('#input_spendList_name').val('');
            modal_spendList.close();
            // Thêm danh sách mới vào thẻ select
            const html = `<option value="${result.insertId}">${name}</option>`;
            $('#select_spendList').append(html)
        } catch (e) {
            console.log(e);
            showToast('Tạo danh sách thất bại', 'error', 3000);
        }
    } else {
        showToast('Vui lồng nhập tên danh sách chi tiêu', 'warning', 3000);
    }
});