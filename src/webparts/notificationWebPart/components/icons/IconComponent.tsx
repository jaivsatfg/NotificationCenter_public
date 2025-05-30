import * as React from "react";

import { BsChevronLeft, BsChevronRight, BsFileEarmarkExcel, BsFileEarmarkWord, BsFileImage, BsLightningChargeFill, BsMegaphoneFill } from "react-icons/bs";
import { BsCalendarEventFill } from "react-icons/bs";
import { BsCardText } from "react-icons/bs";
// import { BsMegaphone } from "react-icons/bs";
// import { BsCalendarEvent } from "react-icons/bs";
// import { BsFileEarmarkExcel } from "react-icons/bs";
// import { BsFileEarmarkWord } from "react-icons/bs";
// import { BsFileImage } from "react-icons/bs";
// import { BsLightningChargeFill } from "react-icons/bs";
import { BsXLg } from "react-icons/bs";
// import { BsChevronLeft } from "react-icons/bs";
// import { BsChevronRight } from "react-icons/bs";
import { BsChevronDown } from "react-icons/bs";
import { BsChevronUp } from "react-icons/bs"
import { AppContext } from "../../common/IAppContext";


export interface IconComponentProps {
    title?: string;
    isFill: boolean;
    iconClass?: string;
}

class IconComponent extends React.Component<IconComponentProps, {}> {
    static contextType = AppContext;

    public constructor(props: IconComponentProps) {
        super(props);
    }


    public render(): React.ReactElement<IconComponentProps> {
        // let ctx: IAppContext = this.context;
        const IconMegaphone = BsMegaphoneFill as unknown as React.FC;
        const IconCard = BsCardText as unknown as React.FC;
        const IconCalendar = BsCalendarEventFill as unknown as React.FC;
        const IconChevronDown = BsChevronDown as unknown as React.FC;
        const IconChevronUp = BsChevronUp as unknown as React.FC;
        const IconXLg = BsXLg as unknown as React.FC;
        const IconBsFileEarmarkExcel = BsFileEarmarkExcel as unknown as React.FC;
        const IconBsFileEarmarkWord = BsFileEarmarkWord as unknown as React.FC;
        const IconBsFileImage = BsFileImage as unknown as React.FC;
        const IconBsCardText = BsCardText as unknown as React.FC;
        const IconBsLightningChargeFill = BsLightningChargeFill as unknown as React.FC;
        const IconBsChevronLeft = BsChevronLeft as unknown as React.FC;
        const IconBsChevronRight = BsChevronRight as unknown as React.FC;

        

        switch (this.props.title?.toLowerCase()) {
            case "publicación":
                if (this.props.isFill) {
                    return (
                        <span className={this.props.iconClass}><IconMegaphone /></span>
                    )
                }
                else {
                    return (
                        <span className={this.props.iconClass}><IconMegaphone /></span>
                    )
                }
                break;
            case "indicación":
                if (this.props.isFill) {
                    return (
                        <span className={this.props.iconClass} ><IconCard /></span>

                    )
                }
                else {
                    return (
                        <span className={this.props.iconClass}><IconCard /></span>

                    )
                }
            case "evento":
                if (this.props.isFill) {
                    return (
                        <span className={this.props.iconClass} >< IconCalendar/></span>

                    )
                }
                else {
                    return (
                        <span className={this.props.iconClass}><IconCalendar /></span>

                    )
                }
            case "downarrow":
                return (
                    <IconChevronDown />
                )
            case "uparrow":
                return (
                    <IconChevronUp />
                )
            case "excel":
                return (
                    <IconBsFileEarmarkExcel />
                )
            case "word":
                return (
                    <IconBsFileEarmarkWord />
                )
            case "image":
                return (
                    <IconBsFileImage />
                )
            case "cardtext":
                return (
                    <IconBsCardText />
                )
            case "lightning":
                return (
                    <IconBsLightningChargeFill />
                )
            case "close":
                return (
                    <IconXLg />
                )
            case "left_arrow":
                return (
                    <IconBsChevronLeft />
                )
            case "right_arrow":
                return (
                    <IconBsChevronRight />
                )
            default:
                return (
                    <IconXLg />
                )
        }
    }
}
IconComponent.contextType = AppContext;
export default IconComponent;