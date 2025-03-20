import db from './db.config';
import 'reflect-metadata';
import {
  buildQueryCreateTableFromModel,
  checkExistsTable,
  compareTableWithModel,
  createIndexFromModel,
  dropIndexFromModel,
} from './db.helper';
import dayjs from 'dayjs';
import { QueryFilter } from './db.type';
import { UniqueId } from '~/common/utils';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

export async function Query(sql: string, params: any[] = []) {
  return db.query(sql, params);
}

export async function QueryAll(queries: Array<{ sql: string; params?: any[] }>) {
  return db.queryAll(queries);
}

export async function NoSqliteInit(models: any[], checkUpdate = false) {
  for (const model of models) {
    const tableName = Reflect.getMetadata('tableName', model);

    if (!checkUpdate) {
      await db.query(buildQueryCreateTableFromModel(model));
      await createIndexFromModel(model);
    } else {
      const tableExists = await checkExistsTable(model);

      if (tableExists) {
        const compareTable = await compareTableWithModel(model);

        if (compareTable) {
          const { columnsToAdd, columnsToRemove } = compareTable;

          if (columnsToAdd.length > 0) {
            const queries = columnsToAdd.map((column) => ({
              sql: `ALTER TABLE ${tableName} ADD COLUMN ${column.sql};`,
            }));
            await db.queryAll(queries);
          } else {
            const queries = columnsToRemove.map((column) => ({
              sql: `ALTER TABLE ${tableName} DROP COLUMN ${column};`,
            }));
            await db.queryAll(queries);
          }

          await dropIndexFromModel(model);
          await createIndexFromModel(model);
        }
      } else {
        await db.query(buildQueryCreateTableFromModel(model));
        await createIndexFromModel(model);
      }
    }
  }
}

export async function TableSqlInfo(tableName: string): Promise<any> {
  return (
    (await db.query(`SELECT * FROM sqlite_master WHERE type='table' AND tbl_name = ?`, [tableName]))[0]?.sql || null
  );
}

export class NoSqliteModel<T> {
  private tableName: string;
  private props: Record<string, any>;

  constructor(model: { new (): T }) {
    this.tableName = Reflect.getMetadata('tableName', model);
    this.props = Reflect.getMetadata('props', model.prototype) || {};
  }

  getProps(): Record<string, any> {
    return this.props;
  }

  async find(filter: QueryFilter<T> = {}): Promise<T[] | null> {
    const { condition, values } = buildQueryCondition(filter);
    const query = `SELECT * FROM ${this.tableName} ${condition}`;
    return await db.query(query, values);
  }

  async findOne(filter: QueryFilter<T> = {}): Promise<T | null> {
    const { condition, values } = buildQueryCondition(filter);
    const query = `SELECT * FROM ${this.tableName} ${condition} LIMIT 1`;
    return await db.query(query, values);
  }

  async findById(id: string): Promise<T | null> {
    if (!id) throw new Error('Id is required.');

    const primaryKey = Object.keys(this.props).find((key) => this.props[key].key === true);
    const query = `SELECT * FROM ${this.tableName} WHERE ${primaryKey} = ?`;
    const result = await db.query(query, [id]);
    return result.length > 0 ? (result[0] as T) : null;
  }

  async insertOne(data: Partial<T>) {
    if (!data || Object.keys(data).length === 0) throw new Error('Data is required.');

    data = buildInsertData(data, this.props);

    const columns = Object.keys(this.props).filter((col) => data[col] !== undefined);
    const values = columns.map((col) => data[col]);
    const columnNames = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO ${this.tableName} (${columnNames}) VALUES (${placeholders})`;
    await db.query(query, values);
    return data;
  }

  async insertMany(dataArray: Partial<T>[]) {
    if (!dataArray || Object.keys(dataArray).length === 0) throw new Error('Data is required.');

    const dbInstance: SQLiteDBConnection = await db.sqlite();
    await dbInstance.open();

    const processedData = dataArray.map((data) => buildInsertData(data, this.props));

    const columns = Object.keys(this.props).filter((col) => processedData.some((data) => data[col] !== undefined));
    if (columns.length === 0) throw new Error('No valid columns to insert.');

    // Tạo placeholders (?, ?, ?), (?, ?, ?), ...
    const placeholders = processedData.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');

    // Dữ liệu để bind vào câu query
    const flatValues = processedData.flatMap((data) => columns.map((col) => data[col]));

    // Câu SQL cuối cùng
    const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES ${placeholders}`;

    // Thực thi lệnh insert
    const result = await dbInstance.run(query, flatValues);
    console.log(`Inserted ${result.changes} rows into ${this.tableName}`);
    return result.changes;
  }

