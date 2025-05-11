import { GraphFI } from "@pnp/graph";
import { SPFI } from "@pnp/sp";
import { UserProfiles } from "../common/UserProfiles";

export interface INotificationWebPartProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  userId: number;
  userProfile: UserProfiles;
  domain:string;
  webFisicName: string;
  webUrl:string;
  spWeb: SPFI;
  graph: GraphFI;
}
