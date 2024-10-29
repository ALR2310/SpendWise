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

    document.addEventListener('click', (e) => {
        if (!combobox.contains(e.target)) {
            list.style.display = 'none';
        }
    });
});