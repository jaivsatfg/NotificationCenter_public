import * as React from 'react';

import styles from './NotificationWebPart.module.scss';
import type { INotificationWebPartProps } from './INotificationWebPartProps';

import { dateAdd, PnPClientStorage } from "@pnp/core";
import "@pnp/graph/sites";
import "@pnp/graph/taxonomy";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import '@pnp/sp/items';
import "@pnp/sp/files";


import { DefaultButton, IIconProps, mergeStyles, Stack, ThemeProvider } from '@fluentui/react';
import { IOrderedTermInfo } from '@pnp/graph/taxonomy/types';
import { IItem } from '@pnp/sp/items';
import { ICamlQuery, IRenderListDataAsStreamResult } from '@pnp/sp/lists';
import * as dayjs from 'dayjs';
import dayjsext from 'dayjs-ext';
import { IConfigApp } from '../common/IConfigApp';
import { INotifications } from '../common/INotifications';
import { IDocuments } from '../common/IDocuments';
import { IServiceApp } from '../common/IServiceApp';
import { AppContext, IAppContext } from '../common/IAppContext';
import { VisibilityValues } from '../common/VisibilityValues';
import { IAppTaxonomyTerm } from '../common/IAppTaxonomyTerm';
import { IQuantitatMax } from '../common/IQuantitatMax';
import { INotificationTypeApp } from '../common/INotificationTypeApp';
import { TransversalShimmer } from './shimmers/TransversalShimmer';
import { INotificationsServiceResult } from '../common/INotificationsServiceResult';
import { UserProfiles } from '../common/UserProfiles';
import LastDocuments from './Documents/LastDocuments';
import { ICriticNotification } from '../common/ICriticNotification';
import { IOtherNotification } from '../common/IOtherNotification';
import NotificationComponent from './notifications/NotificationComponent';
import SelectedServiceComponent from './selectedService/SelectedServiceComponent';
import CalendarComponent from './calendar/Calendar';
import { VISIBILITY } from '../common/Constants';



export interface ICentreNotificacioWebPartStates {
  loadingCfg: boolean;
  appCfg?: IConfigApp;

  currentCriticNotifications: INotifications[];
  currentOtherNotifications: INotifications[];

  criticNotifications: INotifications[];
  otherNotifications: INotifications[];

  currentTransversalDocs: IDocuments[];
  transversalService: IServiceApp;
  currentSelectedService?: IServiceApp;
}

export default class NotificationWebPart extends React.Component<INotificationWebPartProps, ICentreNotificacioWebPartStates> {
  private ctx: IAppContext = {
    spWeb: this.props.spWeb
  };

  public criticNotifications: INotifications[] = [];
  public otherNotifications: INotifications[] = [];

  public currentCriticNotifications: INotifications[] = [];
  public currentOtherNotifications: INotifications[] = [];
  public currentTransversalDocs: IDocuments[] = [];

  private iconFolder: IIconProps = { iconName: 'FolderSearch' };
  private iconNewNotice: IIconProps = { iconName: 'PageAdd' };
  private iconUpload: IIconProps = { iconName: 'BulkUpload' };

  constructor(props: INotificationWebPartProps | Readonly<INotificationWebPartProps>) {
    super(props);

    this.handlerSetReader = this.handlerSetReader.bind(this);
    this.handlerChangeService = this.handlerChangeService.bind(this);

    this.ctx.isReaded = this.handlerSetReader;
    this.ctx.selectedService = this.handlerChangeService;

    const defaultTransveralService: IServiceApp = {
      title: "Centro de Notificaciones",
      abbreviation: '',
      taxonomyId: '',
      itemOrdre: 0,
      visibility: [],
      iconUrl: '',
      notificationTypesExcepted: [],
      maxDocumentItems: 10,
      maxCriticalElements: 3,
      maxServiceElements: 6
    };

    this.state = {
      loadingCfg: true,
      currentCriticNotifications: this.currentCriticNotifications,
      currentOtherNotifications: this.currentOtherNotifications,
      criticNotifications: this.criticNotifications,
      otherNotifications: this.otherNotifications,
      currentTransversalDocs: this.currentTransversalDocs,
      transversalService: defaultTransveralService
    }
  }



