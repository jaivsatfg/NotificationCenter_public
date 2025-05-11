//import { DefaultButton, IIconProps, Modal, Stack } from "@fluentui/react";
import * as React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Stack } from "@fluentui/react";
import styles from "../NotificationWebPart.module.scss";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AppContext, IAppContext } from "../../common/IAppContext";
import { IServiceApp } from "../../common/IServiceApp";


export interface ISelectedServicePropsState {
    selectedServiceIndex: number;
}

class SelectedServiceComponent extends React.Component<{}, ISelectedServicePropsState> {
    static contextType = AppContext;
    ctx: IAppContext;
    services?: IServiceApp[] = [];

    selectedIndex: number = 0;

    public constructor(props: {}) {
        super(props);
        this.state = {
            selectedServiceIndex: 0
        }
    }

    public componentDidMount(): void {

        const selectedItem = localStorage.getItem('selectedService');
        if (selectedItem !== null && this.services != undefined) {
            this.setState(
                {
                    selectedServiceIndex: this.services.filter(s => s.title === selectedItem)[0].itemOrdre - 1
                }
            )
        }
    }


    public render(): React.ReactElement<{}> {
        const ctx: IAppContext = this.context;
        this.ctx = ctx;
        let h3Title = '';
        this.services = this.ctx.appCfg?.services;
        if (this.services != undefined) {            
            this.services = this.services.sort((a, b) => (a.itemOrdre > b.itemOrdre) ? 1 : ((b.itemOrdre > a.itemOrdre) ? -1 : 0));
            if (this.services.length > 0 && this.services[0].itemOrdre === 0) {
                this.services = this.services.slice(1);
            }
            h3Title = this.services[this.state.selectedServiceIndex].title
        }

        const changeServicelEvent = (index: any) => {
            this.setState(
                {
                    selectedServiceIndex: index
                }
            )
            if (this.services != undefined) {
                this.context.selectedService(this.services[index]);
                localStorage.setItem('selectedService', this.services[index].title);
            }
        }
        return (
            <Stack>
                <Stack className={styles.selectedServiceTitol}>
                    <h2>Servicios</h2>
                </Stack>
                <Stack className={styles.selectedServiceBody}>
                    {
                        this.services?.map((s, index) => {
                            return (
                                <span key={index} className={this.state.selectedServiceIndex === index ? styles.active : styles.notActive} onClick={() => changeServicelEvent(index)}>
                                    <img src={s.iconUrl} alt="Icono" style={{ width: 48, height: 48 }} />
                                </span>
                            )
                        })
                    }
                </Stack>
                <Stack>
                    <h3 className={styles.selectedServiceFooter}>{h3Title}</h3>
                </Stack>
            </Stack>
        )
    }
}
SelectedServiceComponent.contextType = AppContext;
export default SelectedServiceComponent;