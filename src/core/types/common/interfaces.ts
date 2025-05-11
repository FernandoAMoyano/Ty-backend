export interface IBase {
  id: string;
}

export interface ITimeStamped extends IBase {
  createdAt: Date;
  updatedAt?: Date;
}
