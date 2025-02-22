import handlebars from 'handlebars';

export default function templateBuilder(template: string, data: any): string {
  const templates = handlebars.compile(template);
  return templates(data);
}
