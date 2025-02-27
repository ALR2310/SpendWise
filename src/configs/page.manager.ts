import { NoSqliteModel } from '~/configs/nosql/db.wrapper';
import { SpendListModel } from '~/configs/nosql/db.models';
import noteTemplate from '../clients/pages/note.hbs';
import settingTemplate from '../clients/pages/setting.hbs';
import spendTemplate from '../clients/pages/spend.hbs';
import statsTemplate from '../clients/pages/stats.hbs';
import templateBuilder from '../common/template.builder';
import $ from 'jquery';
import driveIcon from '../assets/images/drive.png';
import { appSettings } from './app.settings';

const spendListModel = new NoSqliteModel(SpendListModel);

export async function showPage(pageName: string, forceReload: boolean = false) {
  showButtonBottomNav(`${pageName}-btn`);
  const pageContainer = $(`#page-container`);
  const pageContent = $(`#page-${pageName}`);

  pageContainer.children('div').not(pageContent).hide();
  pageContent.show();

  if (forceReload) pageContent.empty();

  if (!pageContent.html())
    switch (pageName) {
      case 'spend':
        try {
          const data = await getDataForPage(pageName);
          const templateCompiled = templateBuilder(spendTemplate, data);
          pageContent.html(templateCompiled);
          import('../page/spend.page');
        } catch (e) {
          console.error(e);
        }
        break;
      case 'stats':
        try {
          const data = await getDataForPage(pageName);
          const templateCompiled = templateBuilder(statsTemplate, data);
          pageContent.html(templateCompiled);
          import('../page/stats.page');
        } catch (e) {
          console.error(e);
        }
        break;
      case 'note':
        try {
          const data = await getDataForPage(pageName);
          const templateCompiled = templateBuilder(noteTemplate, data);
          pageContent.html(templateCompiled);
          import('../page/note.page');
        } catch (e) {
          console.error(e);
        }
        break;
      case 'setting':
        try {
          const appVersion = appSettings.get('general.version');
          const data = await getDataForPage(pageName);
          const templateCompiled = templateBuilder(settingTemplate, {
            driveIcon,
            ...data,
            appVersion,
          });
          pageContent.html(templateCompiled);
          import('../page/setting.page');
        } catch (e) {
          console.error(e);
        }
        break;
    }
}

function resetPage(pageName: string[] = []) {
  pageName.forEach((page) => {
    $(`#page-${page}`).empty();
  });
}

function showButtonBottomNav(buttonId: string) {
  const buttonElement = $(`#${buttonId}`);
  const buttonIconElement = $(`#${buttonId} i`);

  $('#btm-nav button').removeClass('active');
  $('#btm-nav button i').removeClass('fa-solid').addClass('fa-regular');
  buttonElement.addClass('active');
  buttonIconElement.removeClass('fa-regular').addClass('fa-solid');
}

async function getDataForPage(pageName: string) {
  switch (pageName) {
    case 'spend':
      const spendList = await spendListModel.find({ status: 'Active' });
      return { spendList };
    case 'stats':
      return {};
    case 'note':
      return {};
    case 'setting':
      return {};
  }
}

class PageManager {
  show(pageName: 'spend' | 'stats' | 'note' | 'setting', force: boolean = false) {
    showPage(pageName, force);
  }

  reset(pageName: 'spend' | 'stats' | 'note' | 'setting') {
    resetPage([pageName]);
  }
}

$('#spend-btn').on('click', () => {
  showPage('spend');
});
$('#stats-btn').on('click', () => {
  showPage('stats');
});
$('#note-btn').on('click', () => {
  showPage('note');
});
$('#setting-btn').on('click', () => {
  showPage('setting');
});

export const pageManager = new PageManager();
