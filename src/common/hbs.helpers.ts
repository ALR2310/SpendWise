import Handlebars from 'handlebars';
import { formatCurrency, formatDate } from "./utils";
import i18n from '~/configs/app.language';

Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatCurrency', formatCurrency);
Handlebars.registerHelper('t', (key: string) => {
  return i18n.t(key);
});