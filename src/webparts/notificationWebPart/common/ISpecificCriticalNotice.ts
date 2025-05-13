import { ILocaleDate } from "./ILocaleDay";

export interface ISpecificCriticalNotice {
    shortDescription:string;
    notificationBody:string;
    initDatePublish:ILocaleDate;
    endDatePublish:ILocaleDate;
    image:string;
    tipology:string;
    notificactionType:string;
    title:string;
    visibility:string;
    service:string
}