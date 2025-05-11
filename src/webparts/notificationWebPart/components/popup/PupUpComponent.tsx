import { DefaultButton, IIconProps, Modal, Stack } from "@fluentui/react";
import * as React from "react";

import 'bootstrap/dist/css/bootstrap.min.css';
import IconComponent from "../icons/IconComponent";
import { IItem } from "@pnp/sp/items";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ICamlQuery, IList } from "@pnp/sp/lists";
import styles from "../NotificationWebPart.module.scss";
import * as dayjs from "dayjs";
import 'dayjs/locale/es';
import RowDocument from "../Documents/RowDocument";
import "@pnp/sp/attachments";
import { INotifications } from "../../common/INotifications";
import { IDocuments } from "../../common/IDocuments";
import { AppContext, IAppContext } from "../../common/IAppContext";



export interface IPopUpProps {
    notificationData: INotifications;
    isCritic: boolean;
    isTransversal: boolean;
    idUser: number;
}

export interface IPopUpPropsState {
    showModal: boolean;
    listOfDocRelate: IDocuments[];
    urlImage: string;
    showPopUpText: boolean;
}

class PopUpComponent extends React.Component<IPopUpProps, IPopUpPropsState> {
    static contextType = AppContext;
    ctx: IAppContext;
    listOfDocRelate: IDocuments[] = [];

    public constructor(props: IPopUpProps) {
        super(props);
        this.state = {
            showModal: false,
            urlImage: "",
            listOfDocRelate: [],
            showPopUpText: false
        }
    }

    public async componentDidMount() {

        if (this.props.notificationData.imageDetails != null) {
            const notificationsList = this.ctx.spWeb?.web.lists.getByTitle('Notificaciones');
            const currentItem = notificationsList?.items.getById(this.props.notificationData.id);
            const dataAttachment = await currentItem?.attachmentFiles();
            const targetFileName = (this.props.notificationData.imageDetails as any)["fileName"];

            dataAttachment?.forEach((element) => {
                if (element.FileName == targetFileName) {
                    const rootUrl = this.ctx.spWeb?.web.toUrl();
                    if (rootUrl != undefined) {
                        const urlObject = new URL(rootUrl);
                        const fullUrlOfImage = `${urlObject.origin}${element.ServerRelativeUrl}`;
                        this.setState({ urlImage: fullUrlOfImage });
                    }
                }
            })
        }
    }

