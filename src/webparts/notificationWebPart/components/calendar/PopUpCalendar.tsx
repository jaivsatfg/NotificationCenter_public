import { DefaultButton, Modal, Stack } from "@fluentui/react";
import * as React from "react";
import styles from "./Calendar.module.scss";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import IconComponent from "../icons/IconComponent";
import { IItem } from "@pnp/sp/items";
import { ICamlQuery, IList } from "@pnp/sp/lists";
import * as dayjs from "dayjs";
import 'dayjs/locale/es';
import { AppContext, IAppContext } from "../../common/IAppContext";
import { INotifications } from "../../common/INotifications";
import { IDocuments } from "../../common/IDocuments";
import RowDocument from "../Documents/RowDocument";
import { Collapse } from "react-collapse";


export interface IPopUpCalendarProps {
    selectedDate: Date;
    notificationsHigh: INotifications[];
    notificationsHalf: INotifications[];
    notificationsLow: INotifications[];
    showPupUp: boolean;
    callBack: any;
}

export interface IPopUpPropsCalendarState {
    showModal: boolean;
    collapseIndex: number;
    allNotifications: INotifications[];
    listOfDocRelate: IDocuments[];
    urlImage: string;
}

class PopUpCalendarComponent extends React.Component<IPopUpCalendarProps, IPopUpPropsCalendarState> {
    static contextType = AppContext;
    ctx: IAppContext;
    loadingData: number = 1;

    public constructor(props: IPopUpCalendarProps) {
        super(props);
        this.state = {
            showModal: false,
            collapseIndex: -1,
            allNotifications: [],
            listOfDocRelate: [],
            urlImage: ''
        }
    }

    public componentDidMount(): void {
        let allNotifications: INotifications[] = [];

        this.props.notificationsHigh.forEach((element: INotifications) => {
            allNotifications.push(element)
        })

        this.props.notificationsHalf.forEach((element: INotifications) => {
            allNotifications.push(element)
        })

        this.props.notificationsLow.forEach((element: INotifications) => {
            allNotifications.push(element)
        })

        this.setState({ allNotifications: allNotifications });
    }

    setClassNameForIcon = (typeOfNotification: string): string => {
        let iconClass = "";
        const ctx = this.context;
        switch (typeOfNotification.toLowerCase()) {
            case ctx.appCfg.generalOrder[1].toLowerCase(): // alta
                iconClass = styles.iconTypeNotificationL1;
                break;
            case ctx.appCfg.generalOrder[2].toLowerCase(): // media
                iconClass = styles.iconTypeNotificationL2;
                break;
            case ctx.appCfg.generalOrder[3].toLowerCase(): // baja
                iconClass = styles.iconTypeNotificationL3;
                break;
            default:
                iconClass = styles.iconTypeNotificationL1;
                break
        }
        return iconClass;
    }

    private async getAttachments(id: number): Promise<IDocuments[]> {
        const notificationsList = this.ctx.spWeb?.web.lists.getByTitle('Notificacions');
        const currentItem = notificationsList?.items.getById(id);
        const dataAttachment = await currentItem?.attachmentFiles();

        let result: IDocuments[] = [];

        dataAttachment?.forEach((element) => {
            const singleData: IDocuments = {
                url: element.ServerRelativeUrl,
                name: element.FileName,
                modifiedDate: null,
                publicationDate:null,
                service: undefined,
                isAttachment: true
            }
            result.push(singleData);
        });

        return result;
    }

