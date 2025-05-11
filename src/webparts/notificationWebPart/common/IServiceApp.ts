import { VisibilityValues } from "./VisibilityValues";

export interface IServiceApp {
    title:string;
    abbreviation:string;
    taxonomyId:string;
    iconUrl:string;
    itemOrdre:number;
    visibility:VisibilityValues[];
    notificationTypesExcepted:string[];
    maxCriticalElements:number;
    maxServiceElements:number;
    maxDocumentItems:number;
}