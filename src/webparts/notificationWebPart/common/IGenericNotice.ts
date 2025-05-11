import { ILocaleDate } from "./ILocaleDay";

export interface IGenericNotice {
    shortDescription:string;
    notificationBody:string;
    initDatePublish:ILocaleDate;
    endDatePublish:ILocaleDate;
    image:string;
    critical:string;
    tipology:string;
    notificactionType:string;
    title:string;
    visibility:string
}