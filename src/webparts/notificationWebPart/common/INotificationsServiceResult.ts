import { INotifications } from "./INotifications";

export interface INotificationsServiceResult {
    values: INotifications[],
    maxCriticalElements:number;
      maxServiceElements:number;
  }