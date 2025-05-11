import { IAppTaxonomyTerm } from "./IAppTaxonomyTerm";
import { INotificationTypeApp } from "./INotificationTypeApp";
import { IServiceApp } from "./IServiceApp";

export interface IConfigApp {
    termStoreId:string;
    termGroupId:string;
    listConfigId:string;
    listParametersId:string;
    cacheConfigDuration:number;
    cacheDataDuration:number;
    substringDescription:number;
    publicDocumentLibraryId:string;
    documentsRelacionatsId:string;
    publicDocumentLibraryUrl:string;
    btnUrlSearch:string;    
    btnUrlNotifications:string;    
    btnUrlDocuments:string;    
    generalOrder:string[];
    taxonomyTerms:IAppTaxonomyTerm[];
    //taxonomyTree:IAppTaxonomyElem[];
    services:IServiceApp[];
    notificationTypes:INotificationTypeApp[];
}