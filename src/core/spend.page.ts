import $ from 'jquery';
import '~/common/jquery.custom';
import {
  convertPlaceHbs,
  formatCurrency,
  formatDate,
  getDateTime,
  showToast,
} from '~/common/utils';
import templateBuilder from '~/common/template.builder';
import { debounce } from 'lodash';
import dayjs from 'dayjs';
import { NoSqliteModel, Query } from '~/configs/nosql/db.wrapper';
import { SpendItemModel, SpendListModel } from '~/configs/nosql/db.models';

// init model
const spendListModel = new NoSqliteModel(SpendListModel);
const spendItemModel = new NoSqliteModel(SpendItemModel);

// Initialize the custom select
document.querySelectorAll('div.select').forEach((select) => {
  $(select).selectControl('init');
});

// Initialize the custom combobox
document.querySelectorAll('.combobox').forEach((combobox) => {
  $(combobox).comboboxControl();
});

// Modal element
const modal_spendList = document.getElementById(
  'modal_spendList',
) as HTMLDialogElement;
const modal_spendList_delete = document.getElementById(
  'modal_spendList_delete',
) as HTMLDialogElement;
const modal_spendItem = document.getElementById(
  'modal_spendItem',
) as HTMLDialogElement;

// Load suggest for Combobox
async function loadSuggest() {
  try {
    const suggest = await Query(
      'SELECT DISTINCT name FROM SpendItem WHERE status = 1 COLLATE NOCASE',
    );
    $('#combobox_spendItem_name')
      .find('ul')
      .html(
        suggest
          .map((item: { Name: string }) => `<li>${item.Name}</li>`)
          .join(''),
      )
      .closest('.combobox')
      .comboboxControl();
  } catch (e) {
    console.error(e);
  }
}

// Function to load SpendItems when the app starts
async function loadSpendItem() {
  const listId = $('#select_spendList').selectControl('get');
  const searchKey = String($('#input_spendItem_search').val()).trim();
  const sortValue = $('#select_spendItem_sort').selectControl('get');
  const dateValue = String($('#input_spendItem_search_date').val()).trim();

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

    sql += ` ORDER BY ${sortValue}`;

    const spendItems = await Query(sql, params);

    const template = convertPlaceHbs($('#table_spendItem_template').html());
    const templateCompiled = templateBuilder(template, {
      spendItems: spendItems,
    });
    $('#table_spendItem').find('tbody').html(templateCompiled);
  } catch (e) {
    console.error(e);
    showToast('Tải dữ liệu thất bại', 'error');
  }
}

// Search SpendItem
$('#input_spendItem_search').on(
  'input',
  debounce(() => {
    loadSpendItem();
  }, 200),
);

// Load spendItems when the app starts and when the list and sort changes
loadSpendItem();
$('#select_spendList, #select_spendItem_sort').selectControl(
  'change',
  function () {
    loadSpendItem();
  },
);

// Show/Hide date input
$('#input_spendItem_search_date').on('input', async function () {
  loadSpendItem();
  if ($(this).val()) $(this).css('width', '128px');
  else $(this).css('width', '42px');
});

// Button create SpendList
$('#btn_spendList_create').on('click', async function () {
  const name = String($('#input_spendList_name').val());

  if (name) {
    try {
      const result = await spendListModel.insertOne({
        name: name,
      });

      showToast('Tạo danh sách thành công', 'success', 3000);
      $('#input_spendList_name').val('');
      modal_spendList.close();

      const escapedName = $('<div>').text(name).html();
      const html = `
                <li class="flex justify-between" data-value="${result._id}">${escapedName}
                    <button class="btn btn-ghost btn-sm text-error" 
                        onclick="modal_spendList_delete.showModal();setTimeout(() => {$('#modal_spendList_delete').find('h3').text($('#select_spendList').selectControl('name'))}, 50);">
                        <i class="fa-sharp fa-trash"></i> Xoá
                    </button>
                </li>`;
      $('#select_spendList').find('ul').append(html);
      $('#select_spendList').selectControl('init');
      $('#select_spendList').selectControl('set', `${result._id}`);
    } catch (e) {
      console.log(e);
      showToast('Tạo danh sách thất bại', 'error');
    }
  } else {
    showToast('Vui lòng nhập tên danh sách chi tiêu', 'warning');
  }
});

