import $ from 'jquery';

export default {
    showToast(message, type, duration = 3000) {
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
    },

    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.animation = 'toast-pop-out 0.5s ease-out forwards';
            setTimeout(() => { toast.remove(); }, 500);
        }
    },

    getTime() {
        // Lấy thời gian hiện tại
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0'); // Định dạng giờ
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Định dạng phút
        const seconds = String(now.getSeconds()).padStart(2, '0'); // Định dạng giây

        return `${hours}:${minutes}:${seconds}`;
    },

    convertPlaceHbs(template, options = { from: { start: "%", end: "%" }, to: { start: "{{", end: "}}" } }) {
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
    },

    formatDate(dateStr, output = "dd/mm/yyyy", input = "yyyy-mm-dd") {
        let day, month, year;

        const datePart = dateStr.split("T")[0].split(" ")[0];

        switch (input.split(" ")[0]) {
            case "dd-mm-yyyy": [day, month, year] = datePart.split("-"); break;
            case "mm-dd-yyyy": [month, day, year] = datePart.split("-"); break;
            case "yyyy-mm-dd": [year, month, day] = datePart.split("-"); break;
            case "yyyy-dd-mm": [year, day, month] = datePart.split("-"); break;
            case "dd/mm/yyyy": [day, month, year] = datePart.split("/"); break;
            case "mm/dd/yyyy": [month, day, year] = datePart.split("/"); break;
            case "yyyy/mm/dd": [year, month, day] = datePart.split("/"); break;
            case "yyyy/dd/mm": [year, day, month] = datePart.split("/"); break;
            default: throw new Error("Định dạng đầu vào không được hỗ trợ");
        }

        const date = new Date(year, month - 1, day);
        day = String(date.getDate()).padStart(2, "0");
        month = String(date.getMonth() + 1).padStart(2, "0");
        year = date.getFullYear();

        return output
            .replace("dd", day)
            .replace("mm", month)
            .replace("yyyy", year);
    },

    formatCurrency(value, symbol = true) {
        value = value.toString().replace(/\./g, '');
        let formattedValue = new Intl.NumberFormat('vi-VN').format(value);
        return symbol ? `${formattedValue} ₫` : formattedValue;
    }
};

// --------------------- Custom function Jquery -------------------------


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
        selectElement.off('click').on('click', () => { optionsList.toggle(); });
        optionsList.find('li').off('click').on('click', function (e) {
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
        $(document).off('click').on('click', (e) => {
            $('div.select ul').each(function () {
                if (!this.parentNode.contains(e.target)) {
                    $(this).hide();
                }
            });
        });
    }).length === 1 ? result : this;
};

$.fn.comboboxControl = function () {
    return this.each(function () {
        const combobox = $(this);
        const input = combobox.find('input');
        const list = combobox.find('ul');
        const items = list.find('li');

        // Helper function to get text content from li
        const getTextContent = (element) => $(element).text().trim();

        // Filter items based on user input
        input.on('input', function () {
            const filter = input.val().trim().toLowerCase();
            let hasVisibleItem = false;

            items.each(function () {
                const itemText = getTextContent(this).toLowerCase();
                if (itemText.includes(filter)) {
                    $(this).show();
                    hasVisibleItem = true;
                } else $(this).hide();

            });

            list.toggle(hasVisibleItem);
        });

        // Select an item from the list when clicked
        items.on('click', function () {
            const text = getTextContent(this);
            input.val(text);
            list.hide();
        });

        // Close the list when clicking outside of the combobox
        $(document).on('click', function (e) {
            if (!combobox[0].contains(e.target)) list.hide();
        });
    });
};