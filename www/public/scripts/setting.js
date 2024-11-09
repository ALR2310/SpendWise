// Initialize the custom select
document.querySelectorAll('div.select').forEach(select => {
    $(select).selectControl('init');
});

// Check if user is logged in to google 
async function checkLogin() {
    const result = await drive.checkLogin();
    console.log(result);

    if (result.success) {
        $('#setting_data-login').closest('label').hide();
        $('#setting_data-logout').closest('label').show();
    };
} checkLogin();

// Login google
$('#setting_data-login').on('click', async function () {
    try {
        const result = await drive.login();
        console.log(result);

        if (result.success) {
            $('#setting_data-login').closest('label').hide();
            $('#setting_data-logout').closest('label').show();
        };
    } catch (e) {
        console.error(e);
        showToast('Đăng nhập thất bại');
    }
});

// Logout google
$('#setting_data-logout').on('click', async function () {
    try {
        const result = await drive.logout();
        console.log(result);

        if (result.success) {
            $('#setting_data-login').closest('label').show();
            $('#setting_data-logout').closest('label').hide();
        }
    } catch (e) {
        console.error(e);
        showToast('Đăng xuất thất bại');
    }
});

// $('#btn-upload').on('click', async function () {
//     const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

//     const metadata = {
//         name: 'testUpload.txt',
//         mimeType: 'text/plain',
//     };

//     const form = new FormData();
//     form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
//     form.append("file", new Blob(['Hello World'], { type: "text/plain" }));

//     try {
//         const response = await fetch(url, {
//             method: "POST",
//             headers: new Headers({
//                 Authorization: `Bearer ${accessToken}`,
//             }),
//             body: form,
//         });

//         const data = await response.json();

//         if (response.ok) {
//             console.log("Tệp đã được tải lên thành công:", data);
//             $('#text-Result').val('Tệp đã được tải lên thành công: ' + JSON.stringify(data));
//         } else {
//             console.error("Lỗi khi tải lên tệp:", data);
//             $('#text-Result').val('Lỗi khi tải lên tệp: ' + JSON.stringify(data));
//         }
//     } catch (error) {
//         console.error("Lỗi không xác định:", error);
//         $('#text-Result').val("Lỗi không xác định: " + error.message);
//     }
// });

// Import data
var importData = null;
$('#setting_data-import').on('click', async function () {
    const result = await FilePicker.pickFiles({ types: ['application/json'], readData: true });
    const base64Data = result.files[0].data;
    importData = null;

    try {
        const textDecoder = new TextDecoder();
        const decodedContent = textDecoder.decode(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)));
        const data = JSON.parse(decodedContent);
        importData = data;

        const listContainer = $('#modal_data_import_confirm .list');
        listContainer.empty();

        data.spendList.forEach(list => {
            const count = _.filter(data.spendItem, { ListId: list.Id }).length;
            const button = $(`<button class="btn btn-sm btn-active w-full"><i class="fa-sharp fa-regular fa-list"></i> ${list.Name} <div class="badge">${count}</div></button>`);
            listContainer.append(button);
        });

        data.note.forEach(note => {
            const button = $(`<button class="btn btn-sm btn-active w-full"><i class="fa-sharp fa-regular fa-note"></i> ${note.Name}</button>`);
            listContainer.append(button);
        });

        modal_data_import_confirm.showModal();
    } catch (error) {
        console.error('Error parsing JSON:', error);
        showToast('Có lỗi khi phân tích cú pháp tệp', 'error');
    }
});

// Confirm import
$('#btn_confirm_import').on('click', async function () {
    modal_data_import_confirm.close();

    try {
        // Xóa các bản ghi cũ
        await db.query('DELETE FROM SpendItem', [], true);
        await db.query('DELETE FROM SpendList', [], true);
        await db.query('DELETE FROM Note', [], true);

        importData.spendList.forEach(async list => {
            await db.query(`INSERT INTO SpendList(Name, AtCreate, AtUpdate, LastEntry, Status) VALUES (?, ?, ?, ?, ?)`,
                [list.Name, list.AtCreate, list.AtUpdate, list.LastEntry, list.Status]);
        });

        importData.spendItem.forEach(async item => {
            await db.query(`INSERT INTO SpendItem(ListId, Name, Price, Details, AtCreate, AtUpdate, Status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [item.ListId, item.Name, item.Price, item.Details, item.AtCreate, item.AtUpdate, item.Status]);
        });

        importData.noted.forEach(async note => {
            await db.query(`INSERT INTO Note(Name, Content, AtCreate, AtUpdate, Status) VALUES (?, ?, ?, ?, ?)`,
                [note.Name, note.Content, note.AtCreate, note.AtUpdate, note.Status]);
        });

        resetPage(['spend', 'stats', 'note']);
        showToast("Dữ liệu nhập thành công", 'success');
    } catch (e) {
        console.log(e);
        showToast("Có lỗi trong quá trình nhập", 'error');
    }
});

// Export data
$('#setting_data-export').on('click', async function () {
    try {
        const [spendList, spendItem, note] = await db.queryAll([
            { sql: 'SELECT * FROM SpendList' },
            { sql: 'SELECT * FROM SpendItem' },
            { sql: 'SELECT * FROM Note' },
        ]);

        const spendData = { spendList, spendItem, note };
        const data = JSON.stringify(spendData, null, 2);

        if (Capacitor.getPlatform() == 'web') {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            $('<a>', { href: url, download: 'spendData.json' }).appendTo('body')[0].click();
            URL.revokeObjectURL(url);
        } else
            await Filesystem.writeFile({
                path: "spendData.json",
                data: data,
                directory: Directory.External,
                encoding: Encoding.UTF8,
            });

        showToast('Xuất dữ liệu thành công', 'success');
    } catch (e) {
        console.log(e);
        showToast("Có lỗi trong quá trình xuất dữ liệu", 'error');
    }
});