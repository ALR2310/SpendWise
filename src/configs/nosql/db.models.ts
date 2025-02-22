import { prop, table } from './db.decorators';
import 'reflect-metadata';
import { INTEGER, REAL, TEXT } from './db.type';

@table('SpendList')
export class SpendListModel {
  @prop({ type: TEXT, required: true, key: true })
  _id?: string;

  @prop({ type: TEXT, required: true, index: true })
  name!: string;

  @prop({ type: TEXT, required: false, default: 'Active', enum: ['Active', 'Inactive'] })
  status!: string;

  @prop({ type: TEXT, required: false })
  createdAt?: string;

  @prop({ type: TEXT, required: false })
  updatedAt?: string;

  @prop({ type: INTEGER, required: true, default: 0 })
  _v?: number;
}

@table('SpendItem')
export class SpendItemModel {
  @prop({ type: TEXT, required: true, key: true })
  _id?: string;

  @prop({ type: TEXT, required: true })
  listId?: string;

  @prop({ type: TEXT, required: true, index: true })
  name!: string;

  @prop({ type: REAL, required: false })
  price?: number;

  @prop({ type: TEXT, required: false })
  details?: string;

  @prop({ type: TEXT, required: false, default: 'Active', enum: ['Active', 'Inactive'] })
  status!: string;

  @prop({ type: TEXT, required: true, index: true })
  date!: string;

  @prop({ type: TEXT, required: false })
  createdAt?: string;

  @prop({ type: TEXT, required: false })
  updatedAt?: string;

  @prop({ type: INTEGER, required: true, default: 0 })
  _v?: number;
}

@table('Note')
export class NoteModel {
  @prop({ type: TEXT, required: true, key: true })
  _id?: string;

  @prop({ type: TEXT, required: true, index: true })
  name!: string;

  @prop({ type: TEXT, required: false })
  content?: string;

  @prop({ type: TEXT, required: false, default: 'Active', enum: ['Active', 'Inactive'] })
  status!: string;

  @prop({ type: TEXT, required: false })
  createdAt?: string;

  @prop({ type: TEXT, required: false })
  updatedAt?: string;

  @prop({ type: INTEGER, required: true, default: 0 })
  _v?: number;
}
