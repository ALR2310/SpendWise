import 'reflect-metadata';

export function prop(options: {
  required?: boolean;
  default?: any;
  enum?: string[];
  unique?: boolean;
  index?: boolean;
  key?: boolean;
  type: any;
}) {
  return function (target: any, propertyKey: string) {
    const existingProps = Reflect.getMetadata('props', target) || {};
    existingProps[propertyKey] = options;
    Reflect.defineMetadata('props', existingProps, target);
  };
}

export function table(name: string) {
  return function (constructor: Function) {
    Reflect.defineMetadata('tableName', name, constructor);
  };
}
