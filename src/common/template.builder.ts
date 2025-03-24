import handlebars from 'handlebars';

/**
 * Build a template with given data.
 * @param {string | HTMLTemplateElement} template - The template source string or HTMLTemplateElement
 * @param {Object} data - The data to be passed to the template
 * @returns {string} The rendered template
 */
export default function templateBuilder(template: string | HTMLTemplateElement, data?: any): string {
  const templates = handlebars.compile(template instanceof HTMLTemplateElement ? template.innerHTML : template);
  return templates(data || {});
}

/**
 * Remove Handlebars comments from a template.
 * @param {string} template - The template source string
 * @returns {string} The template without Handlebars comments
 */
export function clearComments(template: string): string {
  return template.replace(/{{!--[\s\S]*?--}}|{{![^}]*}}/g, '');
}
