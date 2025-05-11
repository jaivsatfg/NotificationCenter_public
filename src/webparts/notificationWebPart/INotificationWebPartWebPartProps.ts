import { SPFI } from "@pnp/sp";
import { UserProfiles } from "./common/UserProfiles";
import { GraphFI } from "@pnp/graph";

export interface INotificationWebPartWebPartProps {
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