  public componentDidMount(): void {

    this.getConfigApp().then((cfg: IConfigApp) => {

      const transversalService = cfg.services.filter((s: IServiceApp) => {
        return s.itemOrdre === 0;
      })[0];

      cfg.services.sort((a: IServiceApp, b: IServiceApp) => {
        const aValue: number = a.itemOrdre || 999999;
        const bValue: number = b.itemOrdre || 999999;
        return aValue - bValue;
      });

      let selectedransversalService = cfg.services.filter((s: IServiceApp) => {
        return s.visibility.indexOf(VisibilityValues.Notifications) !== -1;
      })[0];

      if (localStorage.getItem('selectedService') !== null) {
        selectedransversalService = cfg.services.filter(s => s.title === localStorage.getItem('selectedService'))[0];
      }

      this.ctx.appCfg = cfg;

      this.getNotifications(transversalService).then((notifResult: INotificationsServiceResult) => {

        let transversalOtherNotifications: INotifications[];
        let transversalCriticNotifications: INotifications[];
        transversalCriticNotifications = notifResult.values.filter(s => s.priority === "Crítica");
        transversalOtherNotifications = notifResult.values.filter(s => s.priority != "Crítica");
        if (transversalCriticNotifications.length > notifResult.maxCriticalElements) {
          transversalCriticNotifications = transversalCriticNotifications.slice(0, notifResult.maxCriticalElements);
        }
        if (transversalOtherNotifications.length > notifResult.maxServiceElements) {
          transversalOtherNotifications = transversalOtherNotifications.slice(0, notifResult.maxServiceElements);
        }
        //transversalCriticNotifications
        this.getReadedNotifications(
          transversalCriticNotifications.map((n: INotifications) => { return n.id; }))
          .then((notReaders: number[]) => {
            transversalCriticNotifications.forEach((t: INotifications) => {
              if (notReaders.includes(Number(t.id))) {
                t.readed = true;
              }
            });
            this.setState({
              loadingCfg: false,
              transversalService: transversalService,
              currentSelectedService: selectedransversalService,
              currentCriticNotifications: transversalCriticNotifications
            });

          }).catch((reason: any) => { console.error(reason); });
        //transversalOtherNotifications
        this.getReadedNotifications(
          transversalOtherNotifications.map((n: INotifications) => { return n.id; }))
          .then((notReaders: number[]) => {
            transversalOtherNotifications.forEach((t: INotifications) => {
              if (notReaders.includes(Number(t.id))) {
                t.readed = true;
              }
            });

            this.setState({
              loadingCfg: false,
              transversalService: transversalService,
              currentSelectedService: selectedransversalService,
              currentOtherNotifications: transversalOtherNotifications
            });
          }).catch((reason: any) => { console.error(reason); });;
      });
      let selectedValue = localStorage.getItem('selectedService');
      if (selectedValue === null) {
        const firstService = this.ctx.appCfg?.services.filter(s => s.itemOrdre === 1)[0];
        if (firstService != undefined) {
          localStorage.setItem('selectedService', firstService.title);
        }
        selectedValue = localStorage.getItem('selectedService');
      }


      setTimeout(() => {
        const selectedServiceFromLS = this.ctx.appCfg?.services.filter(s => s.title === selectedValue);
        if (selectedServiceFromLS != undefined) {
          this.handlerChangeService(selectedServiceFromLS[0]);
        }
      }, 200);

    }).catch((reason: any) => { console.error(reason); });
  }

