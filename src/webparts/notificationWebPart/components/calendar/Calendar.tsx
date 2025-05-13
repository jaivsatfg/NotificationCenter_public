import { Stack } from "@fluentui/react";
import * as React from "react";
import styles from "./Calendar.module.scss";
import 'bootstrap/dist/css/bootstrap.min.css';
import * as dateFns from "date-fns";
import IconComponent from "../icons/IconComponent";
import { ICamlQuery, IRenderListDataAsStreamResult } from '@pnp/sp/lists';
import PopUpCalendarComponent from "./PopUpCalendar";

import * as dayjs from "dayjs";
import { es } from 'date-fns/locale';

import { INotifications } from "../../common/INotifications";
import { AppContext, IAppContext } from "../../common/IAppContext";
import { VisibilityValues } from "../../common/VisibilityValues";
import { NOTIFICATION_TYPES, VISIBILITY } from "../../common/Constants";




export interface ICalendarComponentProps {
    title: string;
}


export default class CalendarComponent extends React.Component<ICalendarComponentProps, {}> {
    static contextType = AppContext;
    notificationsPriority1: INotifications[] = [];
    notificationsPriority2: INotifications[] = [];
    notificationsPriority3: INotifications[] = [];
    title: string = "";

    public constructor(props: ICalendarComponentProps) {
        super(props);

    }

    public componentDidMount(): void {

        const ctxDetail: IAppContext = this.context;

        let showNotifications = false;
        const currentService = ctxDetail.appCfg?.services.filter(s => s.title === this.props.title);
        const basicService = ctxDetail?.appCfg?.services[0];
        if (currentService != undefined && currentService.length > 0) {
            const listOfVisibilities = currentService[0].visibility.filter(p => p === VisibilityValues.Calendar);
            const listOfVisibilitiesBasic = basicService?.visibility.filter(p => p === VisibilityValues.Calendar);
            if (listOfVisibilitiesBasic != undefined && (listOfVisibilities.length > 0 || listOfVisibilitiesBasic.length > 0)) {
                showNotifications = true
            }
        }
        if (showNotifications) {
            this.setState({ currentMonthDate: new Date(), selectedDate: new Date() });

            if (this.title === "") {
                this.title = this.props.title;
            }
            this.month(0);
        }
        else {
            setTimeout(() => {
                this.setState({
                    notificationsPriority1: [],
                    notificationsPriority2: [],
                    notificationsPriority3: []
                })
            }, 500);
        }
    }


    private NotificationIni(): INotifications[] {
        const result: INotifications[] = [];
        return result;
    }

    state = {
        currentMonthDate: new Date(),
        selectedDate: new Date(),
        notificationsPriority1: this.NotificationIni(),
        notificationsPriority2: this.NotificationIni(),
        notificationsPriority3: this.NotificationIni(),
        showPupUp: false
    };

