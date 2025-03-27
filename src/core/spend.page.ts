import $ from 'jquery';
import '~/common/jquery.custom';
import { showToast } from '~/common/toast';
import { formatCurrency, formatDate, getDateTime } from '~/common/utils';
import templateBuilder from '~/common/template.builder';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { NoSqliteModel, Query } from '~/configs/nosql/db.wrapper';
import { SpendItemModel, SpendListModel } from '~/configs/nosql/db.models';
import { handleBackupData } from '~/configs/app.data';
import template from '~/page/spend.hbs';
import tableSpendItemTemplate from '~/templates/spend/table.spendItem.hbs';
import selectSpendListTemplate from '~/templates/spend/select.spendList.hbs';
import { confirmBox } from '~/common/confirm.box';
import { t } from 'i18next';
import logger from '~/configs/app.logger';

// Init model
const spendListModel = new NoSqliteModel(SpendListModel);
const spendItemModel = new NoSqliteModel(SpendItemModel);

// When module loaded
async function spendOnLoad() {
  // Render template
  $('#page-spend').html(templateBuilder(template));

  // Initialize the custom select
  document.querySelectorAll('div.select').forEach((select) => {
    $(select).selectControl('init');
  });

  // Initialize the custom combobox
  document.querySelectorAll('.combobox').forEach((combobox) => {
    $(combobox).comboboxControl();
  });

  // Global variable
  window.deleteSpendItem = deleteSpendItem;
  window.toggleDetailsRow = toggleDetailsRow;
  window.spendOnLoad = spendOnLoad;
  window.openModalSpendList = openModalSpendList;
  window.openModalSpendItem = openModalSpendItem;

  // Modal element
  const modal_spendList = document.getElementById('modal_spendList') as HTMLDialogElement;
  const modal_spendItem = document.getElementById('modal_spendItem') as HTMLDialogElement;

  // Variable for spendItem
  let offset = 0;
  const limit = 20;
  const loadThreshold = 100;

  // Function create or update spendList
  async function openModalSpendList(action: 'create' | 'update', name?: string) {
    const $el = $(modal_spendList);
    const title = $el.find('h3');
    const inputName = $el.find('#input_name');
    const btnCreate = $el.find('#btn_create');
    const btnDelete = $el.find('#btn_delete');
    const btnUpdate = $el.find('#btn_update');

    switch (action) {
      case 'create':
        title.text(t('spend.modal.spendList.title.create'));
        btnCreate.show();
        btnDelete.hide();
        btnUpdate.hide();
        inputName.val('');
        break;
      case 'update':
        title.text(t('spend.modal.spendList.title.update'));
        btnCreate.hide();
        btnDelete.show();
        btnUpdate.show();
        inputName.val(name!);
        break;
    }

    modal_spendList.showModal();
  }

  // Function to load spending list
  async function loadSpendList() {
    const spendList = await spendListModel.find({ status: 'Active' });
    $('#select_spendList').find('ul').html(templateBuilder(selectSpendListTemplate, { spendList }));
    $('#select_spendList').selectControl('init');

    await loadSpendItem();
  }
  await loadSpendList();

  // Button create, update and delete SpendList
  $(modal_spendList)
    .find('#btn_create, #btn_update, #btn_delete')
    .on('click', async function () {
      const action = this.id.replace('btn_', '');
      const listId = String($('#select_spendList').selectControl('get'));
      const listNameEl = $(this).closest('dialog').find('#input_name');
      const listNameVal = String(listNameEl.val());
      let insertId = listId;

      if ((action !== 'delete' && !listNameVal) || (action === 'delete' && !listId)) {
        return showToast(
          action === 'delete'
            ? t('spend.modal.spendList.message.delete.require')
            : t('spend.modal.spendList.message.create.require'),
          'warning',
        );
      }

      try {
        if (action === 'create') {
          const result = await spendListModel.insertOne({ name: listNameVal });
          showToast(t('spend.modal.spendList.message.create.success'), 'success', 3000);
          insertId = result._id!;
        } else if (action === 'update') {
          await spendListModel.updateById(listId, { name: listNameVal });
          showToast(t('spend.modal.spendList.message.update.success'), 'success', 3000);
        } else {
          const result = await confirmBox({
            title: t('spend.modal.spendList.message.delete.confirm.title'),
            message: t('spend.modal.spendList.message.delete.confirm.message'),
          });
          if (!result) return;
          await spendListModel.deleteById(listId);
          showToast(t('spend.modal.spendList.message.delete.success'), 'success', 3000);
          insertId = '';
        }

        await loadSpendList();
        if (action !== 'delete') {
          $('#select_spendList').selectControl('set', insertId);
        }

        listNameEl.val('');
        modal_spendList.close();
        handleBackupData();
      } catch (e) {
        console.log(e);
        showToast(t('error.general'), 'error');
      }
    });

  // Load suggest for Combobox
  async function loadSuggest() {
    try {
      const suggest = await Query('SELECT DISTINCT name FROM SpendItem WHERE status = 1 COLLATE NOCASE');
      $('#combobox_spendItem_name')
        .find('ul')
        .html(suggest.map((item: { Name: string }) => `<li>${item.Name}</li>`).join(''))
        .closest('.combobox')
        .comboboxControl();
    } catch (e) {
      console.error(e);
    }
  }

  // Function to load SpendItems when the app starts
  async function loadSpendItem(loadMore = false) {
    const listId = $('#select_spendList').selectControl('get');
    const searchKey = String($('#input_spendItem_search').val()).trim();
    const sortValue = $('#select_spendItem_sort').selectControl('get');
    const dateValue = String($('#input_spendItem_search_date').val()).trim();
    const tableWrapper = $('#table_spendItem_wrapper');

    loadSuggest();

    try {
      if (!listId) return;

      let sql = `SELECT * FROM SpendItem WHERE listId = ? AND status = 'Active'`;
      const params: any[] = [listId];

      if (searchKey) {
        sql += ` AND (name LIKE ? OR price LIKE ? OR details LIKE ?)`;
        params.push(`%${searchKey}%`, `%${searchKey}%`, `%${searchKey}%`);
      }

      if (dateValue) {
        sql += ` AND DATE(updatedAt) = DATE(?)`;
        params.push(dateValue);
      }

      sql += ` ORDER BY ${sortValue} DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const spendItems = await Query(sql, params);

      const templateCompiled = templateBuilder(tableSpendItemTemplate, {
        spendItems: spendItems.reverse(),
      });

      const tableBody = $('#table_spendItem').find('tbody');

      if (loadMore) tableBody.prepend(templateCompiled);
      else tableBody.html(templateCompiled);

      if (!loadMore) {
        tableWrapper.scrollTop(tableWrapper[0].scrollHeight);
      }
    } catch (e) {
      console.error(e);
      logger(e);
      showToast(t('error.general'), 'error');
    }
  }

  // Load more spendItems when the user scrolls to the top of the page
  $('#table_spendItem_wrapper').on('scroll', async function () {
    if ($(this).scrollTop()! <= loadThreshold) {
      offset += limit;
      await loadSpendItem(true);
    }
  });

  // Search SpendItem
  $('#input_spendItem_search').on(
    'input',
    debounce(async () => {
      offset = 0;
      await loadSpendItem();
    }, 200),
  );

  // Load spendItems when sort changes
  $('#select_spendList, #select_spendItem_sort').selectControl('change', async function () {
    await loadSpendItem();
  });

  // Show/Hide date input
  $('#input_spendItem_search_date').on('input', async function () {
    await loadSpendItem();
    if ($(this).val()) $(this).css('width', '128px');
    else $(this).css('width', '42px');
  });

  // Show modal Create or Update SpendItem
  function openModalSpendItem(action: 'create' | 'update', id?: string) {
    modal_spendItem.showModal();
    const dataRow = $('#table_spendItem').find(`tbody`).find(`tr[data-id="${id}"]`);
    const detailsRow = $(`#details-row-${id}`).find('p');

    const $el = $(modal_spendItem);
    const title = $el.find('h3');
    const inputId = $el.find('#input_spendItem_id');
    const inputName = $el.find('#combobox_spendItem_name').find('input');
    const inputDate = $el.find('#input_spendItem_date');
    const inputPrice = $el.find('#input_spendItem_price');
    const inputInfo = $el.find('#input_spendItem_info');
    const btnCreate = $el.find('#btn_create');
    const btnUpdate = $el.find('#btn_update');

    switch (action) {
      case 'create':
        title.text(t('spend.modal.spendItem.title.create'));
        btnCreate.show();
        btnUpdate.hide();

        inputId.val('');
        inputName.val('');
        inputDate.val(dayjs().format('YYYY-MM-DD'));
        inputPrice.val('');
        inputInfo.val('');
        break;
      case 'update':
        title.text(t('spend.modal.spendItem.title.update'));
        btnCreate.hide();
        btnUpdate.show();

        inputId.val(id!);
        inputName.val(dataRow.find('td').eq(1).text());
        inputDate.val(formatDate(dataRow.find('td').eq(0).text(), 'yyyy-mm-dd', 'dd/mm/yyyy'));
        inputPrice.val(dataRow.find('td').eq(2).text().replace('₫', '')?.trim());
        inputInfo.val(detailsRow.text());
        break;
    }
  }

  // Button create and update spendItem
  $(modal_spendItem)
    .find('#btn_create, #btn_update')
    .on('click', async function () {
      const action = this.id.replace('btn_', '');
      const itemId = String($('#input_spendItem_id').val());
      const listId = String($('#select_spendList').selectControl('get'));
      const name = String($('#combobox_spendItem_name').find('input').val()).trim();
      const date = getDateTime(String($('#input_spendItem_date').val()));
      const price = parseInt(String($('#input_spendItem_price').val())!.trim().replace(/\./g, '')) || 0;
      const details = String($('#input_spendItem_info').val()).trim() || 'Không có thông tin';
      const dataRow = $('#table_spendItem').find(`tbody`).find(`tr[data-id="${itemId}"]`);
      const detailsRow = $(`#details-row-${itemId}`).find('p');

      try {
        if (action == 'create') {
          if (!listId) return showToast(t('spend.modal.spendItem.message.create.require.list'), 'warning');
          else if (!name) return showToast(t('spend.modal.spendItem.message.create.require.name'), 'warning');

          await spendItemModel.insertOne({ listId, name, price, details, date });
          loadSpendItem();
        } else if (action == 'update') {
          if (!itemId) return showToast(t('spend.modal.spendItem.message.update.require.id'), 'warning');
          if (!name) return showToast(t('spend.modal.spendItem.message.create.require.name'), 'warning');

          await spendItemModel.updateById(itemId, { name, price, details, date });

          dataRow.find('td').eq(0).text(formatDate(date, 'dd/mm/yyyy'));
          dataRow.find('td').eq(1).text(name);
          dataRow.find('td').eq(2).text(formatCurrency(price));
          detailsRow.text(details);
        }

        modal_spendItem.close();
        handleBackupData();
      } catch (e) {
        console.log(e);
        showToast(t('error.general'), 'error');
      }
    });

  // Function to delete spendItem
  async function deleteSpendItem(id: string) {
    if (!id) return showToast(t('spend.modal.spendItem.message.delete.require'), 'warning');
    
    try {
      await spendItemModel.deleteById(id);
      $('#table_spendItem').find(`tbody`).find(`tr[data-id="${id}"]`).remove();
      $('#details-row-' + id).remove();
      handleBackupData();
    } catch (e) {
      console.log(e);
      showToast(t('error.general'), 'error');
    }
  }

  function toggleDetailsRow(id: string, row: HTMLElement) {
    const detailsRow = document.getElementById(`details-row-${id}`);
    const icon = document.getElementById(`icon-${id}`);

    $(row).toggleClass('border-b-0');

    if (detailsRow) {
      detailsRow.classList.toggle('hidden');
      icon!.classList.toggle('fa-chevron-down');
      icon!.classList.toggle('fa-chevron-up');
    }
  }
}

spendOnLoad();

export {};
