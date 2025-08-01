let counter = Math.floor(Math.random() * 0xffffff);

function cryptoRandomHex(length: number) {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function uniqueId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');

  const machineId = cryptoRandomHex(6);
  const processId = cryptoRandomHex(4);
  counter = (counter + 1) % 0xffffff;
  const counterHex = counter.toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counterHex;
}

export function getColumnType(type: any): string {
  if (type === Number) return 'REAL';
  if (type === String) return 'TEXT';
  if (type === Boolean) return 'INTEGER';
  if (type === Date) return 'TEXT';
  return 'TEXT';
}

function escapeValue(val: any): string {
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val === null) return 'NULL';
  return String(val);
}

function escapeRegex(val: string): string {
  const pattern = val.replace(/[\\']/g, (m) => '\\' + m);
  return `'${pattern}'`;
}

export function buildWhereCondition(condition: Record<string, any>): string[] {
  const clauses: string[] = [];

  if ('$or' in condition) {
    const orArray = condition.$or;
    if (!Array.isArray(orArray) || orArray.length === 0) {
      throw new Error(`$or expects a non-empty array`);
    }
    const orConditions = orArray.map((m: any) => `(${buildWhereCondition(m).join(' AND ')})`);
    return [`(${orConditions.join(' OR ')})`];
  }

  if ('$and' in condition) {
    const andArray = condition.$and;
    if (!Array.isArray(andArray) || andArray.length === 0) {
      throw new Error(`$and expects a non-empty array`);
    }
    const andConditions = andArray.map((m: any) => `(${buildWhereCondition(m).join(' AND ')})`);
    return [`(${andConditions.join(' AND ')})`];
  }

  for (const [key, value] of Object.entries(condition)) {
    if (typeof value !== 'object' || value === null) {
      clauses.push(`${key} = ${escapeValue(value)}`);
    } else {
      for (const [op, val] of Object.entries(value) as [string, any][]) {
        switch (op) {
          case '$eq':
            clauses.push(`${key} = ${escapeValue(val)}`);
            break;
          case '$ne':
            clauses.push(`${key} != ${escapeValue(val)}`);
            break;
          case '$gt':
            clauses.push(`${key} > ${escapeValue(val)}`);
            break;
          case '$gte':
            clauses.push(`${key} >= ${escapeValue(val)}`);
            break;
          case '$lt':
            clauses.push(`${key} < ${escapeValue(val)}`);
            break;
          case '$lte':
            clauses.push(`${key} <= ${escapeValue(val)}`);
            break;
          case '$in':
            if (!Array.isArray(val) || val.length === 0) {
              throw new Error(`$in expects a non-empty array`);
            }
            clauses.push(`${key} IN (${val.map(escapeValue).join(', ')})`);
            break;
          case '$nin':
            if (!Array.isArray(val) || val.length === 0) {
              throw new Error(`$nin expects a non-empty array`);
            }
            clauses.push(`${key} NOT IN (${val.map(escapeValue).join(', ')})`);
            break;
          case '$regex':
            if (typeof val !== 'string') {
              throw new Error(`$regex expects a string`);
            }
            clauses.push(`${key} LIKE ${escapeRegex(val)}`);
            break;
          default:
            throw new Error(`Unsupported operator: ${op}`);
        }
      }
    }
  }

  return clauses;
}

export function buildSelectFields(fields: string | string[], modelProps: any) {
  const fieldList = Array.isArray(fields) ? fields : fields.split(/\s+/);
  const expandedFields: string[] = [];

  const expandNested = (prefix: string, nestedModel: any) => {
    const nestedProps = Reflect.getMetadata('props', nestedModel) || {};
    for (const [subKey] of Object.entries(nestedProps)) {
      expandedFields.push(`${prefix}_${subKey}`);
    }
  };

  for (const field of fieldList) {
    if (field.includes('.')) {
      expandedFields.push(field.replace(/\./g, '_'));
    } else {
      const config = modelProps[field];
      const type = config?.type;

      const isNested = typeof type === 'function' && Reflect.getMetadata('props', type);
      if (isNested) {
        expandNested(field, type);
      } else {
        expandedFields.push(field);
      }
    }
  }

  return expandedFields;
}

export function tryParseJSON(value: any) {
  if (typeof value !== 'string') return value;
  if (!(value.startsWith('[') || value.startsWith('{'))) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function deepNestFromPrefix(obj: Record<string, any>): Record<string, any> {
  const result: any = {};

  for (const key in obj) {
    const value = obj[key];
    const parts = key.split('_');

    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  for (const key in result) {
    if (
      typeof result[key] === 'object' &&
      !Array.isArray(result[key]) &&
      Object.values(result[key]).some((v) => typeof v === 'string' && v.includes('_'))
    ) {
      result[key] = deepNestFromPrefix(result[key]);
    }
  }

  return result;
}