  async updateOne(filter: Partial<T>, data: Partial<T>) {
    if (!filter || Object.keys(filter).length === 0) throw new Error('Filter is required.');
    if (!data || Object.keys(data).length === 0) throw new Error('Data is required.');

    data = buildUpdateData(data, this.props);

    const filterColumns = Object.keys(filter);
    const filterValues = filterColumns.map((col) => filter[col]);

    const updateColumns = Object.keys(data);
    const updateValues = updateColumns.map((col) => data[col]);

    const setClause = updateColumns.map((col) => `${col} = ?`).join(', ');
    const whereClause = filterColumns.map((col) => `${col} = ?`).join(' AND ');

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause} LIMIT 1`;
    const values = [...updateValues, ...filterValues];

    return await db.query(query, values);
  }

  async updateById(id: string, data: Partial<T>) {
    if (!id) throw new Error('Id is required.');
    if (!data || Object.keys(data).length === 0) throw new Error('Data is required.');

    const primaryKey = Object.keys(this.props).find((key) => this.props[key].key === true);
    data = buildUpdateData(data, this.props);

    const columns = Object.keys(data);
    const values = columns.map((col) => data[col]);
    const setClause = columns.map((col) => `${col} = ?`).join(', ');
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${primaryKey} = ?`;
    values.push(id);
    return await db.query(query, values);
  }

  async updateMany(filter: Partial<T>, data: Partial<T>) {
    if (!filter || Object.keys(filter).length === 0) throw new Error('Filter is required.');
    if (!data || Object.keys(data).length === 0) throw new Error('Data is required.');

    data = buildUpdateData(data, this.props);

    const updateColumns = Object.keys(data);
    const updateValues = updateColumns.map((col) => data[col]);

    const filterColumns = Object.keys(filter);
    const filterValues = filterColumns.map((col) => filter[col]);

    const setClause = updateColumns.map((col) => `${col} = ?`).join(', ');
    const whereClause = filterColumns.map((col) => `${col} = ?`).join(' AND ');

    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereClause}`;

    const values = [...updateValues, ...filterValues];

    return await db.query(query, values);
  }

  async deleteOne(filter: Partial<T>) {
    if (!filter || Object.keys(filter).length === 0) throw new Error('Filter is required.');

    const filterColumns = Object.keys(filter);
    const filterValues = filterColumns.map((col) => filter[col]);

    const whereClause = filterColumns.map((col) => `${col} = ?`).join(' AND ');

    const query = `DELETE FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
    return await db.query(query, filterValues);
  }

  async deleteById(id: string) {
    if (!id) throw new Error('Id is required.');

    const primaryKey = Object.keys(this.props).find((key) => this.props[key].key === true);

    const query = `DELETE FROM ${this.tableName} WHERE ${primaryKey} = ?`;
    return await db.query(query, [id]);
  }

  async deleteMany(filter: Partial<T>) {
    if (!filter || Object.keys(filter).length === 0) throw new Error('Filter is required.');

    const filterColumns = Object.keys(filter);
    const filterValues = filterColumns.map((col) => filter[col]);

    const whereClause = filterColumns.map((col) => `${col} = ?`).join(' AND ');

    const query = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
    return await db.query(query, filterValues);
  }
}

function buildInsertData(data: Partial<any>, props: Record<string, any>) {
  const currentTime = dayjs().toISOString();
  const primaryKey = Object.keys(props).find((key) => props[key].key === true);

  if (primaryKey && !data[primaryKey]) data[primaryKey] = UniqueId();
  if (props['_v'] && data['_v'] === undefined) data['_v'] = 0;
  if (props['createdAt'] && data['createdAt'] === undefined) data['createdAt'] = currentTime;
  if (props['updatedAt'] && data['updatedAt'] === undefined) data['updatedAt'] = currentTime;
  return data;
}

function buildUpdateData(data: Partial<any>, props: Record<string, any>) {
  const currentTime = dayjs().toISOString();
  if (props['_v']) data['_v'] = (data['_v'] || 0) + 1;
  if (props['updatedAt']) data['updatedAt'] = currentTime;
  return data;
}

function buildQueryCondition<T>(filter: QueryFilter<T>) {
  const conditions: string[] = [];
  const values: any[] = [];

  for (const key in filter) {
    const value = filter[key];
    if (!value) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('$or' in value) {
        const orConditions = (value as any).$or.map((_val: any) => `${key} = ?`).join(' OR ');
        conditions.push(`(${orConditions})`);
        values.push(...(value as any).$or);
      } else if ('$and' in value) {
        const andConditions = (value as any).$and.map((_val: any) => `${key} = ?`).join(' AND ');
        conditions.push(`(${andConditions})`);
        values.push(...(value as any).$and);
      } else if ('$regex' in value) {
        const regexPattern = (value as any).$regex;
        if (regexPattern.startsWith('^') && regexPattern.endsWith('$')) {
          conditions.push(`${key} = ?`);
          values.push(regexPattern.slice(1, -1));
        } else if (regexPattern.startsWith('^')) {
          conditions.push(`${key} LIKE ?`);
          values.push(`${regexPattern.slice(1)}%`);
        } else if (regexPattern.endsWith('$')) {
          conditions.push(`${key} LIKE ?`);
          values.push(`%${regexPattern.slice(0, -1)}`);
        } else {
          conditions.push(`${key} LIKE ?`);
          values.push(`%${regexPattern}%`);
        }
      } else {
        for (const op in value) {
          const opValue = value[op];
          switch (op) {
            case '$gt':
              conditions.push(`${key} > ?`);
              values.push(opValue);
              break;
            case '$lt':
              conditions.push(`${key} < ?`);
              values.push(opValue);
              break;
            case '$gte':
              conditions.push(`${key} >= ?`);
              values.push(opValue);
              break;
            case '$lte':
              conditions.push(`${key} <= ?`);
              values.push(opValue);
              break;
            case '$ne':
              conditions.push(`${key} != ?`);
              values.push(opValue);
              break;
            case '$in':
              conditions.push(`${key} IN (${(opValue as any[]).map(() => '?').join(', ')})`);
              values.push(...(opValue as any[]));
              break;
            case '$nin':
              conditions.push(`${key} NOT IN (${(opValue as any[]).map(() => '?').join(', ')})`);
              values.push(...(opValue as any[]));
              break;
          }
        }
      }
    } else {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
  }

  const conditionString = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { condition: conditionString, values };
}
