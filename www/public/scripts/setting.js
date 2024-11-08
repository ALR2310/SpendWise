// Initialize the custom select
document.querySelectorAll('div.select').forEach(select => {
    $(select).selectControl('init');
});


let accessToken = null;

$('#btn-login').on('click', async function () {
    let googleUser = await GoogleAuth.signIn();

    accessToken = googleUser.authentication.accessToken;

    console.log(googleUser);

    $('#text-Result').val(JSON.stringify(googleUser));
});

$('#btn-check').on('click', async function () {
    GoogleAuth.refresh()
        .then((data) => {
            console.log('Đã đăng nhập');
            console.log(data);
            accessToken = data.accessToken;
            $('#text-Result').val(JSON.stringify(data));
        })
        .catch((error) => {
            if (error.type === 'userLoggedOut') {
                this.signin();
            }
            console.log('Chưa đăng nhập');
            console.log(error);
            $('#text-Result').val(JSON.stringify(error));
        });
});

$('#btn-upload').on('click', async function () {
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    const metadata = {
        name: 'testUpload.txt',
        mimeType: 'text/plain',
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", new Blob(['Hello World'], { type: "text/plain" }));

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: new Headers({
                Authorization: `Bearer ${accessToken}`,
            }),
            body: form,
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Tệp đã được tải lên thành công:", data);
            $('#text-Result').val('Tệp đã được tải lên thành công: ' + JSON.stringify(data));
        } else {
            console.error("Lỗi khi tải lên tệp:", data);
            $('#text-Result').val('Lỗi khi tải lên tệp: ' + JSON.stringify(data));
        }
    } catch (error) {
        console.error("Lỗi không xác định:", error);
        $('#text-Result').val("Lỗi không xác định: " + error.message);
    }
});


$('#setting_data-import').on('click', async function () {
    const result = await FilePicker.pickFiles({ types: ['application/json'], readData: true });
    const file = result.files[0];

    const base64Data = file.data;

    try {
        const textDecoder = new TextDecoder();
        const decodedContent = textDecoder.decode(Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)));
        const data = JSON.parse(decodedContent);

        const listContainer = $('#modal_data_import_confirm .list');
        listContainer.empty();

        data.spendingList.forEach(list => {
            const count = _.filter(data.spendingItem, { spendlistid: list.id }).length;
            const button = $(`<button class="btn btn-sm btn-active w-full"><i class="fa-sharp fa-regular fa-list"></i> ${list.namelist} <div class="badge">${count}</div></button>`);
            listContainer.append(button);
        });

        data.noted.forEach(note => {
            // Tạo thẻ button cho noted không có badge
            const noteButton = $(`<button class="btn btn-sm btn-active w-full"><i class="fa-sharp fa-regular fa-note"></i> ${note.namelist}</button>`);
            listContainer.append(noteButton);
        });

        modal_data_import_confirm.showModal();
    } catch (error) {
        console.error('Error parsing JSON:', error);
        showToast('Có lỗi khi phân tích cú pháp tệp', 'error');
    }
});

function importData(data) {

}
