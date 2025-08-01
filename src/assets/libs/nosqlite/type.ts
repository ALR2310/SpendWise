type Condition<T> =
  | T
  | {
      $eq?: T;
      $ne?: T;
      $gt?: T;
      $gte?: T;
      $lt?: T;
      $lte?: T;
      $in?: T[];
      $nin?: T[];
      $regex?: T extends string ? string : never;
    };

export type Filter<T> = {
  [K in keyof T]?: Condition<T[K]>;
} & {
  $or?: Filter<T>[];
  $and?: Filter<T>[];
};
