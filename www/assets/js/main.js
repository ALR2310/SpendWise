// Hàm showToast sử dụng giao diện daisyUI
function showToast(message, type, duration = 3000) {
    const toastContainer = document.getElementById("toast-container");
    const toastId = `toast-${Date.now()}`; // Tạo ID duy nhất cho toast

    // Tạo phần tử toast mới
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `alert alert-${type} p-2 flex justify-between text-white`;

    // Cấu trúc nội dung của toast
    toast.innerHTML = `
        <div>
            <i class="fa-sharp fa-regular ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : type === 'info' ? 'fa-circle-info' : 'fa-triangle-exclamation'}"></i>
            <span class="text-wrap">${message}</span>
        </div>
        <button class="btn btn-${type} btn-xs btn-circle text-white" onclick="closeToast('${toastId}')">
            <i class="fa-light fa-xmark"></i>
        </button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => { closeToast(toastId); }, duration);
}

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.animation = 'toast-pop-out 0.5s ease-out forwards';
        setTimeout(() => { toast.remove(); }, 500);
    }
}

function getTime() {
    // Lấy thời gian hiện tại
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); // Định dạng giờ
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Định dạng phút
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Định dạng giây

    return `${hours}:${minutes}:${seconds}`;
}

function convertPlaceHbs(template, options = { from: { start: "%", end: "%" }, to: { start: "{{", end: "}}" } }) {
    try {
        const { from, to } = options;
        const startRegex = new RegExp(from.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '([^]*?)' + from.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
        // Tìm các cặp mở và đóng trong template

        return template.replace(startRegex, function (match, p1) {
            // Thực hiện thay thế trong từng cặp
            return to.start + p1.replace(new RegExp(to.start.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.start)
                .replace(new RegExp(to.end.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), from.end) + to.end;
        });
    } catch (e) {
        console.log(e);
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatCurrency(value, symbol = true) {
    value = value.toString().replace(/\./g, '');
    let formattedValue = new Intl.NumberFormat('vi-VN').format(value);
    return symbol ? `${formattedValue} ₫` : formattedValue;
}


Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);