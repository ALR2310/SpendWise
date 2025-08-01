import { NoSqliteModel } from '~/assets/libs/nosqlite';
import { ExpenseModel } from '~/models/expenseModel';
import { NoteModel } from '~/models/noteModel';

export const expenseModel = new NoSqliteModel(ExpenseModel);
export const noteModel = new NoSqliteModel(NoteModel);
