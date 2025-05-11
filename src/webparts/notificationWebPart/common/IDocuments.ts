export interface IDocuments {
    name: string;
    url: string;
    modifiedDate: Date | null;
    publicationDate?: Date | null;
    service?: string;
    isAttachment?: boolean;
}