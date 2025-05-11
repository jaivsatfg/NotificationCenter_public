import { IGenericCriticalNotice } from "./IGenericCriticalNotice";
import { IGenericNotice } from "./IGenericNotice";
import { ISpecificCriticalNotice } from "./ISpecificCriticalNotice";
import { ISpecificNotice } from "./ISpecificNotice";

export interface INotificaction {
    genericCriticalNotice: IGenericCriticalNotice[];
    genericNotice: IGenericNotice[];
    specificCriticalNotice: ISpecificCriticalNotice[];
    specificNotice: ISpecificNotice[];
}