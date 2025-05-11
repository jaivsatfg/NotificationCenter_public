import { Stack } from "@fluentui/react";
import * as React from "react";
import IconComponent from "../icons/IconComponent";
import PopUpComponent from "../popup/PupUpComponent";
import styles from "../NotificationWebPart.module.scss";
import { INotifications } from "../../common/INotifications";
import { AppContext, IAppContext } from "../../common/IAppContext";
import { VisibilityValues } from "../../common/VisibilityValues";




export interface IOtherNotificationProps {
    notifications: INotifications[];
    idUser:number;
    isTransversal:boolean;
}

  


  export default class OtherNotificationComponent extends React.Component<IOtherNotificationProps, {}> {
    static contextType = AppContext;
    

    public constructor(props: IOtherNotificationProps) {
        super(props);
    }

     


    public render(): React.ReactElement<IOtherNotificationProps> {
        
        const ctx: IAppContext = this.context;
        let showNotifications = false;
        if (this.props.notifications.length > 0) {
            const currentService = ctx.appCfg?.services.filter(s => s.title === this.props.notifications[0].service?.label);
            if (currentService != undefined && currentService.length > 0) {
                const listOfVisibilities = currentService[0].visibility.filter(p => p === VisibilityValues.Notifications);
                if (listOfVisibilities.length > 0) {
                    showNotifications = true
                }
            }
        }
       
        return (
        
            <Stack enableScopedSelectors>
               {
                 showNotifications === false?null:
                 <Stack className={styles.panelOtherNotification} enableScopedSelectors horizontal >
                 {
                     this.props.notifications.map((elem:INotifications)=>{
                         let iconClass= "";
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
                 
                         setClassNameForIcon(elem.priority);
                         return (
                             <Stack className={elem.readed===false?styles.boxNotificationCard + ' ' + styles.unRead:styles.boxNotificationCard}>
                                 <Stack className={elem.readed===false?styles.boxNotificationHeader:styles.boxNotificationHeaderReaded}>
                                     <span className={styles.boxNotificationHeaderTitol}>{elem.NotificationType?.label}</span>
                                     <span className={elem.readed===false?styles.boxNotificationHeaderIcon:styles.boxNotificationHeaderIconReaded}><IconComponent title={elem.NotificationType?.label.toLowerCase()} isFill={true}></IconComponent></span>
                                 </Stack>
                                 <Stack className={styles.boxNotificationBody}>
                                     <h5 className={styles.boxNotificationTitle}>{elem.title}</h5>
                                     <p className={styles.boxNotificationshortDesc}>{elem.shortDesc}</p>
                                     <div className={styles.boxNotificationIndicators}>
                                         <span className={iconClass}>
                                             <IconComponent title={"lightning"} isFill={true}></IconComponent>
                                         </span>
                                         <span className={styles.boxNotificationPopUpPanel}>
                                             <PopUpComponent idUser={this.props.idUser} notificationData={elem} isTransversal={this.props.isTransversal} isCritic={false} ></PopUpComponent>
                                         </span>
                                     </div>
                                 </Stack>
                                 <Stack className={elem.readed===false?styles.boxNotificationFooter:styles.boxNotificationFooterReaded}>
                                     <div>{elem.footerDesc}</div>
                                 </Stack>
                             </Stack>
 
                         )
                     })
                 }
                 </Stack>
               }
            </Stack>
        );
    }
}
OtherNotificationComponent.contextType = AppContext;