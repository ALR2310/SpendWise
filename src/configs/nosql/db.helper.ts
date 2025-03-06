import 'reflect-metadata';
import db from './db.config';

export function buildQueryCreateTableFromModel(model: any): string {
  const tableName: string = Reflect.getMetadata('tableName', model);
  const props: Record<string, any> = Reflect.getMetadata('props', model.prototype) || {};

  let query = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  const columns: string[] = [];

  for (const [key, options] of Object.entries(props)) {
    let columnDefinition = `${key} ${options.type.name}`;

    if (options.enum) {
      const enumValues = options.enum.map((value: string) => `'${value}'`).join(', ');
      columnDefinition += ` CHECK(${key} IN (${enumValues}))`;
    }

    if (options.required) columnDefinition += ' NOT NULL';
    if (options.key) columnDefinition += ' PRIMARY KEY';
    if (options.default !== undefined) columnDefinition += ` DEFAULT '${options.default}'`;

    columns.push(columnDefinition);
  }

  query += columns.join(',\n') + '\n);';
  return query;
}

export function buildQueryCreateIndexFromModel(model: any): string[] {
  const tableName: string = Reflect.getMetadata('tableName', model);
  const props: Record<string, any> = Reflect.getMetadata('props', model.prototype) || {};

  const queries: string[] = [];

  for (const [key, options] of Object.entries(props)) {
    if (options.index) {
      const indexName = `idx_${tableName}_${key}`;
      queries.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${key});`);
    }
  }

  return queries;
}

export async function checkExistsTable(tableName: string): Promise<boolean> {
  const tables = await db.query(`SELECT tbl_name FROM sqlite_master WHERE type='table' AND tbl_name = ?`, [tableName]);
  return tables.length > 0;
}

export async function compareTableWithModel(model: any): Promise<{
  columnsToAdd: { name: string; sql: string }[];
  columnsToRemove: string[];
} | null> {
  const tableName: string = Reflect.getMetadata('tableName', model);
  const props: Record<string, any> = Reflect.getMetadata('props', model.prototype) || {};

  const existingColumns = await db.query(`PRAGMA table_info(${tableName});`);

  const existingColumnNames = existingColumns.map((column: any) => column.name);

  const modelColumnNames = Object.keys(props);

  const columnsToAdd = modelColumnNames
    .filter((column: any) => !existingColumnNames.includes(column))
    .map((column: any) => {
      const options = props[column];
      let columnDefinition = `${column} ${options.type.name}`;

      if (options.enum) {
        const enumValues = options.enum.map((value: string) => `'${value}'`).join(', ');
        columnDefinition += ` CHECK(${column} IN (${enumValues}))`;
      }

      if (options.required) columnDefinition += ' NOT NULL';
      if (options.key) columnDefinition += ' PRIMARY KEY';

      return { name: column, sql: columnDefinition };
    });

  const columnsToRemove = existingColumnNames.filter((column: any) => !modelColumnNames.includes(column));

  if (columnsToAdd.length === 0 && columnsToRemove.length === 0) return null;

  return { columnsToAdd, columnsToRemove };
}

export async function dropIndexFromModel(model: any) {
  const tableName: string = Reflect.getMetadata('tableName', model);

  const tableIndexs = await db.query(
    `SELECT * FROM sqlite_master WHERE type='index' AND 
    tbl_name = ? AND name NOT LIKE '%sqlite_autoindex%'`,
    [tableName],
  );

  const queries = tableIndexs.map((index: any) => ({
    sql: `DROP INDEX IF EXISTS ${index.name};`,
  }));
  await db.queryAll(queries);
}

export async function createIndexFromModel(model: any) {
  const arrQuery = buildQueryCreateIndexFromModel(model);

  const queries = arrQuery.map((query) => ({ sql: query }));
  await db.queryAll(queries);
}
