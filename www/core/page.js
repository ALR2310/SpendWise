function themeIconChange(themeDefault = 'light') {
    if ($('html').data('theme') == themeDefault) {
        $('.theme-controller').prop('checked', true);
    }
}

async function showPage(page = 'spend', forceReload = false) {
    async function loadContentOnce(sectionId, file, data = {}, force = false) {
        const section = $('#' + sectionId);

        if (section.html().trim() && !force) return section.show();

        try {
            const response = await fetch(file);
            if (!response.ok) return showToast('Không thể tải nội dung', 'error');

            const content = await response.text();
            const compiledContent = Handlebars.compile(content);
            const html = compiledContent(data);
            section.html(html);
        } catch (e) {
            console.error(e);
        }
    }

    function showContent(sectionId, buttonId, file, data, force = false) {
        $("#page > div").hide();
        $("#" + sectionId).show();
        loadContentOnce(sectionId, file, data, force);

        $(".btm-nav button").removeClass("active");
        $(".btm-nav button i").removeClass("fa-solid").addClass("fa-regular");
        $("#" + buttonId).addClass("active");
        $("#" + buttonId + " i").removeClass("fa-regular").addClass("fa-solid");
    }

    $("#spend-btn").on('click', async function () {
        const spendList = await db.query('SELECT * FROM SpendList WHERE STATUS = ?', [1]);
        showContent("page-spend", this.id, "pages/spend.hbs", { spendList: spendList }, forceReload);
    });
    $("#stats-btn").on('click', function () { showContent("page-stats", this.id, "pages/stats.hbs", {}, forceReload); });
    $("#note-btn").on('click', function () { showContent("page-note", this.id, "pages/note.hbs", {}, forceReload); });
    $("#setting-btn").on('click', function () { showContent("page-setting", this.id, "pages/setting.hbs", {}, forceReload); });

    $(`#${page}-btn`).trigger('click');
}

function resetPage(pages = [], openPage) {
    const pagesValid = ['spend', 'stats', 'note', 'setting'];
    let pageActive = $('#page > div:visible').attr('id').replace('page-', '');

    if (!openPage && pages.includes(pageActive)) openPage = pageActive;
    if (!Array.isArray(pages) || pages.length === 0) pages = [...pagesValid];

    pages.forEach(page => {
        if (pagesValid.includes(page)) {
            const section = $(`#page-${page}`);
            if (section.length) section.empty();
        }
    });

    if (openPage) showPage(openPage, true);
}

export default { themeIconChange, showPage, resetPage };
