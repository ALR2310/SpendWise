import 'reflect-metadata';

import { QueryBuilder } from './builder';
import { getColumnType, uniqueId } from './helper';
import { Filter } from './type';

let dbInstance: any;

/**
 * Initialize NoSqlite with models and database instance
 * @param models - Array of model classes to create tables for
 * @param database - Database instance (SQLite)
 * @throws {Error} When database is not initialized
 * @example
 * ```typescript
 * await NoSqliteInit([UserModel, ProductModel], database);
 * ```
 */
export async function NoSqliteInit(models: any[], database: any) {
  if (!database) throw new Error('Database not initialized');

  dbInstance = database;

  for (const model of models) {
    const table = model.name.toLowerCase().replace('model', '');

    await database.execute(`
        CREATE TABLE IF NOT EXISTS ${table} (
          _id TEXT PRIMARY KEY NOT NULL,
          data TEXT
        )`);

    const props = Reflect.getMetadata('props', model) || {};

    const handleProps = async (props: Record<string, any>, prefix = '', jsonPath = '$') => {
      for (const [key, config] of Object.entries(props)) {
        const colName = prefix ? `${prefix}_${key}` : key;
        const path = `${jsonPath}.${key}`;

        const isNested = typeof config?.type === 'function' && Reflect.getMetadata('props', config.type);

        if (isNested) {
          const nestedProps = Reflect.getMetadata('props', config.type);
          await handleProps(nestedProps, colName, path);
          continue;
        }

        const colType = getColumnType(config?.type);
        const columnSQL = `
            ALTER TABLE ${table} ADD COLUMN ${colName} ${colType}
            GENERATED ALWAYS AS (json_extract(data, '${path}')) STORED
          `;
        try {
          await database.execute(columnSQL);
        } catch (e: any) {
          if (!e.message.includes('duplicate column')) {
            console.log(`Failed to add column ${colName} to ${table}:`, e.message);
          }
        }

        if (config?.index) {
          const indexName = `idx_${table}_${colName}`;
          const indexSQL = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${colName})`;
          await database.execute(indexSQL);
        }
      }
    };

    await handleProps(props);

    console.log(`${table} created`);
  }
}

/**
 * Execute SQL statement with parameters
 * @param sql - SQL statement to execute
 * @param params - Array of parameters for the SQL statement
 * @returns Promise<any> - Query result (values for SELECT, changes for INSERT/UPDATE/DELETE)
 * @throws {Error} When database is not initialized
 * @example
 * ```typescript
 * const results = await query('SELECT * FROM users WHERE age > ?', [18]);
 * const changes = await query('INSERT INTO users (name) VALUES (?)', ['John']);
 * ```
 */
export async function query(sql: string, params: any[] = []) {
  if (!dbInstance) throw new Error('Database not initialized');

  if (sql.trim().toLowerCase().startsWith('select') || sql.trim().toLowerCase().startsWith('pragma'))
    return (await dbInstance.query(sql, params)).values;
  else return (await dbInstance.run(sql, params)).changes;
}

/**
 * Main class for NoSqlite data operations
 * @template T - The type of the model
 */
export class NoSqliteModel<T> {
  private table: string;
  private model: any;
  private query: any;
  private readonly BATCH_SIZE = 500;

  /**
   * Initialize NoSqliteModel
   * @param model - Constructor of the model class
   */
  constructor(model: new () => T) {
    this.model = model;
    this.query = query;
    this.table = model.name.toLowerCase().replace('model', '');
  }

  /**
   * Split array into chunks of specified size
   * @template U - Type of array elements
   * @param array - Array to split
   * @param size - Size of each chunk
   * @returns Array of chunks
   * @private
   */
  private chunkArray<U>(array: U[], size: number): U[][] {
    const chunks: U[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Find documents matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @returns QueryBuilder instance for chaining operations
   * @example
   * ```typescript
   * const users = await userModel.find({ age: { $gt: 18 } });
   * ```
   */
  find(filter: Filter<T> = {}) {
    return new QueryBuilder<T>(this.table, this.query, this.model).where(filter);
  }

  /**
   * Find the first document matching the filter criteria
   * @param filter - Filter criteria to match document
   * @returns Promise resolving to the first matching document or null
   * @example
   * ```typescript
   * const user = await userModel.findOne({ email: 'john@example.com' });
   * ```
   */
  findOne(filter: Filter<T> = {}) {
    return this.find(filter).first();
  }

  /**
   * Find a document by its ID
   * @param id - The document ID to search for
   * @returns Promise resolving to the document or null if not found
   * @example
   * ```typescript
   * const user = await userModel.findById('user123');
   * ```
   */
  findById(id: string) {
    return this.findOne({ _id: id } as Partial<Record<keyof T, any>>);
  }

  /**
   * Count documents matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @returns Promise resolving to the count of matching documents
   * @example
   * ```typescript
   * const count = await userModel.count({ age: { $gte: 18 } });
   * ```
   */
  count(filter: Filter<T> = {}) {
    return this.find(filter).count();
  }

  /**
   * Check if any documents exist matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @returns Promise resolving to true if documents exist, false otherwise
   * @example
   * ```typescript
   * const hasAdults = await userModel.exists({ age: { $gte: 18 } });
   * ```
   */
  exists(filter: Filter<T> = {}) {
    return this.find(filter).exists();
  }

  /**
   * Paginate documents matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @param options - Pagination options including page, limit, and optional sort
   * @returns Promise resolving to paginated results
   * @example
   * ```typescript
   * const result = await userModel.paginate(
   *   { age: { $gte: 18 } },
   *   { page: 1, limit: 10, sort: { name: 1 } }
   * );
   * ```
   */
  paginate(filter: Filter<T>, options: { page: number; limit: number; sort?: Partial<Record<keyof T, 1 | -1>> }) {
    return new QueryBuilder<T>(this.table, this.query, this.model).where(filter).paginate(options);
  }

  /**
   * Insert a single document
   * @param data - Document data to insert
   * @returns Promise resolving to the inserted document with generated ID
   * @example
   * ```typescript
   * const user = await userModel.insertOne({ name: 'John', age: 25 });
   * ```
   */
  async insertOne(data: Partial<T & { _id?: string }>) {
    const _id = data._id ?? uniqueId();
    const fullItem = { _id, ...data };
    const json = JSON.stringify(fullItem);
    await this.query(`INSERT INTO ${this.table} (_id, data) VALUES (?, ?)`, [_id, json]);
    return fullItem;
  }

  /**
   * Insert multiple documents in batches
   * @param data - Array of document data to insert
   * @returns Promise resolving to array of inserted documents with generated IDs
   * @throws {Error} When data is not an array
   * @example
   * ```typescript
   * const users = await userModel.insertMany([
   *   { name: 'John', age: 25 },
   *   { name: 'Jane', age: 30 }
   * ]);
   * ```
   */
  async insertMany(data: Partial<T & { _id?: string }>[]) {
    if (!Array.isArray(data)) throw new Error('data must be an array');
    if (data.length === 0) return [];

    const result: (T & { _id: string })[] = [];

    const chunks = this.chunkArray(data, this.BATCH_SIZE);

    for (const chunk of chunks) {
      const placeholders: string[] = [];
      const values: any[] = [];
      const chunkResult: (T & { _id: string })[] = [];

      for (const item of chunk) {
        const _id = item._id ?? uniqueId();
        const fullItem = { ...item, _id } as T & { _id: string };
        const json = JSON.stringify(fullItem);

        placeholders.push('(?, ?)');
        values.push(_id, json);
        chunkResult.push(fullItem);
      }

      const sql = `INSERT INTO ${this.table} (_id, data) VALUES ${placeholders.join(', ')}`;
      await this.query(sql, values);

      result.push(...chunkResult);
    }

    return result;
  }

  /**
   * Update the first document matching the filter criteria
   * @param filter - Filter criteria to match document
   * @param data - Partial data to update the document with
   * @returns Promise resolving to the updated document or null if not found
   * @example
   * ```typescript
   * const updatedUser = await userModel.updateOne(
   *   { email: 'john@example.com' },
   *   { age: 26 }
   * );
   * ```
   */
  async updateOne(filter: Filter<T & { _id: string }>, data: Partial<T>) {
    const record = await this.findOne(filter);
    if (!record) return null;

    const { _id } = record as T & { _id: string };
    const updated = { ...record, ...data, _id };
    const json = JSON.stringify(updated);
    await this.query(`UPDATE ${this.table} SET data = ? WHERE _id = ?`, [json, _id]);
    return updated;
  }

  /**
   * Update multiple documents matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @param data - Partial data to update the documents with
   * @returns Promise resolving to array of updated documents
   * @example
   * ```typescript
   * const updatedUsers = await userModel.updateMany(
   *   { age: { $lt: 18 } },
   *   { status: 'minor' }
   * );
   * ```
   */
  async updateMany(filter: Filter<T>, data: Partial<T>) {
    const records = await this.find(filter);
    if (!records.length) return [];

    const updatedDocs: (T & { _id: string })[] = [];

    const chunks = this.chunkArray(records, this.BATCH_SIZE);

    for (const chunk of chunks) {
      const cases: string[] = [];
      const params: any[] = [];
      const ids: string[] = [];

      for (const record of chunk) {
        const { _id } = record as T & { _id: string };
        const updated = { ...record, ...data, _id };
        const json = JSON.stringify(updated);

        cases.push(`WHEN _id = ? THEN ?`);
        params.push(_id, json);
        ids.push(_id);
        updatedDocs.push(updated);
      }

      const placeholders = ids.map(() => '?').join(', ');

      const sql = `
        UPDATE ${this.table}
        SET data = CASE ${cases.join(' ')} END
        WHERE _id IN (${placeholders})
      `;

      const allParams = [...params, ...ids];
      await this.query(sql, allParams);
    }

    return updatedDocs;
  }

  /**
   * Delete the first document matching the filter criteria
   * @param filter - Filter criteria to match document
   * @returns Promise resolving to the deleted document or null if not found
   * @example
   * ```typescript
   * const deletedUser = await userModel.deleteOne({ email: 'john@example.com' });
   * ```
   */
  async deleteOne(filter: Filter<T & { _id: string }>) {
    const record = await this.findOne(filter);
    if (!record) return null;

    const { _id } = record as T & { _id: string };
    await this.query(`DELETE FROM ${this.table} WHERE _id = ?`, [_id]);
    return record;
  }

  /**
   * Delete multiple documents matching the filter criteria
   * @param filter - Filter criteria to match documents
   * @returns Promise resolving to array of deleted documents
   * @example
   * ```typescript
   * const deletedUsers = await userModel.deleteMany({ age: { $lt: 18 } });
   * ```
   */
  async deleteMany(filter: Filter<T>) {
    const records = await this.find(filter);
    if (!records.length) return [];

    const ids = records.map((r) => (r as T & { _id: string })._id);
    const chunks = this.chunkArray(ids, this.BATCH_SIZE);

    for (const chunk of chunks) {
      const placeholders = chunk.map(() => '?').join(', ');
      await this.query(`DELETE FROM ${this.table} WHERE _id IN (${placeholders})`, chunk);
    }

    return records;
  }

  /**
   * Execute operations within a database transaction
   * @template R - Return type of the callback function
   * @param callback - Function to execute within the transaction
   * @returns Promise resolving to the callback result
   * @throws {Error} Any error that occurs during the transaction (will trigger rollback)
   * @example
   * ```typescript
   * const result = await userModel.transaction(async (model) => {
   *   const user = await model.insertOne({ name: 'John', age: 25 });
   *   await model.updateOne({ _id: user._id }, { verified: true });
   *   return user;
   * });
   * ```
   */
  async transaction<R>(callback: (model: NoSqliteModel<T>) => Promise<R>): Promise<R> {
    try {
      await this.query('BEGIN TRANSACTION', []);
      const result = await callback(this);
      await this.query('COMMIT', []);

      return result;
    } catch (error) {
      try {
        await this.query('ROLLBACK', []);
      } catch (rollbackError) {
        console.warn('Failed to rollback transaction:', rollbackError);
      }
      throw error;
    }
  }
}
