import { prop } from '~/assets/libs/nosqlite/decorator';

import { BaseModel } from './baseModel';

export class NoteModel extends BaseModel {
  @prop({ type: String })
  title!: string;

  @prop({ type: String })
  content!: string;
}
