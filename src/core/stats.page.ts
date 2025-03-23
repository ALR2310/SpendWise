import templateBuilder from '~/common/template.builder';
import template from '~/page/stats.hbs';

// When module loaded
async function statsOnLoad() {
  $('#page-stats').html(templateBuilder(template));

  // Global variable
  window.statsOnLoad = statsOnLoad;
}

statsOnLoad();

export {};
