export class INTEGER {}
export class REAL {}
export class TEXT {}
export class BLOB {}

type QueryOperator<T> =
  | T
  | {
      $gt?: T;
      $lt?: T;
      $gte?: T;
      $lte?: T;
      $ne?: T;
      $in?: T[];
      $nin?: T[];
      $regex?: string;
    }
  | { $or?: T[] }
  | { $and?: T[] };

export type QueryFilter<T> = {
  [P in keyof T]?: QueryOperator<T[P]>;
};