    private getRelatedDocuments(idNotification: number, idBiblioteca: string, idList: string): Promise<IDocuments[]> {
        return new Promise<IDocuments[]>(async (resolve, reject) => {
            let filterDocRelativ: string = "";
            const listDocsId: IList = this.ctx.spWebManagerDoc.lists.getById(idList);
            const selectFields1: string[] = ['IdNotificacio', 'IdBibliotecaDocuments', 'IdDocumentRelacionat', 'IdDocumentRelacionat', 'IdDocument']

            const filterToApply: string = `(IdNotificacio eq ${idNotification}) and (IdBibliotecaDocuments eq '${idBiblioteca}')`;

            const items: IItem[] = await listDocsId.items
                .select(selectFields1.join(','))
                .filter(filterToApply)
                .top(30)();


            items.forEach((element: any) => {
                filterDocRelativ += `<Value Type="Counter">${element.IdDocumentRelacionat}</Value>`;
            });

            if (filterDocRelativ !== "") {

                const listDocs = this.ctx.spWebManagerDoc.lists.getById(this.context.appCfg.publicDocumentLibraryId);

                const selectFields: string[] = ['ID', 'Title', 'Servei', 'Modified', 'File'];
                const caml: ICamlQuery = {
                    ViewXml: '<View Scope="RecursiveAll">'.concat(
                        '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
                        '<Query>',
                        '<OrderBy><FieldRef Name="DataPublicacio" Ascending="False"/></OrderBy>',
                        '<Where>',
                        `<In><FieldRef Name='ID'/><Values>${filterDocRelativ}</Values></In>`,
                        '</Where></Query><RowLimit>300</RowLimit></View>'),
                };
                listDocs.getItemsByCAMLQuery(caml, 'File',).then((items: any) => {
                    const values: IDocuments[] = items.map((it: any) => {
                        const currentServei: string = it['Servei'] && it['Servei'].Label;
                        const document: IDocuments = {
                            service: currentServei,
                            name: it.File && it.File.Name,
                            url: it.File && it.File.ServerRelativeUrl,
                            modifiedDate: dayjs(it['Modified']).toDate(),
                            publicationDate: dayjs(it['DataPublicacio']).toDate()
                        }
                        return document;
                    });
                    values.sort((a, b) => {
                        if (a.modifiedDate && b.modifiedDate && a.modifiedDate.getTime() === b.modifiedDate.getTime()) return 0;
                        if (a.modifiedDate && b.modifiedDate && a.modifiedDate.getTime() > b.modifiedDate.getTime()) return -1;
                        return 1;
                    });
                    resolve(values);

                }).catch(() => {
                    reject([]);
                });

            }
            else {
                const emptyData: IDocuments[] = [];
                resolve(emptyData);
            }
        });
    }

    async getDocumentRelate(id: number) {

        this.ctx.appCfg?.publicDocumentLibraryId && this.ctx.appCfg.documentsRelacionatsId
        && this.getRelatedDocuments(id, this.ctx.appCfg.publicDocumentLibraryId, this.ctx.appCfg.documentsRelacionatsId).then(async (element) => {
            const result: IDocuments[] = [];
            const onlyDocRelate: IDocuments[] = [];
            const attachments = await this.getAttachments(id);
            element.forEach((doc: IDocuments) => {
                onlyDocRelate.push(doc);
            })
            if (element.length > 0) {
                attachments.forEach((element) => {
                    result.push(element);
                })
                onlyDocRelate.forEach((element) => {
                    result.push(element);
                })
            }
            else {
                attachments.forEach((element) => {
                    result.push(element);
                })
            }
            this.setState({ listOfDocRelate: result });
        }).catch((error: Error) => {
            console.log(error)
        })

    }




    async showCollapse(index: number) {
        const result = this.state.collapseIndex;
        if (result !== index) {
            if (this.state.allNotifications[index].imageDetails != null && this.state.allNotifications[index].imageDetails.toString() != "") {
                //var allPropertyNames = Object.keys(this.state.allNotifications[index].imageDetails);
                const objectString = JSON.stringify(this.state.allNotifications[index].imageDetails);
                const imageObject = JSON.parse(objectString)
                const fullUrlOfImage = `${imageObject?.serverUrl}${imageObject.serverRelativeUrl}`;
                this.setState({ collapseIndex: index, urlImage: fullUrlOfImage })
            }
            else {
                this.setState({ collapseIndex: index, urlImage: "" });
            }
            //this.setState({ collapseIndex: index })
            await this.getDocumentRelate(this.state.allNotifications[index].id)
        }
        else {
            this.setState({ collapseIndex: -1 })
        }

    }

