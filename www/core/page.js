export function themeIconChange(themeDefault = 'light') {
    if ($('html').data('theme') == themeDefault) {
        $('.theme-controller').prop('checked', true);
    }
};


export async function showPage(page = 'spend') {
    async function loadContentOnce(sectionId, file, data = {}) {
        const section = $('#' + sectionId);

        // Nếu phần tử đã có nội dung, chỉ cần hiển thị
        if (section.html().trim()) return $("#" + sectionId).show();
        try {
            const response = await fetch(file);
            if (!response.ok) return showToast('Không thể tải nội dung', 'error');

            const content = await response.text();
            const compiledContent = Handlebars.compile(content);
            const html = compiledContent(data);
            $('#' + sectionId).html(html);
        } catch (e) {
            console.error(e);
        }
    }

    function showContent(sectionId, buttonId, file, data) {
        $("#page > div").hide();
        $("#" + sectionId).show();
        loadContentOnce(sectionId, file, data);

        $(".btm-nav button").removeClass("active");
        $(".btm-nav button i").removeClass("fa-solid").addClass("fa-regular");
        $("#" + buttonId).addClass("active");
        $("#" + buttonId + " i").removeClass("fa-regular").addClass("fa-solid");
    }

    $("#spend-btn").on('click', async function () {
        const spendList = await db.query('SELECT * FROM SpendList WHERE STATUS = ?', [1]);
        showContent("page-spend", this.id, "pages/spend.hbs", { spendList: spendList });
    });
    $("#stats-btn").on('click', function () { showContent("page-stats", this.id, "pages/stats.hbs"); });
    $("#note-btn").on('click', function () { showContent("page-note", this.id, "pages/note.hbs"); });
    $("#setting-btn").on('click', function () { showContent("page-setting", this.id, "pages/setting.hbs"); });

    $(`#${page}-btn`).trigger('click');
}