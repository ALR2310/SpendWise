const ModelRegistry = new Map<string, { props: Record<string, any>; classRef: any }>();

function registerModel(target: any) {
  const name = target.name;
  const props = Reflect.getMetadata('props', target) || {};
  if (!ModelRegistry.has(name)) {
    ModelRegistry.set(name, { props, classRef: target });
  }
}

export function getModelByTable(table: string): { props: Record<string, any>; classRef: any } | undefined {
  for (const [, entry] of ModelRegistry) {
    const modelName = entry.classRef.name.toLowerCase().replace('model', '');
    if (modelName === table) return entry;
  }
}

export function prop(options: { type: any; default?: any; enum?: any[]; index?: boolean; required?: boolean }) {
  return function (target: any, propertyKey: string) {
    const ctor = target.constructor;

    let props = Reflect.getOwnMetadata('props', ctor);
    if (!props) {
      const parentProps = Reflect.getMetadata('props', Object.getPrototypeOf(ctor)) || {};
      props = { ...parentProps };
      Reflect.defineMetadata('props', props, ctor);
    }

    props[propertyKey] = options;
    registerModel(ctor);
  };
}
