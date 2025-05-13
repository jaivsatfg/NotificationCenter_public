import { SPFI } from "@pnp/sp";
import { IConfigApp } from "./IConfigApp";
import * as React from "react";

export interface IAppContext {
    appCfg?: IConfigApp;
    spWeb?: SPFI;
    isReaded?:any;
    selectedService?:any;
}

const appCtx:IAppContext = {
    isReaded: null,
    selectedService: null,
    appCfg: undefined
};

export const AppContext = React.createContext(appCtx);