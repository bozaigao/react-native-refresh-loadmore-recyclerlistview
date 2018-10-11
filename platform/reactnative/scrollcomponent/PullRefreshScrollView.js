import * as React from "react";
import { ScrollView, View, Platform, ActivityIndicator, AsyncStorage } from "react-native";
import BaseScrollComponent from "../../../core/scrollcomponent/BaseScrollComponent";
import TSCast from "../../../utils/TSCast";
import { Dimensions, Text, StyleSheet } from "react-native";
import { Animated } from "react-native";
import { Easing } from "react-native";
export default class PullRefreshScrollView extends BaseScrollComponent {
    constructor(args) {
        super(args);
        this._dummyOnLayout = TSCast.cast(null);
        this._scrollViewRef = null;
        this.state = {
            prTitle: args.refreshText,
            loadTitle: args.endingText,
            prLoading: false,
            prArrowDeg: new Animated.Value(0),
            prTimeDisplay: '暂无更新',
            beginScroll: null,
            prState: 0,
        };
        this.loadMoreHeight = 60;
        this.dragFlag = false;
        this.base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABQBAMAAAD8TNiNAAAAJ1BMVEUAAACqqqplZWVnZ2doaGhqampoaGhpaWlnZ2dmZmZlZWVmZmZnZ2duD78kAAAADHRSTlMAA6CYqZOlnI+Kg/B86E+1AAAAhklEQVQ4y+2LvQ3CQAxGLSHEBSg8AAX0jECTnhFosgcjZKr8StE3VHz5EkeRMkF0rzk/P58k9rgOW78j+TE99OoeKpEbCvcPVDJ0OvsJ9bQs6Jxs26h5HCrlr9w8vi8zHphfmI0fcvO/ZXJG8wDzcvDFO2Y/AJj9ADE7gXmlxFMIyVpJ7DECzC9J2EC2ECAAAAAASUVORK5CYII=';
        this._onScroll = this._onScroll.bind(this);
        this._onLayout = this._onLayout.bind(this);
        this._height = 0;
        this._width = 0;
        this.prStoryKey = 'prtimekey';
        this._isSizeChangedCalledOnce = false;
    }
    scrollTo(x, y, isAnimated) {
        if (this._scrollViewRef) {
            this._scrollViewRef.scrollTo({ x, y, animated: isAnimated });
        }
    }
    componentWillReceiveProps() {
        if (this.flag !== this.props.flag) {
            if (Platform.OS === 'android') {
                this.setState({
                    prTitle: this.props.refreshingText,
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0),
                });
                this.timer = setTimeout(() => {
                    this._scrollViewRef.scrollTo({ x: 0, y: this.loadMoreHeight, animated: true });
                    this.timer && clearTimeout(this.timer);
                }, 1000);
            }
            this.flag = this.props.flag;
        }
    }
    render() {
        const Scroller = TSCast.cast(this.props.externalScrollView);
        return (<Scroller ref={(scrollView) => {
            this._scrollViewRef = scrollView;
            return this._scrollViewRef;
        }} onMomentumScrollEnd={(e) => {
            if (Platform.OS === 'android') {
                let target = e.nativeEvent;
                let y = target.contentOffset.y;
                if (y >= 0 && y <= this.loadMoreHeight) {
                    this.setState({
                        prTitle: this.props.refreshingText,
                        prLoading: true,
                        prArrowDeg: new Animated.Value(0),
                    });
                    if (this.props.onRefresh) {
                        this.props.onRefresh(this);
                    }
                }
            }
        }} bounces={true} onScrollEndDrag={(e) => this.onScrollEndDrag(e)} onScrollBeginDrag={() => this.onScrollBeginDrag()} removeClippedSubviews={false} scrollEventThrottle={16} {...this.props} horizontal={this.props.isHorizontal} onScroll={this._onScroll} onLayout={(!this._isSizeChangedCalledOnce || this.props.canChangeSize) ? this._onLayout : this._dummyOnLayout}>
                <View style={{ flexDirection: this.props.isHorizontal ? "row" : "column" }}>
                    {this.renderIndicatorContent()}
                    <View style={{
            height: this.props.contentHeight,
            width: this.props.contentWidth,
        }}>
                        {this.props.children}
                    </View>
                    {this.props.onEndReached ? this.renderIndicatorContentBottom() : null}
                </View>
            </Scroller>);
    }
    onScrollBeginDrag() {
        this.setState({
            beginScroll: true
        });
        this.dragFlag = true;
        if (this.props.onScrollBeginDrag) {
            this.props.onScrollBeginDrag();
        }
    }
    onScrollEndDrag(e) {
        let target = e.nativeEvent;
        let y = target.contentOffset.y;
        this.dragFlag = false;
        if (y <= this.loadMoreHeight && y >= 10 && Platform.OS === 'android') {
            this._scrollViewRef.scrollTo({ x: 0, y: this.loadMoreHeight, animated: true });
        }
        if (this.state.prState) {
            this._scrollViewRef.scrollTo({ x: 0, y: -70, animated: true });
            this.setState({
                prTitle: this.props.refreshingText,
                prLoading: true,
                prArrowDeg: new Animated.Value(0),
            });
            if (this.props.onRefresh) {
                this.props.onRefresh(this);
            }
        }
    }
    renderIndicatorContent() {
        if (Dimensions.get('window').height - this.props.contentHeight > 0 && Platform.OS === 'android') {
            return null;
        }
        let type = this.props.refreshType;
        let jsx = [this.renderNormalContent()];
        return (<View style={Platform.OS === 'ios' ? styles.pullRefresh : { width: Dimensions.get('window').width, height: this.loadMoreHeight }}>

                {jsx.map((item, index) => {
            return <View key={index}>{item}</View>;
        })}
            </View>);
    }
    renderNormalContent() {
        this.transform = [{
                rotate: this.state.prArrowDeg.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-180deg']
                })
            }];
        let jsxarr = [];
        let arrowStyle = {
            position: 'absolute',
            width: 14,
            height: 23,
            left: -50,
            top: -4,
            transform: this.transform
        };
        let indicatorStyle = {
            position: 'absolute',
            left: -40,
            top: 2,
            width: 16,
            height: 16,
        };
        if (this.props.indicatorImg.url) {
            if (this.props.indicatorImg.style) {
                indicatorStyle = this.props.indicatorImg.style;
            }
            if (this.state.prLoading) {
                jsxarr.push(<ImageBackground style={indicatorStyle} source={{ uri: this.props.indicatorImg.url }}/>);
            }
            else {
                jsxarr.push(null);
            }
        }
        else if (this.state.prLoading) {
            jsxarr.push(<ActivityIndicator style={indicatorStyle} animated={true} color={'#488eff'}/>);
        }
        else {
            jsxarr.push(null);
        }
        if (this.props.indicatorArrowImg.url) {
            if (this.props.indicatorArrowImg.style) {
                arrowStyle = this.props.arrowStyle.style;
            }
            arrowStyle.transform = this.transform;
            if (!this.state.prLoading) {
                jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'} source={{ uri: this.props.indicatorArrowImg.url }}/>);
            }
            else {
                jsxarr.push(null);
            }
        }
        else if (!this.state.prLoading) {
            jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'} source={{ uri: this.base64Icon }}/>);
        }
        else {
            jsxarr.push(null);
        }
        jsxarr.push(<Text style={styles.prState}>{this.state.prTitle}</Text>);
        return (<View style={{ alignItems: 'center' }}>
                <View style={styles.indicatorContent}>

                    {jsxarr.map((item, index) => {
            return <View key={index}>{item}</View>;
        })}

                </View>
                <Text style={styles.prText}>上次更新时间：{this.state.prTimeDisplay}</Text>
            </View>);
    }
    renderIndicatorContentBottom() {
        let jsx = [this.renderBottomContent()];
        return (<View style={styles.loadMore}>

                {jsx.map((item, index) => {
            return <View key={index}>{item}</View>;
        })}
            </View>);
    }
    onLoadFinish() {
        this.setState({ loadTitle: this.props.endText });
    }
    onNoDataToLoad() {
        this.setState({ loadTitle: this.props.noDataText });
    }
    onRefreshEnd() {
        let now = new Date().getTime();
        this.setState({
            prTitle: this.props.refreshText,
            prLoading: false,
            beginScroll: false,
            prTimeDisplay: dateFormat(now, 'yyyy-MM-dd hh:mm')
        });
        AsyncStorage.setItem(this.prStoryKey, now.toString());
        if (Platform.OS === 'ios') {
            this._scrollViewRef.scrollTo({ x: 0, y: 0, animated: true });
        }
        else if (Platform.OS === 'android') {
            this._scrollViewRef.scrollTo({ x: 0, y: this.loadMoreHeight, animated: true });
        }
    }
    renderBottomContent() {
        let jsx = [];
        let indicatorStyle = {
            position: 'absolute',
            left: -40,
            top: -1,
            width: 16,
            height: 16
        };
        jsx.push(<Text key={2} style={{ color: '#979aa0' }}>{this.state.loadTitle}</Text>);
        return (jsx);
    }
    _onScroll(event) {
        if (event) {
            this.props.onScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentOffset.y, event);
        }
        let target = event.nativeEvent;
        let y = target.contentOffset.y;
        if (this.dragFlag) {
            if (Platform.OS === 'ios') {
                if (y <= -70) {
                    this.upState();
                }
                else {
                    this.downState();
                }
            }
            else if (Platform.OS === 'android') {
                if (y <= 10) {
                    this.upState();
                }
                else {
                    this.downState();
                }
            }
        }
        if (event) {
            this.props.onScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentOffset.y, event);
        }
    }
    upState() {
        this.setState({
            prTitle: this.props.refreshedText,
            prState: 1
        });
        Animated.timing(this.state.prArrowDeg, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }
    downState() {
        this.setState({
            prTitle: this.props.refreshText,
            prState: 0
        });
        Animated.timing(this.state.prArrowDeg, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }
    _onLayout(event) {
        console.log('_onLayout');
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
PullRefreshScrollView.defaultProps = {
    contentHeight: 0,
    contentWidth: 0,
    externalScrollView: TSCast.cast(ScrollView),
    isHorizontal: false,
    scrollThrottle: 16,
};
PullRefreshScrollView.propTypes = {};
const dateFormat = function (dateTime, fmt) {
    let date = new Date(dateTime);
    let tmp = fmt || 'yyyy-MM-dd';
    let o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        "S": date.getMilliseconds()
    };
    if (/(y+)/.test(tmp)) {
        tmp = tmp.replace(RegExp.$1, (String(date.getFullYear())).substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(tmp)) {
            tmp = tmp.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr((String(o[k])).length)));
        }
    }
    return tmp;
};
const styles = StyleSheet.create({
    pullRefresh: {
        position: 'absolute',
        top: -69,
        left: 0,
        backfaceVisibility: 'hidden',
        right: 0,
        height: 70,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    loadMore: {
        height: 35,
        backgroundColor: '#fafafa',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        height: 70,
        backgroundColor: '#fafafa',
        color: '#979aa0'
    },
    prText: {
        marginBottom: 4,
        color: '#979aa0',
        fontSize: 12,
    },
    prState: {
        marginBottom: 4,
        fontSize: 12,
        color: '#979aa0',
    },
    lmState: {
        fontSize: 12,
    },
    indicatorContent: {
        flexDirection: 'row',
        marginBottom: 5
    },
});
//# sourceMappingURL=PullRefreshScrollView.js.map