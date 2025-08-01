import { prop } from '~/assets/libs/nosqlite/decorator';

export class BaseModel {
  @prop({ type: Boolean })
  isDeleted?: boolean;

  @prop({ type: Date })
  createdAt?: string;

  @prop({ type: Date, index: true })
  updatedAt?: string;
}
