import * as React from "react";
import { Dimension } from "../dependencies/LayoutProvider";
import BaseScrollView, { ScrollEvent, ScrollViewDefaultProps } from "./BaseScrollView";
import {ViewStyle} from "react-native";

export interface ScrollComponentProps {
    onSizeChanged: (dimensions: Dimension) => void;
    onScroll: (offsetX: number, offsetY: number, rawEvent: ScrollEvent) => void;
    contentHeight: number;
    contentWidth: number;
    canChangeSize?: boolean;
    externalScrollView?: { new(props: ScrollViewDefaultProps): BaseScrollView };
    isHorizontal?: boolean;
    renderFooter?: () => JSX.Element | JSX.Element[] | null;
    scrollThrottle?: number;
    distanceFromWindow?: number;
    useWindowScroll?: boolean;
    onEndReached?:any;
    refreshText?:string;
    refreshingText?:string;
    endingText?:string;
    endText?:string;
    noDataText?:string;
    refreshedText?:string;
    refreshType?:string;
    onRefresh?:any;
    flag?:string;
    onScrollBeginDrag?: any;
    indicatorArrowImg?: {
        style: ViewStyle | ViewStyle[];
        url: string;
    };
    arrowStyle?: any;
    indicatorImg?: {
        style: any;
        url: string;
    };
}

interface ScrollComponentState {
    loadTitle:string;
    prTitle:string;
    prLoading: boolean;
    prArrowDeg: any;
    prTimeDisplay: string;
    beginScroll: boolean;
    prState: number;
}
export default abstract class BaseScrollComponent extends React.Component<ScrollComponentProps, ScrollComponentState> {
    public abstract scrollTo(x: number, y: number, animate: boolean): void;
}
