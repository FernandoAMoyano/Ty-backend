import { IBase } from '../common/interfaces';
import { NotificationStatusName, NotificationType } from './enums';

export interface INotificationStatus extends IBase {
  name: NotificationStatusName;
  description?: string;
}

export interface INotification extends IBase {
  userId: string;
  statusId: string;
  type: NotificationType;
  message: string;
  sentAt?: Date;
  createdAt: Date;
}