    private getNotificationsByMonth(date: Date, priority: string): Promise<INotifications[]> {
        return new Promise<INotifications[]>(async (resolve, reject) => {
            const ctx: IAppContext = this.context;
            let result: INotifications[] = [];

            let showNotifications = false;
            let showBasicNotifications = false;
            const currentService = ctx.appCfg?.services.filter(s => s.title === this.props.title);
            const basicService = ctx.appCfg?.services[0];
            if (currentService != undefined && currentService.length > 0) {
                const listOfVisibilities = currentService[0].visibility.filter(p => p === VisibilityValues.Calendar);
                if (listOfVisibilities.length > 0) {
                    showNotifications = true
                }
            }
            const listOfVisibilitiesBasic = basicService?.visibility.filter(p => p === VisibilityValues.Calendar);
            if (listOfVisibilitiesBasic != undefined && listOfVisibilitiesBasic.length > 0) {
                showBasicNotifications = true
            }

            //const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
            //const endDate = new Date(date.getFullYear(), date.getMonth(), 31, 23, 59, 59);
            const notificationsList = ctx.spWeb?.web.lists.getByTitle('Notificaciones');
            const selectFields: string[] = ['Id', 'Attachments', 'NotificacionAprobada', 'Title', 'FechaInicioPublicacion', 'FechaFinPublicacion', 'CriticidadNotificacion', 'VisibleNotificacion', 'ServicioNotificacion', 'ClasificacionDocumento', 'TipoNotificacion', 'DescripcionBreveNotificacion', 'CuerpoNotificacion', 'ImagenNotificacion', 'PieDescriptivoNotificacion'];

            const caml: ICamlQuery = {
                ViewXml: '<View>'.concat(
                    '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
                    '<Query>',
                    '<Where>',
                    '<Or>',

                    //First part
                    '<And>',
                    '<Eq><FieldRef Name="NotificacionAprobada"/><Value Type="Boolean">', '1', '</Value></Eq>',
                    '<And>',
                    '<Eq><FieldRef Name="CriticidadNotificacion"/><Value Type="Choice">', priority, '</Value></Eq>',
                    '<And>',
                    '<Neq><FieldRef Name="VisibleNotificacion"/><Value Type="Choice">', VISIBILITY.NO, '</Value></Neq>',
                    '<And>',
                    '<Contains><FieldRef Name="TipoNotificacion"/><Value Type="Choice">', NOTIFICATION_TYPES.CALENDARIO, '</Value></Contains>',//Calendario
                    '<Or>',
                    showBasicNotifications == true ? `<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">${ctx.appCfg?.services[0].title}</Value></Eq>` : '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">Test</Value></Eq>',
                    showNotifications == true ? `<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">${this.props.title}</Value></Eq>` : '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">Test</Value></Eq>',
                    '</Or>',
                    '</And>',
                    '</And>',
                    '</And>',
                    '</And>',


                    //Second part
                    '<And>',
                    '<Eq><FieldRef Name="NotificacionAprobada"/><Value Type="Boolean">', '1', '</Value></Eq>',
                    '<And>',
                    '<Eq><FieldRef Name="CriticidadNotificacion"/><Value Type="Choice">', priority, '</Value></Eq>',
                    '<And>',
                    '<Neq><FieldRef Name="VisibleNotificacion"/><Value Type="Choice">', VISIBILITY.NO, '</Value></Neq>',
                    '<And>',
                    '<Contains><FieldRef Name="TipoNotificacion"/><Value Type="Choice">', NOTIFICATION_TYPES.EVENTO, '</Value></Contains>',//Evento
                    '<Or>',
                    showBasicNotifications == true ? `<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">${ctx.appCfg?.services[0].title}</Value></Eq>` : '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">Test</Value></Eq>',
                    showNotifications == true ? `<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">${this.props.title}</Value></Eq>` : '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">Test</Value></Eq>',
                    '</Or>',
                    '</And>',
                    '</And>',
                    '</And>',
                    '</And>',
                    '</Or>',
                    '</Where>',
                    '<OrderBy>',
                    '<FieldRef Name="FechaInicioPublicacion" Ascending="FALSE"/>',
                    '</OrderBy>',
                    '</Query><RowLimit>5000</RowLimit></View>')
            };

            notificationsList?.renderListDataAsStream(caml).then((items: IRenderListDataAsStreamResult) => {
                items.Row.forEach((it) => {
                    let notificacioSingle: INotifications = {
                        service: undefined,
                        DocClasification: undefined,
                        NotificationType: undefined,
                        id: it["ID"],
                        title: it["Title"],
                        dateInit: dayjs(it["FechaInicioPublicacion."]).toDate(),
                        dateEnd: dayjs(it["FechaFinPublicacion."]).toDate(),
                        priority: priority,
                        visible: true,
                        shortDesc: it["DescripcionBreveNotificacion"] || '',
                        description: it["CuerpoNotificacion"] || '',
                        footerDesc: it["PieDescriptivoNotificacion"] || '',
                        attachments: it["Attachments"],
                        readed: false,
                        imageDetails: it["ImagenNotificacion"],
                    }
                    result.push(notificacioSingle);
                })
                resolve(result)
            })
        })
    }

    checkIfCriticalityHigh(day: Date): [boolean, number] {
        const date = this.state.currentMonthDate;
        let index = 0;
        let result = false;
        if (date.getMonth() === day.getMonth()) {
            const ctx: IAppContext = this.context;
            this.state.notificationsPriority1.forEach((element) => {
                element.dateInit.setHours(0);
                element.dateInit.setMinutes(0);
                element.dateInit.setSeconds(0);
                element.dateEnd.setHours(0);
                element.dateEnd.setMinutes(0);
                element.dateEnd.setSeconds(0);
                if (element.dateInit <= day && element.dateEnd >= day && ctx.appCfg && (element.priority === ctx.appCfg.generalOrder[1] || element.priority === ctx.appCfg.generalOrder[0])) {
                    result = true;
                    index++;
                }
            })
        }
        return [result, index];
    }

    checkIfCriticalityHalf(day: Date): [boolean, number] {
        const date = this.state.currentMonthDate;
        let index = 0;
        let result = false;
        if (date.getMonth() === day.getMonth()) {
            const ctx: IAppContext = this.context;
            this.state.notificationsPriority2.forEach((element) => {
                element.dateInit.setHours(0);
                element.dateInit.setMinutes(0);
                element.dateInit.setSeconds(0);

                element.dateEnd.setHours(0);
                element.dateEnd.setMinutes(0);
                element.dateEnd.setSeconds(0);
                if (element.dateInit <= day && element.dateEnd >= day && element.priority === ctx.appCfg?.generalOrder[2]) {
                    result = true;
                    index++;
                }
            })
        }
        return [result, index];
    }

