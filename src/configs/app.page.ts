import $ from 'jquery';

const updateBottomNav = (btnId: string) =>
  $('#dock-nav button')
    .removeClass('dock-active')
    .find('i')
    .removeClass('fa-solid fa-regular')
    .end()
    .filter(`#${btnId}`)
    .addClass('dock-active')
    .find('i')
    .addClass('fa-solid');

export const pageManager = {
  show: (page: string) => {
    const $page = $(`#page-${page}`);
    if (!$page.html()) import(`../core/${page}.page.ts`).catch(console.error);
    $('#page-container > div').hide();
    $page.show();
    updateBottomNav(`${page}-btn`);
  },
};

$('#dock-nav').on('click', 'button', (e) => pageManager.show($(e.currentTarget).data('page')));