// Button delete SpendList
$('#btn_spendList_delete').on('click', async function () {
  const listId = String($('#select_spendList').selectControl('get'));

  if (listId)
    try {
      await spendListModel.deleteById(listId);
      showToast('Xoá danh sách thành công', 'success');
      modal_spendList_delete.close();
      $('#select_spendList').selectControl('del', listId);
    } catch (e) {
      console.log(e);
      showToast('Xoá danh sách thất bại', 'error');
    }
  else showToast('Vui lòng chọn danh sách muốn xoá', 'warning');
});

// Function to open modal Create and Update SpendItem
function showSpendItemModal(id: string) {
  modal_spendItem.showModal();
  const spendItem = $('#table_spendItem')
    .find(`tbody`)
    .find(`tr[data-id="${id}"]`);

  if (id) {
    $('#modal_spendItem').find('h3').text('Cập nhật chi tiêu');
    $('#btn_spendItem_update').show();
    $('#btn_spendItem_create').hide();

    $('#input_spendItem_id').val(id);
    $('#combobox_spendItem_name')
      .find('input')
      .val(spendItem.find('td').eq(1).text());
    $('#input_spendItem_date').val(
      formatDate(spendItem.find('td').eq(0).text(), 'yyyy-mm-dd', 'dd/mm/yyyy'),
    );

    $('#input_spendItem_price').val(spendItem.find('td').eq(2).text());
    $('#input_spendItem_info').val(spendItem.find('td').eq(3).text());
  } else {
    $('#modal_spendItem').find('h3').text('Thêm chi tiêu');
    $('#btn_spendItem_update').hide();
    $('#btn_spendItem_create').show();
    $('#input_spendItem_id').val('');
    $('#combobox_spendItem_name').find('input').val('');
    $('#input_spendItem_date').val(dayjs().format('YYYY-MM-DD'));
    $('#input_spendItem_price').val('');
    $('#input_spendItem_info').val('');
  }
}

// @ts-ignore
window.showSpendItemModal = showSpendItemModal;

// Button create SpendItem
$('#btn_spendItem_create').on('click', async function () {
  const listId = String($('#select_spendList').selectControl('get'));
  const name = String($('#combobox_spendItem_name').find('input').val()).trim();
  const dateTime = getDateTime(String($('#input_spendItem_date').val()));
  const price =
    parseInt(
      String($('#input_spendItem_price').val())!.trim().replace(/\./g, ''),
    ) || 0;
  const details =
    String($('#input_spendItem_info').val()).trim() || 'Không có thông tin';

  try {
    await spendItemModel.insertOne({
      listId: listId,
      name: name,
      price: price,
      details: details,
      date: dateTime,
    });
    modal_spendItem.close();
    loadSpendItem();
  } catch (e) {
    console.log(e);
    showToast('Thêm chi tiêu thất bại', 'error');
  }
});

// Button update SpendItem
$('#btn_spendItem_update').on('click', async function () {
  const id = String($('#input_spendItem_id').val());
  const name = String($('#combobox_spendItem_name').find('input').val()).trim();
  const dateTime = getDateTime(String($('#input_spendItem_date').val()));
  const price =
    parseInt(
      String($('#input_spendItem_price').val())!.trim().replace(/\./g, ''),
    ) || 0;
  const details =
    String($('#input_spendItem_info').val()).trim() || 'Không có thông tin';

  try {
    await spendItemModel.updateById(id, {
      name: name,
      price: price,
      details: details,
      date: dateTime,
    });

    modal_spendItem.close();

    const spendItem = $('#table_spendItem')
      .find(`tbody`)
      .find(`tr[data-id="${id}"]`);
    spendItem.find('td').eq(0).text(formatDate(dateTime, 'dd/mm/yyyy'));
    spendItem.find('td').eq(1).text(name);
    spendItem.find('td').eq(2).text(formatCurrency(price));
    spendItem.find('td').eq(3).text(details);
  } catch (e) {
    console.log(e);
    showToast('Cập nhật chi tiêu thất bại', 'error');
  }
});

export {};