    checkIfCriticalityLow(day: Date): [boolean, number] {
        const date = this.state.currentMonthDate;
        let index = 0;
        let result = false;
        if (date.getMonth() === day.getMonth()) {
            const ctx: IAppContext = this.context;
            this.state.notificationsPriority3.forEach((element) => {
                element.dateInit.setHours(0);
                element.dateInit.setMinutes(0);
                element.dateInit.setSeconds(0);

                element.dateEnd.setHours(0);
                element.dateEnd.setMinutes(0);
                element.dateEnd.setSeconds(0);

                if (element.dateInit <= day && element.dateEnd >= day && element.priority === ctx.appCfg?.generalOrder[3]) {
                    result = true;
                    index++;
                }
            })
        }
        return [result, index];
    }

    private getNotificationByDay(day: Date, priority: string) {
        let ctx: IAppContext = this.context;
        let notifications: INotifications[] = [];
        if (ctx.appCfg != undefined) {
            switch (priority) {
                case ctx.appCfg.generalOrder[1]:
                    notifications = this.state.notificationsPriority1.filter(item => item.dateInit <= day && item.dateEnd >= day && ctx.appCfg && (item.priority === priority || ctx.appCfg.generalOrder[0]));
                    break;
                case ctx.appCfg.generalOrder[2]:
                    notifications = this.state.notificationsPriority2.filter(item => item.dateInit <= day && item.dateEnd >= day && item.priority === priority);
                    break;
                case ctx.appCfg.generalOrder[3]:
                    notifications = this.state.notificationsPriority3.filter(item => item.dateInit <= day && item.dateEnd >= day && item.priority === priority);
                    break;
            }
        }
        return notifications;
    }

    renderHeader(): React.ReactElement<ICalendarComponentProps> {
        const dateFormatMonth = "MMMM";
        const dateFormatYear = "yyyy";
        return (
            <div className={`${styles.header}`}>
                <div className={`${styles["col-start"]}`}>
                    <div className={styles.icon} onClick={() => this.month(-1)}>
                        <IconComponent iconClass="d-inline-flex align-items-center" title={`left_arrow`} isFill={true}></IconComponent>
                    </div>
                </div>
                <div className={`${styles["col-center"]}`}>
                    <span>{dateFns.format(this.state.currentMonthDate, dateFormatMonth, { locale: es, weekStartsOn: 1 })}</span>
                    <span>&nbsp;de&nbsp;</span>
                    <span>{dateFns.format(this.state.currentMonthDate, dateFormatYear, { locale: es, weekStartsOn: 1 })}</span>
                </div>
                <div className={`${styles["col-end"]}`} onClick={() => this.month(1)}>
                    <div className={styles.icon}>
                        <IconComponent iconClass="d-inline-flex align-items-center" title={`right_arrow`} isFill={true}></IconComponent>
                    </div>
                </div>
            </div>
        );
    }


    renderDays(): React.ReactElement<ICalendarComponentProps> {
        const dateFormat = "iii";
        const days = [];
        const hoy = dayjs(this.state.currentMonthDate);
        const startDate = hoy.startOf('week').toDate(); // lunes de esa semana     

        for (let i = 1; i <= 7; i++) {
            days.push(
                <td className={`${styles.col} ${styles["col-center"]}`} key={i}>
                    {dateFns.format(dateFns.addDays(startDate, i), dateFormat, { locale: es, weekStartsOn: 1 })}
                </td>
            );
        }
        return <table className={`${styles.days}`}><tr>{days}</tr></table>;
    }

