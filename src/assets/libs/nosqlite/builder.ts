import { getModelByTable } from './decorator';
import { buildSelectFields, buildWhereCondition, deepNestFromPrefix, tryParseJSON } from './helper';
import { Filter } from './type';

export class QueryBuilder<T> {
  private model: any;
  private query: any;
  private table: string;
  private filter: any = {};
  private selects?: string[];
  private _limit?: number;
  private _offset?: number;
  private _orderBy?: string;
  private lookups: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    fields?: string;
    unwind?: boolean;
  }[] = [];

  constructor(table: string, query: any, model: any) {
    this.query = query;
    this.table = table;
    this.model = model;
  }

  sort(order: Partial<Record<keyof T, 1 | -1>>) {
    const orderClauses = Object.entries(order).map(([key, dir]) => `${key} ${dir === 1 ? 'ASC' : 'DESC'}`);
    this._orderBy = orderClauses.join(', ');
    return this;
  }

  lookup(options: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    fields?: string;
    unwind?: boolean;
  }) {
    this.lookups.push(options);
    return this;
  }

  select(fields: string | string[]) {
    const props = Reflect.getMetadata('props', this.model) || {};
    this.selects = buildSelectFields(fields, props);
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  skip(n: number) {
    this._offset = n;
    return this;
  }

  where(filter: Filter<T>) {
    this.filter = filter;
    return this;
  }

  async exec(): Promise<T[]> {
    const condition = buildWhereCondition(this.filter);

    const selectFields = this.selects ?? ['data'];

    // handle lookup
    for (const lookup of this.lookups) {
      const modelEntry = getModelByTable(lookup.from);
      if (!modelEntry) throw new Error(`Model for table ${lookup.from} not found`);

      const props = modelEntry.props;
      const fields = lookup.fields ? lookup.fields.split(' ') : Object.keys(props);

      const fieldsSelect = buildSelectFields(
        fields.filter((i) => i !== lookup.foreignField),
        props,
      );
      const fieldNames = fieldsSelect.flatMap((f) => [`'${f}'`, f]);

      const subQuery = `(
        SELECT json_group_array(json_object(${fieldNames.join(', ')}))
        FROM ${lookup.from}
        WHERE ${lookup.foreignField} = ${this.table}.${lookup.localField}
      ) AS ${lookup.as}`;
      selectFields.push(subQuery);
    }

    const sqlSelect = selectFields.join(', ');
    const sql = `
      SELECT ${sqlSelect}
      FROM ${this.table}
      ${condition.length ? `WHERE ${condition.join(' AND ')}` : ''}
      ${this._orderBy ? `ORDER BY ${this._orderBy}` : ''}
      ${this._limit ? `LIMIT ${this._limit}` : ''}
      ${this._offset ? `OFFSET ${this._offset}` : ''}
    `;

    // console.log(sql);
    const rows = await this.query(sql);

    const data = rows.map((row: any) => {
      const parsed: any = {};

      if ('data' in row) {
        const base = tryParseJSON(row.data);
        Object.assign(parsed, base);
      }

      for (const key in row) {
        if (key === 'data') continue;

        const value = tryParseJSON(row[key]);

        const lookupConfig = this.lookups.find((l) => l.as === key);

        if (lookupConfig?.unwind) {
          const firstItem = Array.isArray(value) ? value[0] : null;
          parsed[key] = firstItem && typeof firstItem === 'object' ? deepNestFromPrefix(firstItem) : firstItem;
        } else if (Array.isArray(value)) {
          parsed[key] = value.map((item) => (typeof item === 'object' ? deepNestFromPrefix(item) : item));
        } else {
          parsed[key] = value;
        }
      }

      return parsed;
    });

    return data;
  }

  async count(): Promise<number> {
    const condition = buildWhereCondition(this.filter);

    const sql = `
      SELECT COUNT(*) as total
      FROM ${this.table}
      ${condition.length ? `WHERE ${condition.join(' AND ')}` : ''}
    `;

    const rows = await this.query(sql);
    return rows[0]?.total ?? 0;
  }

  async exists(): Promise<boolean> {
    const condition = buildWhereCondition(this.filter);

    const sql = `
      SELECT 1
      FROM ${this.table}
      ${condition.length ? `WHERE ${condition.join(' AND ')}` : ''}
      LIMIT 1
    `;

    const rows = await this.query(sql);
    return rows.length > 0;
  }

  async first(): Promise<T | null> {
    const result = await this.limit(1).exec();
    return result[0] ?? null;
  }

  async paginate(options: { page: number; limit: number; sort?: Partial<Record<keyof T, 1 | -1>> }) {
    this._limit = options.limit;
    this._offset = (options.page - 1) * options.limit;
    if (options.sort) this.sort(options.sort);

    const [total, data] = await Promise.all([this.count(), this.exec()]);
    return {
      docs: data,
      totalDocs: total,
      page: options.page,
      limit: options.limit,
      totalPage: Math.ceil(total / options.limit),
    };
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}