    dateFormatChange = (date: Date) => {
        let dateFormat: string = dayjs(date).locale('es').format('D [de] MMMM [de] YYYY');
        //verificar
        dateFormat = dateFormat.split(" a ")[0];
        return dateFormat.charAt(0).toUpperCase() + dateFormat.slice(1);
    }

    public render(): React.ReactElement<IPopUpCalendarProps> {

        const ctx: IAppContext = this.context;
        this.ctx = ctx;

        const hideModalEvent = (event: any) => {
            this.setState({ showModal: false })
            this.props.callBack(this.state.showModal);
            this.loadingData = 0;
        }


        if (this.props.showPupUp && !this.state.showModal && this.loadingData > 0) {
            this.setState({ showModal: true })
        }
        else {
            this.loadingData = 1;
        }

        return (
            <span>
                <Modal
                    titleAriaId="idPopUp"
                    isOpen={this.state.showModal}
                    onDismiss={hideModalEvent}
                    containerClassName={styles.modalPopUp}
                    isBlocking={false}>
                    <div className={styles.panelPopUp}>
                        <div className={styles.popUpHeader}>
                            <h2 className={styles.popUpTotol}>Eventos y Calendario del {dayjs(this.props.selectedDate).locale('es').format('L')}</h2>
                            <span className={styles.closeIcon} onClick={hideModalEvent}><IconComponent title={"close"} isFill={true}></IconComponent></span>
                        </div>
                        <div className={styles.popUpBody}>
                            {
                                this.state.allNotifications.map((notification: INotifications, index) => {
                                    return (
                                        <div className={`${styles.collapseitem} ${this.state.collapseIndex === index ? styles.show : ""}`}>
                                            <button className={styles["collapse-header"]} onClick={() => this.showCollapse(index)}>
                                                <span className={styles.shorDesc}>{notification.title}</span>
                                                <span className={`${styles.criticityIcon} ${this.setClassNameForIcon(notification.priority)}`}><IconComponent title={"lightning"} isFill={true}></IconComponent></span>
                                                <span className="arrow">{this.state.collapseIndex === index ? <IconComponent title={"upArrow"} isFill={true}></IconComponent> : <IconComponent title={"downArrow"} isFill={true}></IconComponent>}</span>
                                            </button>
                                            <Collapse style={{ translate: 'height 500ms' }} theme={{ collapse: 'foo', content: 'bar' }} isOpened={this.state.collapseIndex === index}>
                                                {/* <div className={styles["collapse-body"]}>Random content</div> */}
                                                <div className={styles.collapseBody}>
                                                        <div className={styles.datePanelPopUp}>{this.dateFormatChange(notification.dateInit)}</div>
                                                        <div dangerouslySetInnerHTML={{ __html: notification.description }}></div>

                                                    
                                                        {
                                                            this.state.urlImage != "" ? <div className={styles.imageCalContainer}><img src={this.state.urlImage} /></div> : <></>
                                                        }
                                                    
                                                    <div className={styles.titolDocumentPopUp}>Documentos</div>
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
                                            </Collapse>
                                        </div>
                                    )
                                })
                            }

                        </div>
                        <div className={styles.footerPopUp}>
                            <Stack enableScopedSelectors>
                                <Stack enableScopedSelectors horizontal horizontalAlign="end">
                                    <DefaultButton text="Tanca" onClick={hideModalEvent} allowDisabledFocus className={styles.iconCancelPopUp} />
                                </Stack>
                            </Stack>
                        </div>
                    </div>
                </Modal>
            </span>
        )
    }
}
PopUpCalendarComponent.contextType = AppContext;
export default PopUpCalendarComponent;