  private getConfigApp(): Promise<IConfigApp> {
    return new Promise<IConfigApp>(async (resolve, reject) => {

      // here we show caching the results using the PnPClientStorage class, there are many caching libraries and options available
      const store = new PnPClientStorage();
      let cfgApp: IConfigApp = store.local.get("CentroNotifAppCfg".concat('_', this.props.webFisicName));
      if (cfgApp === null) {
        //Inicializo la parametrización
        cfgApp = {
          listConfigId: '',
          listParametersId: '',
          cacheConfigDuration: 30,
          cacheDataDuration: 2,
          substringDescription: 67,
          publicDocumentLibraryId: '',
          relatedDocumentListId: '',
          publicDocumentLibraryUrl: '',
          generalOrder: [],
          termStoreId: '',
          termGroupId: '',
          services: [],
          notificationTypes: [],
          taxonomyTerms: [],
          btnUrlDocuments: '',
          btnUrlNotifications: '',
          btnUrlSearch: ''
          //taxonomyTree: []
        };

        try {
          const listConfig = this.props.spWeb.web.lists.getByTitle('CamposConfigurables');
          const listCfgId: any = await listConfig.select("Id")();

          const listParameters = this.props.spWeb.web.lists.getByTitle('AppParametros');
          const listParametersId: any = await listParameters.select("Id")();

          cfgApp.listConfigId = listCfgId.Id;
          cfgApp.listParametersId = listParametersId.Id;

          // //Busco los terminos de taxonomia a utilizar
          // // const termStore: ITermStore = await this.props.graph.termStore();
          // // const info: ITermStore = await this.props.graph.termStore();
          // const serverRelativeUrl = "/sites/NotificationCenter";
          // const site: ISite = await this.props.graph.sites.getByUrl(this.props.domain, serverRelativeUrl);
          // const info: ITermStore = await site.termStore();

          // const termGroupNotificationCenter = (await info.groups()).filter(t => {
          //   return t.displayName === 'Notification Center';
          // })[0];

          // if (termGroupNotificationCenter) {
          //   cfgApp.termGroupId = termGroupNotificationCenter.id ?? "";
          //   const termSetNotification = (await this.props.graph.termStore.groups.getById(cfgApp.termGroupId).sets()).filter(u => {
          //     const firstLabel = u.localizedNames?.filter(s => { return s; })[0];
          //     let firstLabelValue = '';
          //     if (firstLabel !== undefined && firstLabel !== null) {
          //       firstLabelValue = firstLabel.name ?? "";
          //     }
          //     return firstLabelValue.toUpperCase() === "Servicio a toda hora".toUpperCase();
          //   })[0];

          //   if (termSetNotification) {
          //     // here we get all the children of a given set
          //     const childTree = await this.props.graph.termStore.groups.getById(cfgApp.termGroupId).sets.getById(termSetNotification.id ?? "").getAllChildrenAsTree();

          //     childTree.forEach((t: IOrderedTermInfo) => {
          //       if (t.defaultLabel.indexOf('AppKewyords') != -1) {
          //         return true;
          //       }
          //       cfgApp.taxonomyTerms = cfgApp.taxonomyTerms.concat(this.getTermList(t));
          //     });
          //   }
          // }
          // else {
          //   reject("No se pudo acceder a los términos de taxonomía 'Notification Center'.");
          //   return;
          // }

          cfgApp.taxonomyTerms = [
            { 'id': '3b6792e2-536a-4122-bf10-0ef5cd90550b', 'label': 'Tipo de publicación' },
            { 'id': 'ae1785b8-66fe-4690-bb19-a0cae2453e10', 'label': 'Tipo Notificación' },
            { 'id': '78c8155a-d624-4100-8f38-e52395a4dda5', 'label': 'Tipo Servicio' },
            { 'id': 'b5a98657-739b-4dd2-a45d-4add1ff5f3d8', 'label': 'Almacenes' },
            { 'id': '73b9a221-75d1-41ab-892f-a3af48b3a023', 'label': 'Atención al cliente' },
            { 'id': '570fd065-e597-4545-b7a5-1616bbde079e', 'label': 'Compras' },
            { 'id': '340957e8-27aa-4611-a226-788426b6e394', 'label': 'Logística' },
            { 'id': 'da393065-182d-40c5-8c16-9787b93d0191', 'label': 'Postventa' },
            { 'id': '7faef1e0-706c-4634-9685-e205ae5535c4', 'label': 'Transversal' },
            { 'id': 'c88c11eb-0196-4d45-9ddb-13381c52efc9', 'label': 'Calendario' },
            { 'id': 'c18745ea-1993-4844-81b4-6a4136715352', 'label': 'Evento' },
            { 'id': '9b67934c-8291-4509-8941-c41c80f31e5d', 'label': 'Indicación' },
            { 'id': 'abdd81a2-67ab-4e6a-96cb-8f6482cb12ac', 'label': 'Publicación' },
            { 'id': '401db8e1-4537-4573-939a-3db485cc996c', 'label': 'Formulario' },
            { 'id': 'a7d068ab-220e-4c9e-9b66-5dd7fcd1ac7f', 'label': 'Instrucción' },
            { 'id': '9444f358-f878-43bc-ae97-382c03636f3e', 'label': 'Manual' },
            { 'id': '9d3fd641-ea7a-43b4-8b5d-c32171d2eb62', 'label': 'Procedimiento' },
            { 'id': 'd84f19ae-1809-4c94-8b21-ef4c39a97b9c', 'label': 'Protocolo' }
          ];

          const selectFields: string[] = ['Id', 'Title', 'Campo', 'IconLink', 'ItemOrden', 'VisibilidadNotificacion', 'ValorTaxonomia', 'AbreviaturaItem'];

          const items: IItem[] = await listConfig.items.select(selectFields.join(','))();

          // const itemsWithAttachments = await Promise.all(
          //   items.map(async (it: any) => {
          //     const id: number = it != null ? parseInt(it['ID']) : 0;
          //     const attachments = await listConfig.items.getById(id).attachmentFiles();
          //     return attachments;
          //   })
          // );
          // const fieldIconoTabs = await this.props.spWeb.web.lists.getByTitle("CamposConfigurables").fields.getByInternalNameOrTitle('IconoTabs');
          // fieldIconoTabs.expand('serverRelativeUrl');

          items.map((it: any) => {
            let visibilityValues: VisibilityValues[] = [];
            const iconUrl: any = it['IconLink'] !== null ? it['IconLink'].Url : '';

            const currentTermCamp: IAppTaxonomyTerm = cfgApp.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
              return t.id.toLocaleLowerCase() === it['Campo'].TermGuid.toLocaleLowerCase();
            })[0];

            const currentTermValor: IAppTaxonomyTerm = cfgApp.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
              return t.id.toLocaleLowerCase() === it['ValorTaxonomia'].TermGuid.toLocaleLowerCase();
            })[0];

            let currentCamp: string = it['Campo'].Label;
            if (currentTermCamp) {
              currentCamp = currentTermCamp.label
            }

            let currentValor: string = it['ValorTaxonomia'].Label;
            if (currentTermValor) {
              currentValor = currentTermValor.label
            }

            switch (it['VisibilidadNotificacion']) {
              case 'Sólo en calendario':
                visibilityValues.push(VisibilityValues.Calendar);
                break;
              case 'Sólo en notificaciones':
                visibilityValues.push(VisibilityValues.Notifications);
                break;
              case 'Calendario y notificaciones':
                visibilityValues.push(VisibilityValues.Calendar);
                visibilityValues.push(VisibilityValues.Notifications);
                break;
            };

            switch (currentCamp.toLowerCase()) {
              case 'tipo servicio':
                cfgApp.services.push({
                  title: currentValor,
                  abbreviation: it['AbreviaturaItem'] !== null ? it['AbreviaturaItem'] : '',
                  taxonomyId: it['ValorTaxonomia'].TermGuid.toLocaleLowerCase(),
                  iconUrl: iconUrl,
                  visibility: visibilityValues,
                  notificationTypesExcepted: [],
                  itemOrdre: it['ItemOrden'],
                  maxCriticalElements: 3,
                  maxServiceElements: 6,
                  maxDocumentItems: 10
                }
                );
                break;
              case 'tipo notificación':
                cfgApp.notificationTypes.push({
                  title: currentValor,
                  abbreviation: it['AbreviaturaItem'] !== null ? it['AbreviaturaItem'] : '',
                  iconUrl: iconUrl,
                  visibility: visibilityValues
                }
                );
                break;
            }
          });

          const itemsParam: IItem[] = await listParameters.items.select("ID", "Title", "ItemValor")();
          itemsParam.map((it: any) => {

            const title: string = it.Title;
            const currentValue = it["ItemValor"] || '';
            switch (title.toLocaleLowerCase()) {
              case 'cachedataduration':
                cfgApp.cacheDataDuration = parseInt(currentValue);
                break;
              case 'cacheconfigduration':
                cfgApp.cacheConfigDuration = parseInt(currentValue);
                break;
              case 'publiclibraryid':
                cfgApp.publicDocumentLibraryId = currentValue;
                break;
              case 'documentosrelacionadoslistid':
                cfgApp.relatedDocumentListId = currentValue;
                break;
              case 'publiclibraryurl':
                cfgApp.publicDocumentLibraryUrl = currentValue;
              case 'substringdescription':
                cfgApp.substringDescription = parseInt(currentValue);
                break;
              case 'ordencriticidad':
                cfgApp.generalOrder = currentValue.split(',');
                break;
              case 'btnurlsearch':
                cfgApp.btnUrlSearch = currentValue;
                break;
              case 'btnurlnotification':
                cfgApp.btnUrlNotifications = currentValue;
                break;
              case 'btnurldocuments':
                cfgApp.btnUrlDocuments = currentValue;
                break;
              case 'cantidadmaxporservicio':
                let jsonObject: IQuantitatMax[] = JSON.parse(currentValue);
                cfgApp.services.forEach((s: IServiceApp) => {
                  //Completo los maximos establecidos en la configuración
                  const currentMax = jsonObject.filter((q) => {
                    return q.servicio.toLowerCase() === s.title.toLocaleLowerCase();
                  })[0];
                  if (currentMax) {
                    s.maxCriticalElements = currentMax.maxCritica || 3;
                    s.maxServiceElements = currentMax.maxElements || 6;
                    s.maxDocumentItems = currentMax.maxDocuments || 10;
                  }
                  //Completo las tipologias que solo se muestran en notificacion
                  s.notificationTypesExcepted = cfgApp.notificationTypes.filter((n: INotificationTypeApp) => {
                    return n.visibility.indexOf(VisibilityValues.Notifications) === -1;
                  }).map((n: INotificationTypeApp) => { return n.title });
                });
                break;
            }
          });

          if (cfgApp.listConfigId
            && cfgApp.listParametersId
            && cfgApp.publicDocumentLibraryId
            && cfgApp.publicDocumentLibraryUrl
            // && cfgApp.termStoreId
            // && cfgApp.termGroupId
            && Array.isArray(cfgApp.services) && cfgApp.services.length > 0
            && Array.isArray(cfgApp.notificationTypes) && cfgApp.notificationTypes.length > 0
            && Array.isArray(cfgApp.taxonomyTerms) && cfgApp.taxonomyTerms.length > 0
          ) {
            store.local.put("CentroNotifAppCfg".concat('_', this.props.webFisicName),
              cfgApp,
              dateAdd(new Date(), "minute", cfgApp.cacheConfigDuration)
            );
          }
        }
        catch (ex) {
          console.error(ex);
          reject(null);
          return null;
        }
      }
      resolve(cfgApp);
    });
  }

  private getTermList(t: IOrderedTermInfo): IAppTaxonomyTerm[] {
    let values: IAppTaxonomyTerm[] = [];
    let currentTerm: IAppTaxonomyTerm = {
      id: t.id ?? "",
      label: t.defaultLabel
    };
    values.push(currentTerm);
    if (t.children.length > 0) {
      t.children.forEach((t: IOrderedTermInfo) => {
        values = values.concat(this.getTermList(t));
      });
    }
    return values;
  }

  private getNotifications(service: IServiceApp): Promise<INotificationsServiceResult> {
    return new Promise<INotificationsServiceResult>(async (resolve, reject) => {
      let values: INotifications[] = [];

      const notificationsList = this.ctx.spWeb?.web.lists.getByTitle('Notificaciones');
      const selectFields: string[] = ['ID', 'Attachments', 'NotificacionAprobada', 'Title', 'FechaInicioPublicacion', 'FechaFinPublicacion', 'CriticidadNotificacion', 'VisibleNotificacion', 'ServicioNotificacion', 'ClasificacionDocumento', 'TipoNotificacion', 'DescripcionBreveNotificacion', 'CuerpoNotificacion', 'ImagenNotificacion', 'PieDescriptivoNotificacion'];

      const searchTop = ((service.maxCriticalElements + service.maxServiceElements) * 2).toString();
      const notificationTypeExceptions: string = this.getOrTipologia(service.notificationTypesExcepted);
      const fldTipoNotificacionName = 'TipoNotificacion';
      const fldCriticidadNotificacionName = 'CriticidadNotificacion';
      const fldVisibleNotificacionName = 'VisibleNotificacion';

      const caml: ICamlQuery = {
        ViewXml: '<View>'.concat(
          '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
          '<Query>',
          '<Where>',
          '<And>',
          '<Eq><FieldRef Name="NotificacionAprobada"/><Value Type="Boolean">', '1', '</Value></Eq>',
          '<And>',
          '<Eq><FieldRef Name="VisibleNotificacion"/><Value Type="Choice">', VISIBILITY.SI, '</Value></Eq>',
          service.notificationTypesExcepted.length > 0 ? '<And>' : '',
          '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">', service.title, '</Value></Eq>',
          service.notificationTypesExcepted.length > 0 ? notificationTypeExceptions : '',
          service.notificationTypesExcepted.length > 0 ? '</And>' : '',
          '</And>',
          '</And>',
          '</Where>',
          '<OrderBy>',
          '<FieldRef Name="FechaInicioPublicacion" Ascending="FALSE"/>',
          '<FieldRef Name="ID" Ascending="FALSE"/>',
          '</OrderBy>',
          '</Query><RowLimit>', searchTop, '</RowLimit></View>')
      };
      let itemsResult: any = [];


      notificationsList?.renderListDataAsStream(caml).then(async (items: any) => {
        itemsResult = itemsResult.concat(items.Row);
        const dateSend = dayjsext.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";

        const caml: ICamlQuery = {
          ViewXml: '<View>'.concat(
            '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
            '<Query>',
            '<Where>',
            '<And>',
            '<Eq><FieldRef Name="NotificacionAprobada"/><Value Type="Boolean">', '1', '</Value></Eq>',
            '<And>',
            '<Leq><FieldRef Name="FechaInicioPublicacion"/><Value IncludeTimeValue="TRUE" StorageTZ="TRUE"  Type="DateTime">', dateSend, '</Value></Leq>',
            '<And>',
            '<Geq><FieldRef Name="FechaFinPublicacion"/><Value IncludeTimeValue="TRUE" StorageTZ="TRUE" Type="DateTime">', dateSend, '</Value></Geq>',
            '<And>',
            '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">', service.title, '</Value></Eq>',
            service.notificationTypesExcepted.length > 0 ? '<And>' : '',
            '<Eq><FieldRef Name="VisibleNotificacion"/><Value Type="Choice">', VISIBILITY.AUTOMATICO, '</Value></Eq>',
            service.notificationTypesExcepted.length > 1 ? '<And>' : '',
            service.notificationTypesExcepted.length > 0 ? notificationTypeExceptions : '',
            service.notificationTypesExcepted.length > 1 ? '</And>' : '',
            service.notificationTypesExcepted.length > 0 ? '</And>' : '',
            '</And>',
            '</And>',
            '</And>',
            '</And>',
            '</Where>',
            '</Query><RowLimit>', searchTop, '</RowLimit></View>'
          ),
        };
        notificationsList.renderListDataAsStream(caml).then(async (items: IRenderListDataAsStreamResult) => {
          itemsResult = itemsResult.concat(items.Row);

          itemsResult = itemsResult.sort((a: any, b: any) => {
            const dateA = new Date(dayjs(a.FechaInicioPublicacion, 'DD/M/YYYY HH:mm').format());
            const dateB = new Date(dayjs(b.FechaInicioPublicacion, 'DD/M/YYYY HH:mm').format());
            return dateB.getTime() - dateA.getTime();
          });

          values = itemsResult.map((it: any) => {
            const currentService = this.ctx.appCfg?.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
              return it['ServicioNotificacion'] && t.id.toLocaleLowerCase() === it['ServicioNotificacion'].TermID.toLocaleLowerCase();
            })[0];

            const currentClasifDocu = this.ctx.appCfg?.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
              return it['ClasificacionDocumento'] && t.id.toLocaleLowerCase() === it['ClasificacionDocumento'].TermID.toLocaleLowerCase();
            })[0];

            const currentTipusNotificacio = this.ctx.appCfg?.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
              return it[fldTipoNotificacionName] && t.id.toLocaleLowerCase() === it[fldTipoNotificacionName].TermID.toLocaleLowerCase();
            })[0];

            let currentPriority = this.ctx.appCfg?.generalOrder[this.ctx.appCfg.generalOrder.length - 1];
            if (it[fldCriticidadNotificacionName]) {
              currentPriority = it[fldCriticidadNotificacionName]
            }

            let isVisible: boolean = false;
            if (it[fldVisibleNotificacionName]) {
              const currentValue: string = it[fldVisibleNotificacionName];
              if (currentValue.toLocaleLowerCase() === 'sí') {
                isVisible = true;
              }
            }
            let notificacio: INotifications = {
              service: currentService,
              DocClasification: currentClasifDocu,
              NotificationType: currentTipusNotificacio,
              id: it["ID"],
              title: it["Title"],
              dateInit: dayjs(it["FechaInicioPublicacion."]).toDate(),
              dateEnd: dayjs(it["FechaFinPublicacion."]).toDate(),
              priority: currentPriority ?? "",
              visible: isVisible,
              shortDesc: it["DescripcionBreveNotificacion"] || '',
              description: it["CuerpoNotificacion"] || '',
              footerDesc: it["PieDescriptivoNotificacion"] || '',
              attachments: it["Attachments"] === "0" || it["Attachments"] === null ? false : true,
              readed: false,
              imageDetails: it["ImagenNotificacion"] === "" || it["ImagenNotificacion"] === null ? null : it["ImagenNotificacion"]
            }
            return notificacio;
          });

          //Sort element by visible
          values.sort((a, b) => {
            if (a.visible === b.visible) return 0;
            if (a.visible) return -1;
            return 1;
          });

          await this.getReadedNotifications(
            values.map((n: INotifications) => { return n.id; }))
            .then((notReaders: number[]) => {
              values.forEach((t: INotifications) => {
                if (notReaders.includes(Number(t.id))) {
                  t.readed = true;
                }
              });
            });


          let notificationsReaded = values.filter(item => item.readed === true);
          notificationsReaded = this.sortByCriticidadAndDate(notificationsReaded);
          let notificationsNoReaded = values.filter(item => item.readed !== true);
          notificationsNoReaded = this.sortByCriticidadAndDate(notificationsNoReaded);

          values = [...notificationsNoReaded, ...notificationsReaded];

          const result: INotificationsServiceResult = {
            values: values,
            maxCriticalElements: service.maxCriticalElements,
            maxServiceElements: service.maxServiceElements
          }
          resolve(result);
        });
      });
    })
  }

  private async getReadedNotifications(ids: number[]): Promise<number[]> {
    return new Promise<number[]>(async (resolve, reject) => {
      const readedList = this.ctx.spWeb?.web.lists.getByTitle('NotificacionesLeidas');
      const selectFields: string[] = ['IdNotificacion'];

      const caml: ICamlQuery = {
        ViewXml: '<View>'.concat(
          '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
          '<Query>',
          '<Where>',
          '<Eq><FieldRef Name="Author" LookupId="True" /><Value Type="Integer">', this.props.userId.toString(), '</Value></Eq>',
          '</Where></Query><RowLimit>2000</RowLimit></View>'),
      };
      readedList?.getItemsByCAMLQuery(caml).then((items: any) => {
        resolve(items.map((it: any) => {
          return it["IdNotificacion"] && parseInt(it["IdNotificacion"].toString());
        }));
      });
    });
  }

  private getOrTipologia(t: string[], flag?: number): string {
    if (t.length === 0) {
      return '';
    }
    let result = ''.concat('<Neq><FieldRef Name="TipoNotificacion"/><Value Type="TaxonomyFieldType">', t[0], '</Value></Neq>');
    t = t.slice(1);
    if (t.length > 0) {
      const addAnd = flag === 0 ? false : true;
      result = (addAnd ? '<And>' : '') + result;
      result += this.getOrTipologia(t, t.length === 1 ? 0 : 1);
      result += (addAnd ? '</And>' : '');
    }
    return result;
  }

  private sortByCriticidadAndDate(list: any[]): any[] {

    const critica = list.filter(item => item.priority === "Crítica");
    const alta = list.filter(item => item.priority === "Alta");
    const media = list.filter(item => item.priority === "Media");
    const baja = list.filter(item => item.priority === "Baja");

    let sendList = new Array<any>();

    const compareDates = (a: any, b: any) => {
      const dateA = new Date(a.dateEnd);
      const dateB = new Date(b.dateEnd);
      return dateA.getTime() - dateB.getTime();
    };

    critica.sort(compareDates);
    alta.sort(compareDates);
    media.sort(compareDates);
    baja.sort(compareDates);


    sendList = [...critica, ...alta, ...media, ...baja];

    return sendList;
  }


  public handlerChangeService(service: IServiceApp): void {
    this.getNotifications(service).then((notifResult: INotificationsServiceResult) => {

      let transversalOtherNotifications: INotifications[];
      let transversalCriticNotifications: INotifications[];
      transversalCriticNotifications = notifResult.values.filter(s => s.priority === "Crítica");
      transversalOtherNotifications = notifResult.values.filter(s => s.priority != "Crítica");
      if (transversalCriticNotifications.length > notifResult.maxCriticalElements) {
        transversalCriticNotifications = transversalCriticNotifications.slice(0, notifResult.maxCriticalElements);
      }
      if (transversalOtherNotifications.length > notifResult.maxServiceElements) {
        transversalOtherNotifications = transversalOtherNotifications.slice(0, notifResult.maxServiceElements);
      }

      let selectedransversalService = this.ctx.appCfg?.services.filter((s: IServiceApp) => {
        return s.visibility.indexOf(VisibilityValues.Notifications) !== -1;
      })[0];

      if (localStorage.getItem('selectedService') !== null) {
        selectedransversalService = this.ctx.appCfg?.services.filter(s => s.title === localStorage.getItem('selectedService'))[0];
      }

      //transversalCriticNotifications
      this.getReadedNotifications(
        transversalCriticNotifications.map((n: INotifications) => { return n.id; }))
        .then((notReaders: number[]) => {
          transversalCriticNotifications.forEach((t: INotifications) => {
            if (notReaders.includes(Number(t.id))) {
              t.readed = true;
            }
          });
          this.setState({
            loadingCfg: false,
            criticNotifications: transversalCriticNotifications,
            currentSelectedService: selectedransversalService
          });
        }).catch((reason: any) => { console.error(reason); });
      //transversalOtherNotifications
      this.getReadedNotifications(
        transversalOtherNotifications.map((n: INotifications) => { return n.id; }))
        .then((notReaders: number[]) => {
          transversalOtherNotifications.forEach((t: INotifications) => {
            if (notReaders.includes(Number(t.id))) {
              t.readed = true;
            }
          });
          this.setState({
            loadingCfg: false,
            otherNotifications: transversalOtherNotifications,
            currentSelectedService: selectedransversalService
          });
        }).catch((reason: any) => { console.error(reason); });
    }).catch((reason: any) => { console.error(reason); });
  }

  public handlerSetReader(idNotification: number, isTransversal: boolean, isCritic: boolean) {
    if (isTransversal) {
      if (isCritic) {
        const currentCriticNotificationsChanged = this.state.currentCriticNotifications.map(element => {
          if (element.id === idNotification) {
            element.readed = true;
          }
          return element
        })

        currentCriticNotificationsChanged.sort((a, b) => {
          if (a.readed === b.readed) return 0;
          if (a.readed) return 1;
          return -1;
        });

        this.setState({
          currentCriticNotifications: currentCriticNotificationsChanged
        });
      }
      else {
        const currentOtherNotificationsChanged = this.state.currentOtherNotifications.map(element => {
          if (element.id === idNotification) {
            element.readed = true;
          }
          return element
        })
        currentOtherNotificationsChanged.sort((a, b) => {
          if (a.readed === b.readed) return 0;
          if (a.readed) return 1;
          return -1;
        });

        this.setState({
          currentOtherNotifications: currentOtherNotificationsChanged
        });
      }
    }
    else {
      if (isCritic) {
        const criticNotificationsChanged = this.state.criticNotifications.map(element => {
          if (element.id === idNotification) {
            element.readed = true;
          }
          return element
        })
        criticNotificationsChanged.sort((a, b) => {
          if (a.readed === b.readed) return 0;
          if (a.readed) return 1;
          return -1;
        });

        this.setState({
          criticNotifications: criticNotificationsChanged
        });
      }
      else {
        const otherNotificationsChanged = this.state.otherNotifications.map(element => {
          if (element.id === idNotification) {
            element.readed = true;
          }
          return element
        })
        otherNotificationsChanged.sort((a, b) => {
          if (a.readed === b.readed) return 0;
          if (a.readed) return 1;
          return -1;
        });

        this.setState({
          otherNotifications: otherNotificationsChanged
        });

      }
    }
  }

  public render(): React.ReactElement<INotificationWebPartProps> {
    const {
    } = this.props;

    const transversalCriticData: ICriticNotification = {
      titol: this.state.transversalService.title,
      criticNotifications: this.state.currentCriticNotifications
    }

    const transversalOtherData: IOtherNotification = {
      isTransversal: true,
      otherNotifications: this.state.currentOtherNotifications
    }

    const criticData: ICriticNotification = {
      titol: this.state.transversalService.title,
      criticNotifications: this.state.criticNotifications
    }

    const otherData: IOtherNotification = {
      isTransversal: true,
      otherNotifications: this.state.otherNotifications
    }


    const {
      hasTeamsContext
    } = this.props;
    if (this.state.loadingCfg) {
      const wrapperClass = mergeStyles({
        padding: 2,
        selectors: {
          '& > .ms-Shimmer-container': {
            margin: '10px 0',
          },
        },
      });
      return (
        <ThemeProvider className={wrapperClass}>
          <TransversalShimmer></TransversalShimmer>
        </ThemeProvider>
      );
    }

    const docsAreaUrl: string = this.props.webUrl + "/DocumentosTrabajo/Forms/AllItems.aspx";
    return (
      <AppContext.Provider value={this.ctx}>
        <Stack className={`${styles.centreNotificacioWebPart} ${hasTeamsContext ? styles.teams : ''}`}>
          <div className="container mt-3 mb-5">
            <div className="row">
              {/* Left col */}
              <div className="col-8 ps-0 pe-3">
                <Stack className={styles['bg-grey'] + " p-3 rounded-2"}>
                  <NotificationComponent idUser={this.props.userId} isTransversal={true} otherNotifications={transversalOtherData} criticNotifications={transversalCriticData}></NotificationComponent>
                </Stack>
                <Stack>
                  <SelectedServiceComponent></SelectedServiceComponent>
                </Stack>
                <Stack>
                  <NotificationComponent idUser={this.props.userId} isTransversal={false} otherNotifications={otherData} criticNotifications={criticData}></NotificationComponent>
                </Stack>
              </div>
              {/* Right col */}
              <div className="col-4 p-3">
                <div className="d-flex justify-content-between flex-wrap">
                  <DefaultButton className={styles.mainbtn} href={this.ctx.appCfg?.btnUrlSearch} width="500px" target="_self" data-interception="off" title="Gestor documental" iconProps={this.iconFolder}>
                    Buscador
                  </DefaultButton>
                  {this.props.userProfile === UserProfiles.member ?
                    <>
                      <DefaultButton className={styles.mainbtn} href={this.ctx.appCfg?.btnUrlNotifications} target="_self" data-interception="off" title="Nueva notificación" iconProps={this.iconNewNotice}>
                        Notificaciones
                      </DefaultButton>                     
                    </> : <></>
                  }
                  <DefaultButton className={styles.mainbtn} href={docsAreaUrl} width="500px" target="_self" data-interception="off" title="Biblioteca de trabajo" iconProps={this.iconUpload}>
                    Biblioteca de trabajo
                  </DefaultButton>
                </div>

                <h2 className="mt-4">Eventos</h2>
                <div id="calendar">
                  {this.state.currentSelectedService && <CalendarComponent title={this.state.currentSelectedService.title}></CalendarComponent>}
                </div>
                <h2 className="mt-4">Últimas publicaciones transversales</h2>
                <LastDocuments service={this.state.transversalService.title} maxElements={this.state.transversalService.maxDocumentItems}></LastDocuments>
                {
                  this.state.currentSelectedService !== undefined && <h2 className="mt-4">Últimas publicaciones por servicio</h2>
                }
                {
                  this.state.currentSelectedService !== undefined && this.state.currentSelectedService.title != undefined
                  && <LastDocuments loadingDocs={true} service={this.state.currentSelectedService.title} maxElements={this.state.currentSelectedService.maxDocumentItems}></LastDocuments>
                }
              </div>
            </div>
          </div>
        </Stack>
      </AppContext.Provider>
    );
  }
}