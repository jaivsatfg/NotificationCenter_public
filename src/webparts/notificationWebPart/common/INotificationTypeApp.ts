import { VisibilityValues } from "./VisibilityValues";

export interface INotificationTypeApp {
    title:string;
    abbreviation:string;
    iconUrl?:string;
    visibility:VisibilityValues[];
}