import * as React from "react";
import { ScrollView, View, } from "react-native";
import BaseScrollComponent from "../../../core/scrollcomponent/BaseScrollComponent";
import TSCast from "../../../utils/TSCast";
export default class ScrollComponent extends BaseScrollComponent {
    constructor(args) {
        super(args);
        this._dummyOnLayout = TSCast.cast(null);
        this._scrollViewRef = null;
        this._onScroll = this._onScroll.bind(this);
        this._onLayout = this._onLayout.bind(this);
        this._height = 0;
        this._width = 0;
        this._isSizeChangedCalledOnce = false;
    }
    scrollTo(x, y, isAnimated) {
        if (this._scrollViewRef) {
            this._scrollViewRef.scrollTo({ x, y, animated: isAnimated });
        }
    }
    render() {
        const Scroller = TSCast.cast(this.props.externalScrollView);
        return (<Scroller ref={(scrollView) => {
            this._scrollViewRef = scrollView;
            return this._scrollViewRef;
        }} removeClippedSubviews={false} scrollEventThrottle={this.props.scrollThrottle} {...this.props} horizontal={this.props.isHorizontal} onScroll={this._onScroll} onLayout={(!this._isSizeChangedCalledOnce || this.props.canChangeSize) ? this._onLayout : this._dummyOnLayout}>
                <View style={{ flexDirection: this.props.isHorizontal ? "row" : "column" }}>
                    <View style={{
            height: this.props.contentHeight,
            width: this.props.contentWidth,
        }}>
                        {this.props.children}
                    </View>
                    {this.props.renderFooter ? this.props.renderFooter() : null}
                </View>
            </Scroller>);
    }
    _onScroll(event) {
        if (event) {
            this.props.onScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentOffset.y, event);
        }
    }
    _onLayout(event) {
        if (this._height !== event.nativeEvent.layout.height || this._width !== event.nativeEvent.layout.width) {
            this._height = event.nativeEvent.layout.height;
            this._width = event.nativeEvent.layout.width;
            if (this.props.onSizeChanged) {
                this._isSizeChangedCalledOnce = true;
                this.props.onSizeChanged(event.nativeEvent.layout);
            }
        }
    }
}
ScrollComponent.defaultProps = {
    contentHeight: 0,
    contentWidth: 0,
    externalScrollView: TSCast.cast(ScrollView),
    isHorizontal: false,
    scrollThrottle: 16,
};
//# sourceMappingURL=ScrollComponent.js.map