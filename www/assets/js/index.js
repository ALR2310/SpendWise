$(document).ready(function () {
    if ($('html').data('theme') == 'light') {
        $('.theme-controller').prop('checked', true);
    }
});

$(document).on('deviceready', () => {
    // Hàm tải nội dung bất đồng bộ và chỉ gán một lần
    async function loadContentOnce(sectionId, file) {
        const section = $('#' + sectionId);

        // Nếu phần tử đã có nội dung, chỉ cần hiển thị
        if (section.html().trim()) return $("#" + sectionId).show();
        try {
            const response = await fetch(file);
            if (!response.ok) return showToast('Không thể tải nội dung', 'error');

            const content = await response.text();
            const compiledContent = Handlebars.compile(content);
            const html = compiledContent();
            $('#' + sectionId).html(html);
        } catch (e) {
            console.error(e);
        }
    }

    // Hàm điều khiển hiển thị nội dung và cập nhật trạng thái nút
    function showContent(sectionId, buttonId, file) {
        $("#content > div").hide();
        $("#" + sectionId).show();
        $(".btm-nav button").removeClass("active");
        $(".btm-nav button i").removeClass("fa-solid").addClass("fa-regular");

        loadContentOnce(sectionId, file);
        $("#" + buttonId).addClass("active");
        $("#" + buttonId + " i").removeClass("fa-regular").addClass("fa-solid");
    }


    // Gán sự kiện click vào các nút để mở nội dung chỉ một lần
    $("#spend-btn").click(() => showContent("spend-content", "spend-btn", "assets/views/spend.hbs"));
    $("#stats-btn").click(() => showContent("stats-content", "stats-btn", "assets/views/stats.hbs"));
    $("#note-btn").click(() => showContent("note-content", "note-btn", "assets/views/note.hbs"));
    $("#setting-btn").click(() => showContent("setting-content", "setting-btn", "assets/views/setting.hbs"));

    // Hiển thị nội dung mặc định khi tải trang
    showContent("spend-content", "spend-btn", "assets/views/spend.hbs");
});






