$(document).on('deviceready', () => {
    // Hàm tải nội dung bất đồng bộ và chỉ gán một lần
    async function loadContentOnce(sectionId, file) {
        const section = document.getElementById(sectionId);

        // Nếu phần tử đã có nội dung, chỉ cần hiển thị
        if (section.innerHTML.trim()) {
            $("#" + sectionId).show();
            return;
        }

        try {
            const response = await fetch(file);
            if (!response.ok) {
                showToast('Không thể tải nội dung', 'error');
                throw new Error(`Không thể tải tệp ${file}`);
            }

            const content = await response.text();
            section.innerHTML = content;
            $("#" + sectionId).show();
        } catch (error) {
            console.error(error);
        }
    }

    // Hàm điều khiển hiển thị nội dung và cập nhật trạng thái nút
    function showContent(sectionId, buttonId, file) {
        $("#content > div").hide();
        $(".btm-nav button").removeClass("active");

        loadContentOnce(sectionId, file);
        $("#" + buttonId).addClass("active");
    }

    // Gán sự kiện click vào các nút để mở nội dung chỉ một lần
    $("#spend-btn").click(() => showContent("spend-content", "spend-btn", "assets/views/spend.hbs"));
    $("#stats-btn").click(() => showContent("stats-content", "stats-btn", "assets/views/stats.hbs"));
    $("#note-btn").click(() => showContent("note-content", "note-btn", "assets/views/note.hbs"));
    $("#setting-btn").click(() => showContent("setting-content", "setting-btn", "assets/views/setting.hbs"));

    // Hiển thị nội dung mặc định khi tải trang
    showContent("spend-content", "spend-btn", "assets/views/spend.hbs");
});
