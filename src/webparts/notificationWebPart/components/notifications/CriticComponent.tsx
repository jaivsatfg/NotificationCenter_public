import { Stack } from "@fluentui/react";
import * as React from "react";
import styles from "../NotificationWebPart.module.scss";
import IconComponent from "../icons/IconComponent";
import PopUpComponent from "../popup/PupUpComponent";
import { INotifications } from "../../common/INotifications";
import { AppContext, IAppContext } from "../../common/IAppContext";
import { VisibilityValues } from "../../common/VisibilityValues";


export interface ICriticComponentProps {
    notifications: INotifications[];
    titol:string;
    idUser:number;
    isTransversal:boolean;
}

  


  export default class CriticComponent extends React.Component<ICriticComponentProps, {}> {
    static contextType = AppContext;
    

    public constructor(props: ICriticComponentProps) {
        super(props);
    }

     


    public render(): React.ReactElement<ICriticComponentProps> {
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
        
            <Stack className={styles.panelCritic} enableScopedSelectors>
                {
                    this.props.isTransversal !== true?null:
                    <h2>{this.props.titol}</h2>
                }
                
                {
                    showNotifications === false?null:
                    <Stack className={styles.criticRow} enableScopedSelectors>
                    {
                        this.props.notifications.map((elem: INotifications) => {

                            const changeShortDesc = elem.footerDesc;                          

                            return (
                                
                                <Stack.Item className={elem.readed === false ? styles.criticItem : styles.criticItemReaded} grow>
                                    <IconComponent iconClass="d-inline-flex align-items-center" title={elem.NotificationType?.label.toLowerCase()} isFill={true}></IconComponent>
                                    <span className={styles.titolCritic}>{elem.title}:</span>
                                    <span className={styles.descCritic}>&nbsp;{changeShortDesc}</span>

                                    <PopUpComponent idUser={this.props.idUser} notificationData={elem} isTransversal={this.props.isTransversal} isCritic={true} ></PopUpComponent>
                                </Stack.Item>
                            )
                        })
                    }

                </Stack>
                }
            </Stack>
        );
    }
}
CriticComponent.contextType = AppContext;