import * as React from "react";
import { ICamlQuery } from "@pnp/sp/lists";
import { mergeStyles, ThemeProvider } from "@fluentui/react";
import { DocsShimmer } from "../shimmers/DocsShimmer";
import styles from "./LastDocuments.module.scss";
import RowDocument from "./RowDocument";
import * as dayjs from "dayjs";
import { AppContext, IAppContext } from "../../common/IAppContext";
import { IDocuments } from "../../common/IDocuments";
import { IAppTaxonomyTerm } from "../../common/IAppTaxonomyTerm";

export interface ILastDocumentsState {
  documents: IDocuments[];
  loadingDocs: boolean;
}
export interface ILastDocumentsProps {
  service: string;
  maxElements: number;
  loadingDocs?: boolean
}
class LastDocuments extends React.Component<ILastDocumentsProps, ILastDocumentsState> {
  static contextType = AppContext;

  constructor(props: ILastDocumentsProps) {
    super(props);
    this.state = {
      documents: [],
      loadingDocs: true
    };
  }

  public componentWillReceiveProps(): void {

    setTimeout(() => {
      this.getDocuments().then((documents: IDocuments[]) => {
        this.setState({
          documents: documents,
          loadingDocs: false
        });
      });
    }, 200);
  }

  private getDocuments(): Promise<IDocuments[]> {

    return new Promise<IDocuments[]>(async (resolve, reject) => {
      try {

        const currentServiToFilter: IAppTaxonomyTerm = this.context.appCfg.taxonomyTerms.filter((t: IAppTaxonomyTerm) => {
          return this.props.service && t.label.toLocaleLowerCase() === this.props.service.toLocaleLowerCase();
        })[0];

        if (!currentServiToFilter) {
          //Nada que mostrar no se encontró el servicio pasado por propiedades en la taxonomía.
          console.log("No se encontró el servicio" + this.props.service + " pasado por propiedades en la taxonomía.");
          resolve([]);
          return;
        }


        const listDocs = this.context.spWeb.web.lists.getById(this.context.appCfg.publicDocumentLibraryId);
        const listTitle: any = await listDocs.select("Title")();

        try {

          const selectFields: string[] = ['ID', 'Title', 'ServicioNotificacion', 'Modified', 'File', 'ItemVisible', 'FechaPublicacion'];

          const caml: ICamlQuery = {
            ViewXml: '<View Scope="RecursiveAll">'.concat(
              '<ViewFields>', selectFields.map(function (f) { return `<FieldRef Name='${f}'/>` }).join(''), '</ViewFields>',
              '<Query>',
              '<OrderBy><FieldRef Name="FechaPublicacion" Ascending="False"/></OrderBy>',
              '<Where>',
              '<And>',
              '<And>',
              '<Eq><FieldRef Name="FSObjType"/><Value Type="Integer">0</Value></Eq>',
              '<Eq><FieldRef Name="ServicioNotificacion"/><Value Type="TaxonomyFieldType">', this.props.service, '</Value></Eq>',
              '</And>',
              '<Eq><FieldRef Name="ItemVisible"/><Value Type="Integer">1</Value></Eq>',
              '</And>',
              '</Where></Query><RowLimit>', this.props.maxElements.toString(), '</RowLimit></View>'),
          };

          const items: any = await listDocs.getItemsByCAMLQuery(caml, 'File',);
          const ctx: IAppContext = this.context;

          let values: IDocuments[] = items.map((it: any) => {
            let currentServei: string = it['ServicioNotificacion'] && it['ServicioNotificacion'].Label;
            let fileUrl = it.File.LinkingUri;
            if (!fileUrl && it.File.ServerRelativeUrl) {
              const filePath: string = encodeURIComponent(it.File.ServerRelativeUrl.split('/').splice(0, it.File.ServerRelativeUrl.split('/').length - 1).join('/'));
              fileUrl = ctx.appCfg?.publicDocumentLibraryUrl.concat('/', listTitle.Title, '/Forms/AllItems.aspx?id=', it.File.ServerRelativeUrl, '&parent=', filePath);
            }

            let document: IDocuments = {
              service: currentServei,
              name: it.File && it.File.Name,
              url: fileUrl,
              modifiedDate: dayjs(it['Modified']).toDate(),
              publicationDate: it['FechaPublicacion'] !== null ? dayjs(it['FechaPublicacion']).toDate() : undefined,
            }
            return document;
          });

          values.sort((a, b) => {
            if (a.publicationDate && b.publicationDate && a.publicationDate.getTime() === b.publicationDate.getTime()) return 0;
            if (a.publicationDate && b.publicationDate && a.publicationDate.getTime() > b.publicationDate.getTime()) return -1;
            return 1;
          });
          resolve(values);
        }
        catch (ex) {
          console.error(ex);
          reject([]);
        }
      } catch (e) {
        console.error(e);
        reject([]);
      }
    });
  }
  public render(): React.ReactElement<ILastDocumentsProps> {



    if (this.state.loadingDocs) {

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
          <DocsShimmer></DocsShimmer>
        </ThemeProvider>
      );
    }
    if (this.state.documents.length > 0) {
      return (
        <table className={`table ${styles.darreresPublicacions}`}>
          <tbody>
            {
              this.state.documents.map((doc: IDocuments) => {
                return (<RowDocument item={doc} />);
              })
            }
          </tbody>
        </table>
      );
    }
    else {
      return (
        <table className={`table ${styles.darreresPublicacions}`}>
          <tbody>
            <tr><td>No se ha encontrado ningún documento</td></tr>
          </tbody>
        </table>
      );
    }
  }
}
LastDocuments.contextType = AppContext;
export default LastDocuments;