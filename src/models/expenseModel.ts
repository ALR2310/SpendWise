import { prop } from '~/assets/libs/nosqlite/decorator';

import { BaseModel } from './baseModel';

export enum ExpenseType {
  Expense = 'expense',
  Income = 'income',
}

export class ExpenseModel extends BaseModel {
  @prop({ type: String })
  name!: string;

  @prop({ type: String, index: true })
  date!: string;

  @prop({ type: Number })
  amount!: number;

  @prop({ type: String, index: true })
  type!: ExpenseType;

  @prop({ type: String })
  description?: string;

  @prop({ type: Boolean })
  recurring?: boolean;
}
