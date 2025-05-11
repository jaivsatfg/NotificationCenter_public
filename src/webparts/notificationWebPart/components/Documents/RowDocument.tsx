import * as React from "react";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { IDocuments } from "../../common/IDocuments";

export interface IRowDocumentProps {
    item: IDocuments;
}
export default class RowDocument extends React.Component<IRowDocumentProps, {}> {
    constructor(props: IRowDocumentProps) {
        super(props);
    }

    public render(): React.ReactElement<IRowDocumentProps> {
        let icon: string;
        const fileExtension: string = this.props.item.name && this.props.item.name.split('.')[this.props.item.name.split('.').length - 1];
        
        switch (fileExtension.toLowerCase()) {
            case 'pdf':
                icon = 'bi bi-filetype-pdf';
                break;
            case 'docx':
                icon = 'bi bi-file-earmark-word';
                break;
            case 'pptx':
                icon = 'bi bi-filetype-ppt';
                break;
            case 'xslx':
            case 'csv':
                icon = 'bi bi-file-earmark-excel';
                break;
            case 'jpg':
            case 'png':
            case 'tiff':
            case 'psd':
            case 'bmp':
            case 'gif':
                icon = 'bi bi-file-earmark-image';
                break;
            default:
                icon = 'bi bi-file-earmark-text';
                break;
        };
        if (this.props.item.isAttachment == true) {
            icon = 'bi bi-link-45deg';
        }
        return (

            <tr>
                <th scope="row"><i className={icon} /></th>
                <td>{this.props.item.name}</td>
                <td><a className="download" data-interception="off" aria-label="Ver documento" target="_blank" href={this.props.item.url}>Veure</a>
                </td>
            </tr>);
    }
}
