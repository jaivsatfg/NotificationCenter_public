import { Stack } from "@fluentui/react";
import * as React from "react";
import CriticComponent from "./CriticComponent";
import OtherNotificationComponent from "./OtherNotificationComponent";
import { ICriticNotification } from "../../common/ICriticNotification";
import { IOtherNotification } from "../../common/IOtherNotification";
import { AppContext } from "../../common/IAppContext";

export interface INotificationComponentProps {
    idUser:number;
    isTransversal:boolean;
    criticNotifications:ICriticNotification;
    otherNotifications:IOtherNotification;
} 


  export default class NotificationComponent extends React.Component<INotificationComponentProps, {}> {
    static contextType = AppContext;
    

    public constructor(props: INotificationComponentProps) {
        super(props);
    }


    public render(): React.ReactElement<INotificationComponentProps> {
        //const ctx: IAppContext = this.context;

        return (
            <Stack>
                <Stack>
                    <CriticComponent titol={this.props.criticNotifications.titol} isTransversal={this.props.isTransversal} idUser={this.props.idUser} notifications={this.props.criticNotifications.criticNotifications}></CriticComponent>
                </Stack>
                <Stack>
                    <OtherNotificationComponent isTransversal={this.props.isTransversal} idUser={this.props.idUser} notifications={this.props.otherNotifications.otherNotifications}></OtherNotificationComponent>
                </Stack>
            </Stack>
        );
    }
}
NotificationComponent.contextType = AppContext;