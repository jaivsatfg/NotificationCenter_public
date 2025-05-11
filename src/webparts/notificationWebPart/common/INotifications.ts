import { IAppTaxonomyTerm } from "./IAppTaxonomyTerm";

export interface INotifications {
    service?: IAppTaxonomyTerm,
    DocClasification?: IAppTaxonomyTerm,
    NotificationType?: IAppTaxonomyTerm,
    id: number,
    title: string,
    dateInit: Date,
    dateEnd: Date,  
    priority: string,
    visible: boolean,
    shortDesc: string,
    description: string,
    footerDesc: string,
    attachments:boolean,
    readed:boolean;
    imageDetails:object;
  }