    renderCells(): React.ReactElement<ICalendarComponentProps> {
        const { currentMonthDate } = this.state;
        const currentDate = Date.now();
        const monthStart = dateFns.startOfMonth(currentMonthDate);
        const monthEnd = dateFns.endOfMonth(monthStart);
        let startDate = dateFns.startOfWeek(monthStart, { weekStartsOn: 1 });
        startDate.setDate(startDate.getDate());
        const endDate = dateFns.endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day: any = startDate;
        let formattedDate = "";
        while (day <= endDate) {
            for (let i = 1; i <= 7; i++) {
                let dateChanged: Date = new Date();
                dateChanged.setDate(startDate.getDate() + i);
                formattedDate = dateFns.format(day, dateFormat);
                const cloneDay = day;

                const elementHigt = this.checkIfCriticalityHigh(day)[0];
                const indexHigt = this.checkIfCriticalityHigh(day)[1];

                const elementHalf = this.checkIfCriticalityHalf(day)[0];
                const indexHalf = this.checkIfCriticalityHalf(day)[1];

                const elementLow = this.checkIfCriticalityLow(day)[0];
                const indexLow = this.checkIfCriticalityLow(day)[1];
                days.push(
                    <td
                        className={`${styles.col} ${styles.cell} ${!dateFns.isSameMonth(day, monthStart)
                            ? styles.disabled
                            : dateFns.isSameDay(day, currentDate) ? styles.selected : ""
                            }`}
                        key={day}
                        onClick={() => this.onDateClick(cloneDay)}
                    >
                        <div className={styles["cell-container"]}>
                            <span className={styles.number}>{formattedDate}</span>

                            <div className={styles["cell-body"]}>
                                <div className={elementHigt === true ? styles["criticality-high"] : styles["disabled-element"]}>
                                    <IconComponent iconClass="d-inline-flex align-items-center" title={`lightning`} isFill={true}></IconComponent>
                                    <span className={styles["index-element"]}>{indexHigt}</span>
                                </div>
                                <div className={elementHalf === true ? styles["criticality-half"] : styles["disabled-element"]}>
                                    <IconComponent iconClass="d-inline-flex align-items-center" title={`lightning`} isFill={true}></IconComponent>
                                    <span className={styles["index-element"]}>{indexHalf}</span>
                                </div>
                                <div className={elementLow === true ? styles["criticality-low"] : styles["disabled-element"]}>
                                    <IconComponent iconClass="d-inline-flex align-items-center" title={`lightning`} isFill={true}></IconComponent>
                                    <span className={styles["index-element"]}>{indexLow}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                );
                day = dateFns.addDays(day, 1);
            }
            rows.push(
                <tr key={day}>
                    {days}
                </tr>
            );
            days = [];
        }
        return <table className={styles.body}>{rows}</table>;
    }

    onDateClick = (day: Date) => {
        let currentMount = this.state.currentMonthDate;
        if (currentMount.getMonth() === day.getMonth()) {
            this.setState({
                selectedDate: day,
                showPupUp: true
            });
        }
    };

    month = (addition: number): void => {
        const ctx: IAppContext = this.context;
        setTimeout(() => {
            if (addition != 0) {
                this.setState({
                    currentMonthDate: dateFns.addMonths(this.state.currentMonthDate, addition)
                });
                this.setState({ showPupUp: false })
            }

            if (ctx.appCfg != undefined) {
                this.getNotificationsByMonth(this.state.currentMonthDate, ctx.appCfg.generalOrder[1]).then((it: INotifications[]) => {
                    if (ctx.appCfg != undefined) {
                        this.getNotificationsByMonth(this.state.currentMonthDate, ctx.appCfg.generalOrder[0]).then((itCritica: INotifications[]) => {
                            itCritica.forEach((elementNotification) => {
                                it.push(elementNotification);
                            });
                            this.setState({
                                notificationsPriority1: it
                            })
                        });
                    }
                });
                this.getNotificationsByMonth(this.state.currentMonthDate, ctx.appCfg?.generalOrder[2]).then((it: INotifications[]) => {
                    this.setState({
                        notificationsPriority2: it
                    })
                });
                this.getNotificationsByMonth(this.state.currentMonthDate, ctx.appCfg?.generalOrder[3]).then((it: INotifications[]) => {
                    this.setState({
                        notificationsPriority3: it
                    })
                });
            }
        }, 500);
    };

    public render(): React.ReactElement<ICalendarComponentProps> {
        const ctx: IAppContext = this.context;
        if (this.title !== this.props.title) {
            this.title = this.props.title;
            this.componentDidMount();
        }

        const callBack = (modal: boolean) => {
            this.setState({ showPupUp: false, selectedDate: null })
        };

        return (
            <Stack>
                <div className={styles.calendar}>
                    {this.renderHeader()}
                    {this.renderDays()}
                    {this.renderCells()}
                </div>
                {this.state.showPupUp && ctx.appCfg != null && this.state.selectedDate !== null && <PopUpCalendarComponent callBack={callBack} showPupUp={this.state.showPupUp}
                    selectedDate={this.state.selectedDate}
                    notificationsHigh={this.getNotificationByDay(this.state.selectedDate, ctx.appCfg.generalOrder[1])}
                    notificationsHalf={this.getNotificationByDay(this.state.selectedDate, ctx.appCfg.generalOrder[2])}
                    notificationsLow={this.getNotificationByDay(this.state.selectedDate, ctx.appCfg.generalOrder[3])}
                ></PopUpCalendarComponent>}

            </Stack>
        );
    }
}
CalendarComponent.contextType = AppContext;