    private async addNotificationsReed(element: INotifications): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                await this.ctx.spWeb?.web.lists.getByTitle('NotificacionesLeidas').items.add({
                    Title: element.title,
                    IdNotificacion: element.id,
                    ServicioNotificacionText: element.service?.label,
                    TipoNotificacionText: element.NotificationType?.label
                });
                resolve(true);
            }
            catch (error) {
                console.log(error);

                reject(false)
            }

        })
    }
    private async getDetailsOfDocuments() {
        this.listOfDocRelate = [];
        //if exist files attachments
        if (this.props.notificationData.attachments) {
            const notificationsList = this.ctx.spWeb?.web.lists.getByTitle('Notificaciones');
            const currentItem = notificationsList?.items.getById(this.props.notificationData.id);
            if (currentItem != undefined) {
                const dataAttachment = await currentItem.attachmentFiles();
                dataAttachment?.forEach((element) => {
                    let isExistImage = false
                    //check if the attachment exists as an image
                    if (this.props.notificationData.imageDetails && (this.props.notificationData.imageDetails as any)["fileName"] === element.FileName) {
                        isExistImage = true;
                    }
                    if (isExistImage == false) {
                        const singleData: IDocuments = {
                            url: element.ServerRelativeUrl,
                            name: element.FileName,
                            modifiedDate: null,
                            publicationDate: null,
                            service: undefined,
                            isAttachment: true
                        }
                        this.listOfDocRelate.push(singleData);
                    }
                });
            }

            this.setState({ listOfDocRelate: this.listOfDocRelate });
        }

        this.getRelatedDocuments(this.props.notificationData.id, this.ctx.appCfg?.publicDocumentLibraryId, this.ctx.appCfg?.documentsRelacionatsId).then((element) => {
            element.forEach((doc: IDocuments) => {
                this.listOfDocRelate.push(doc);
            })

            if (element.length > 0) {
                this.setState({ listOfDocRelate: this.listOfDocRelate });
            }
            else {
                this.setState({ listOfDocRelate: [] });
            }
        }).catch((error: Error) => {
            console.log(error)
        })
        setTimeout(() => {
            this.setState({ showPopUpText: true });
        }, 300);

    }

    private getRelatedDocuments(idNotification: number, idBiblioteca?: string, idList?: string): Promise<IDocuments[]> {
        return new Promise<IDocuments[]>(async (resolve, reject) => {
            let filterDocRelativ: string = "";
            const listDocsId: IList = this.ctx.spWebManagerDoc.lists.getById(idList);
            const selectFields1: string[] = ['IdNotificacion', 'IdBibliotecaDocumentos', 'IdDocumentoRelacionado', 'IdDocumento']

            const filterToApply: string = `(IdNotificacion eq ${idNotification}) and (IdBibliotecaDocumentos eq '${idBiblioteca}')`;

            const items: IItem[] = await listDocsId.items
                .select(selectFields1.join(','))
                .filter(filterToApply)
                .top(30)();


            items.forEach((element: any) => {
                filterDocRelativ += `<Value Type="Counter">${element.IdDocumentRelacionat}</Value>`;
            });

            if (filterDocRelativ !== "") {
                const ctx: IAppContext = this.context;
                const listDocs = this.ctx.spWebManagerDoc.lists.getById(this.context.appCfg.publicDocumentLibraryId);

                const listTitle: any = await listDocs.select("Title")();

                const selectFields: string[] = ['ID', 'Title', 'ServicioNotificacion', 'Modified', 'File', 'FechaPublicacion'];
                const caml: ICamlQuery = {
                    ViewXml: '<View Scope="RecursiveAll">'.concat(
                        '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
                        '<Query>',
                        '<OrderBy><FieldRef Name="FechaPublicacion" Ascending="False"/></OrderBy>',
                        '<Where>',
                        `<In><FieldRef Name='ID'/><Values>${filterDocRelativ}</Values></In>`,
                        '</Where></Query><RowLimit>300</RowLimit></View>'),
                };
                listDocs.getItemsByCAMLQuery(caml, 'File',).then((items: any) => {
                    const values: IDocuments[] = items.map((it: any) => {
                        const currentServei: string = it['Servei'] && it['Servei'].Label;
                        let fileUrl = it.File.LinkingUri;
                        if (!fileUrl && it.File.ServerRelativeUrl) {
                            const filePath: string = encodeURIComponent(it.File.ServerRelativeUrl.split('/').splice(0, it.File.ServerRelativeUrl.split('/').length - 1).join('/'));
                            fileUrl = ctx.appCfg?.publicDocumentLibraryUrl.concat('/', listTitle.Title, '/Forms/AllItems.aspx?id=', it.File.ServerRelativeUrl, '&parent=', filePath);
                        }
                        const document: IDocuments = {
                            service: currentServei,
                            name: it.File && it.File.Name,
                            url: fileUrl,
                            modifiedDate: dayjs(it["Modified"]).toDate(),
                            publicationDate: dayjs(it["FechaInicioPublicacion"]).toDate()
                        }
                        return document;
                    });
                    values.sort((a, b) => {
                        if (a.modifiedDate?.getTime() === b.modifiedDate?.getTime()) return 0;
                        if (a.modifiedDate != undefined &&
                            b.modifiedDate != undefined &&
                            a.modifiedDate?.getTime() > b.modifiedDate?.getTime()) return -1;
                        return 1;
                    });
                    resolve(values);

                }).catch(() => {
                    reject([]);
                });

            }
        });
    }

    public render(): React.ReactElement<IPopUpProps> {

        const ctx: IAppContext = this.context;
        this.ctx = ctx;

        const hideModalEvent = (event: any): void => {
            this.setState({ showModal: false })
        }
        const showModalEvent = (event: React.MouseEvent<HTMLElement>): void => {
            this.setState({ showPopUpText: false });
            this.setState({ showModal: true })

            this.getDetailsOfDocuments();

            //set scroll to top
            setTimeout(() => {
                const container = document.getElementsByClassName('ms-Modal-scrollableContent')[0];
                if (container !== undefined && container.scrollTop !== undefined)
                    container.scrollTop = 0;
            }, 50);
        }

        const saveNotificationRead = (event: React.MouseEvent<HTMLElement>): void => {
            const res = this.addNotificationsReed(this.props.notificationData);
            console.log(res);
            hideModalEvent('');
            this.context.isReaded(this.props.notificationData.id, this.props.isTransversal, this.props.isCritic);
        }

        const dateFormatChange = (date: string) => {
            return date.charAt(0).toUpperCase() + date.slice(1);
        }
        let dateFormat: string = dayjs(this.props.notificationData.dateInit).locale('es').format('D [de] MMMM [de] YYYY');
        dateFormat = dateFormat.split(" a ")[0];

        const addCompletedIcon: IIconProps = {
            iconName: 'Completed',
            styles: {
                root: { color: 'white' }
            }
        };

        let iconClass = "";
        const setClassNameForIcon = (typeOfNotification: string) => {
            switch (typeOfNotification.toLowerCase()) {
                case ctx.appCfg?.generalOrder[1].toLowerCase(): // alta
                    iconClass = styles.iconTypeNotificationL1;
                    break;
                case ctx.appCfg?.generalOrder[2].toLowerCase(): // media
                    iconClass = styles.iconTypeNotificationL2;
                    break;
                case ctx.appCfg?.generalOrder[3].toLowerCase(): // baja
                    iconClass = styles.iconTypeNotificationL3;
                    break;
                default:
                    iconClass = styles.iconTypeNotificationL1;
                    break
            }
        }

        setClassNameForIcon(this.props.notificationData.priority);

        dateFormat = dateFormatChange(dateFormat);
        return (
            <span className={styles.showMoreInforContainer}>
                <span className={styles.showMoreInfor} onClick={showModalEvent}>Leer más</span>
                {
                    this.state.showPopUpText === false ? null :
                        <Modal
                            titleAriaId="idPopUp"
                            isOpen={this.state.showModal}
                            onDismiss={hideModalEvent}
                            containerClassName={styles.modalPopUp}
                            isBlocking={false}>
                            <div className={styles.panelPopUp}>
                                <div className={styles.popUpHeader}>
                                    <h2 className={styles.popUpTotol}>{this.props.notificationData.title}</h2>
                                    <span className={styles.closeIcon} onClick={hideModalEvent}><IconComponent title={"close"} isFill={true}></IconComponent></span>
                                </div>
                                <div className={styles.popUpBody}>
                                    <div className="container">
                                        <div className="row">
                                            <div className="col-6">
                                                <span className={styles.iconIndication}><IconComponent title={this.props.notificationData.NotificationType?.label.toLowerCase()} isFill={true}></IconComponent></span>
                                                <span>{this.props.notificationData.NotificationType?.label}</span>
                                            </div>
                                            <div className="col-6">
                                                {
                                                    this.props.isCritic === false ?
                                                        <span>
                                                            <span className={iconClass}>
                                                                <IconComponent title={"lightning"} isFill={true}></IconComponent>
                                                            </span>
                                                            <span>Criticitat {this.props.notificationData.priority.toLowerCase()}</span>
                                                        </span>
                                                        : null
                                                }
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-12">
                                                <div className={styles.datePanelPopUp}>{dateFormat}</div>
                                                <div dangerouslySetInnerHTML={{ __html: this.props.notificationData.description }}></div>
                                                <div dangerouslySetInnerHTML={{ __html: this.props.notificationData.footerDesc }}></div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            {
                                                this.state.urlImage != "" ? <div className={styles.imageContainer}><img src={this.state.urlImage} /></div> : <></>

                                            }
                                        </div>
                                        <div className="row">
                                            <div className="col-12">
                                                {
                                                    this.state.listOfDocRelate.length > 0 &&
                                                    <>
                                                        <div className={styles.titolDocumentPopUp}>Documentos relacionados</div>
                                                    </>
                                                }
                                                <Stack className={styles.tablePanelPopUp}>
                                                    <table className={`table ${styles.darreresPublicacions}`}>
                                                        <tbody>
                                                            {
                                                                this.state.listOfDocRelate.map((doc: IDocuments) => {
                                                                    return (<RowDocument item={doc}></RowDocument>)
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </Stack>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.footerPopUp}>
                                    <Stack enableScopedSelectors>
                                        <Stack enableScopedSelectors horizontal horizontalAlign="end">
                                            <DefaultButton text="Cancelar" onClick={hideModalEvent} allowDisabledFocus className={styles.iconCancelPopUp} />
                                            <DefaultButton text="Leído" onClick={saveNotificationRead} allowDisabledFocus iconProps={addCompletedIcon} className={this.props.notificationData.readed === false ? styles.iconSavePopUp : styles.disableBtn} />
                                        </Stack>
                                    </Stack>
                                </div>
                            </div>
                        </Modal>
                }
            </span>
        )
    }
}
PopUpComponent.contextType = AppContext;
export default PopUpComponent;