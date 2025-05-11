import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'NotificationWebPartWebPartStrings';
import NotificationWebPart from './components/NotificationWebPart';
import { INotificationWebPartProps } from './components/INotificationWebPartProps';
import { INotificationWebPartWebPartProps } from './INotificationWebPartWebPartProps';
import { UserProfiles } from './common/UserProfiles';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import { GraphFI, graphfi, SPFx as graphSPFx } from "@pnp/graph";
import "@pnp/graph/taxonomy";


import "@pnp/sp/webs";
import "@pnp/sp/site-groups/web";
import { ISiteGroupInfo } from '@pnp/sp/site-groups/types';
import { ISiteUserInfo } from '@pnp/sp/site-users/types';


export default class NotificationWebPartWebPart extends BaseClientSideWebPart<INotificationWebPartWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private spWeb: SPFI;
  private graph: GraphFI;
  private userProfile: UserProfiles = UserProfiles.visitant;
  
  public render(): void {
    const webFisicName: string = this.context.pageContext.web.serverRelativeUrl.split('/')[this.context.pageContext.web.serverRelativeUrl.split('/').length - 1].toLocaleLowerCase();
    const webUrl: string = this.context.pageContext.web.serverRelativeUrl;
    const url = new URL(this.context.pageContext.site.absoluteUrl);
    const dominio = `${url.hostname}`;

    
    const element: React.ReactElement<INotificationWebPartProps> = React.createElement(
      NotificationWebPart,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        userId: this.context.pageContext.legacyPageContext.userId,
        userProfile: this.userProfile,
        spWeb: this.spWeb,
        graph: this.graph,
        domain: dominio,
        webFisicName: webFisicName,
        webUrl: webUrl
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this.spWeb = spfi(this.context.pageContext.site.absoluteUrl).using(SPFx(this.context));
    // this.graph = graphfi(this.context.pageContext.site.absoluteUrl).using(graphSPFx(this.context));

    this.graph = graphfi().using(graphSPFx(this.context));

    // // list all the terms that are direct children of this set
    // const infos: TermStore.Term[] = await this.graph.termStore.groups.getById("fd67ea3b-3045-4cd7-a213-76a221c6482e").sets.getById("34728dbc-3326-4b38-91f2-88ea9c87bb4f").children();
    // console.log(infos);

    const userEmail = this.context.pageContext.user.email;
    return new Promise<void>((resolve, reject) => {
      this._getEnvironmentMessage().then(message => {
        this._environmentMessage = message;
        // Gets the associated members group of a web
        this.spWeb.web.associatedMemberGroup().then((g: ISiteGroupInfo) => {
          this.spWeb.web.siteGroups.getById(g.Id).users().then((users: ISiteUserInfo[]) => {
            const existInMember = users.filter((u) => { return u.Email.toLowerCase() === userEmail.toLocaleLowerCase(); }).length > 0;
            if (existInMember) {
              this.userProfile = UserProfiles.member;
            }
            resolve();
          }).catch((reason: any) => {
            console.error(reason);
            reject();
          });
        }).catch((reason: any) => {
          console.error(reason);
          reject();
        });
      }).catch((reason: any) => {
        console.error(reason);
        reject();
      });
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
