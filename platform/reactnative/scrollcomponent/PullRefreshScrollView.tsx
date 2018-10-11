/**
 * @filename PullRefreshScrollView.tsx
 * @author 何晏波
 * @QQ 1054539528
 * @date 2018/9/29
 * @Description: 封装下拉刷新上拉加载
 */
import React, {Component} from 'react';
import {
    ActivityIndicator,
    ActivityIndicatorIOS,
    Animated,
    AsyncStorage,
    Dimensions,
    Easing,
    Image, ImageBackground,
    LayoutChangeEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import ScrollableMixin from './ScrollableMixin';
import TSCast from "../../../utils/TSCast";

export enum RefreshType {
    NORMAL = 'normal',
    TEXT = 'text',
    IMAGE = 'image',
}

interface Props {
    refreshedText?: string;
    refreshingText?: string;
    refreshText?: string;
    endText?: string;
    noDataText?: string;
    endingText?: string;
    indicatorArrowImg?: {
        style: ViewStyle | ViewStyle[];
        url: string;
    },
    indicatorImg?: {
        style: any;
        url: string;
    },
    refreshType?: RefreshType;
    onRefresh?: any;
    useLoadMore?: boolean;
    onScroll?: any;
    onScrollBeginDrag?: any;
    onLoadMore?: any;
    arrowStyle?: any;
    stickyHeaderIndices?: any;
    onSizeChanged: any;
    canChangeSize?: boolean;
    isHorizontal?: boolean;
    contentHeight: number,
    contentWidth: number,
    flag?: string,
}

interface State {
    prTitle: string;
    loadTitle: string;
    prState: number;
    prArrowDeg: any;
    prTimeDisplay: string;
    prLoading: boolean;
    lmState: number;
    beginScroll: boolean;
}

export default class PullRefreshScrollView extends Component<Props, State> {
    private refreshedText;
    private refreshingText;
    private refreshText;
    private endText;
    private endingText;
    private useLoadMore;
    private base64Icon;
    private dragFlag;
    private prStoryKey;
    private scrollView;
    private lastContentHeight;
    private transform;
    private _height: number;
    private _width: number;
    private _isSizeChangedCalledOnce: boolean;
    private timer: any;
    private flag;
    private loadMoreHeight: number;

    constructor(props) {
        super(props);
        this._onLayout = this._onLayout.bind(this);
        // = this.scrollView;
        this.refreshedText = props.refreshedText;
        this.refreshingText = props.refreshingText;
        this.refreshText = props.refreshText;
        this.endText = props.endText;
        this.endingText = props.endingText;
        this.useLoadMore = props.useLoadMore;
        this._height = 0;
        this._width = 0;
        this._isSizeChangedCalledOnce = false;
        this.loadMoreHeight = 60;
        this.state = {
            prTitle: this.refreshText,
            loadTitle: this.endingText,
            prState: 0,
            prTimeDisplay: '暂无更新',
            prLoading: false,
            prArrowDeg: new Animated.Value(0),
            lmState: 0,
            beginScroll: null,
        };


        this.base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAABQBAMAAAD8TNiNAAAAJ1BMVEUAAACqqqplZWVnZ2doaGhqampoaGhpaWlnZ2dmZmZlZWVmZmZnZ2duD78kAAAADHRSTlMAA6CYqZOlnI+Kg/B86E+1AAAAhklEQVQ4y+2LvQ3CQAxGLSHEBSg8AAX0jECTnhFosgcjZKr8StE3VHz5EkeRMkF0rzk/P58k9rgOW78j+TE99OoeKpEbCvcPVDJ0OvsJ9bQs6Jxs26h5HCrlr9w8vi8zHphfmI0fcvO/ZXJG8wDzcvDFO2Y/AJj9ADE7gXmlxFMIyVpJ7DECzC9J2EC2ECAAAAAASUVORK5CYII=';
        this.dragFlag = false; //scrollview是否处于拖动状态的标志
        this.prStoryKey = 'prtimekey';


    }

    // 滚动触发
    onScroll(e) {
        let target = e.nativeEvent;
        let y = target.contentOffset.y;


        if (this.dragFlag) {
            if (Platform.OS === 'ios') {
                if (y <= -70) {
                    this.upState();

                } else {
                    this.downState();
                }
            } else if (Platform.OS === 'android') {
                if (y <= 10) {
                    this.upState();

                } else {
                    this.downState();
                }
            }
        }

        this.onCheckEndReached(target);


        if (this.props.onScroll) {
            this.props.onScroll(e);
        }
    }

    // 高于临界值状态
    upState() {
        this.setState({
            prTitle: this.refreshedText,
            prState: 1
        });

        Animated.timing(this.state.prArrowDeg, {
            toValue: 1,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }

    // 低于临界值状态
    downState() {
        this.setState({
            prTitle: this.refreshText,
            prState: 0
        });
        Animated.timing(this.state.prArrowDeg, {
            toValue: 0,
            duration: 100,
            easing: Easing.inOut(Easing.quad)
        }).start();
    }

    // 手指离开
    onScrollEndDrag(e) {
        let target = e.nativeEvent;
        let y = target.contentOffset.y;

        this.dragFlag = false;
        if (y <= this.loadMoreHeight && y >= 10 && Platform.OS === 'android') {
            this.scrollView.scrollTo({x: 0, y: this.loadMoreHeight, animated: true});
        }
        if (this.state.prState) {

            // 回到待收起状态
            this.scrollView.scrollTo({x: 0, y: -70, animated: true});


            this.setState({
                prTitle: this.refreshingText,
                prLoading: true,
                prArrowDeg: new Animated.Value(0),

            });

            // 触发外部的下拉刷新方法
            if (this.props.onRefresh) {
                this.props.onRefresh(this);
            }
        }
    }

    // 手指未离开
    onScrollBeginDrag() {
        this.setState({
            beginScroll: true
        });
        this.dragFlag = true;

        if (this.props.onScrollBeginDrag) {
            this.props.onScrollBeginDrag();
        }
    }

    onCheckEndReached(target) {
        if (!this.useLoadMore || this.state.lmState) {
            return;
        }
        let contentSize = target.contentSize;
        let layoutMeasurement = target.layoutMeasurement;
        let y = target.contentOffset.y;

        if (contentSize.height - layoutMeasurement.height - y < 40) {

            // 触发外部的滚动加载方法
            if (this.props.onLoadMore && this.lastContentHeight !== contentSize.height) {
                this.lastContentHeight = contentSize.height;
                this.props.onLoadMore(this);
            }

        }

    }


    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2018/9/29
     * @function: 刷新结束
     */
    onRefreshEnd() {
        let now = new Date().getTime();

        this.setState({
            prTitle: this.refreshText,
            prLoading: false,
            beginScroll: false,
            prTimeDisplay: dateFormat(now, 'yyyy-MM-dd hh:mm')
        });

        // 存一下刷新时间
        AsyncStorage.setItem(this.prStoryKey, now.toString());
        if (Platform.OS === 'ios') {
            this.scrollView.scrollTo({x: 0, y: 0, animated: true});
        } else if (Platform.OS === 'android') {
            this.scrollView.scrollTo({x: 0, y: this.loadMoreHeight, animated: true});
        }
    }


    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2018/9/29
     * @function: 数据加载完成
     */
    onLoadFinish() {
        this.setState({loadTitle: this.props.endText});
    }


    /**
     * @author 何晏波
     * @QQ 1054539528
     * @date 2018/9/29
     * @function: 没有数据可加载
     */
    onNoDataToLoad() {
        this.setState({loadTitle: this.props.noDataText});
    }

    componentDidMount() {
        AsyncStorage.getItem(this.prStoryKey, (error, result: any) => {


            if (result) {
                let tmp = result;

                tmp = parseInt(tmp, 10);

                //将时间传入下拉刷新的state
                this.setState({
                    prTimeDisplay: dateFormat(new Date(tmp), 'yyyy-MM-dd hh:mm'),
                });

            }


        });
    }


    componentWillReceiveProps() {
        if (this.flag !== this.props.flag) {
            if (Platform.OS === 'android') {
                this.setState({
                    prTitle: this.refreshingText,
                    prLoading: true,
                    prArrowDeg: new Animated.Value(0),

                });
                this.timer = setTimeout(() => {
                    this.scrollView.scrollTo({x: 0, y: this.loadMoreHeight, animated: true});
                    this.timer && clearTimeout(this.timer);
                }, 1000);
            }
            this.flag = this.props.flag;
        }

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
                //@ts-ignore
                jsxarr.push(<ImageBackground style={indicatorStyle} source={{uri: this.props.indicatorImg.url}}/>);
            } else {
                jsxarr.push(null);
            }
        } else if (this.state.prLoading) {
            //@ts-ignore
            jsxarr.push(<ActivityIndicator style={indicatorStyle} animated={true} color={'#488eff'}/>);
        } else {
            jsxarr.push(null);
        }

        if (this.props.indicatorArrowImg.url) {
            if (this.props.indicatorArrowImg.style) {
                arrowStyle = this.props.arrowStyle.style;
            }
            arrowStyle.transform = this.transform;
            if (!this.state.prLoading) {
                jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'}
                                            source={{uri: this.props.indicatorArrowImg.url}}/>);
            } else {
                jsxarr.push(null);
            }
        } else if (!this.state.prLoading) {
            jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'}
                                        source={{uri: this.base64Icon}}/>);
        } else {
            jsxarr.push(null);
        }
        jsxarr.push(<Text style={styles.prState}>{this.state.prTitle}</Text>)

        return (
            <View style={{alignItems: 'center'}}>
                <View style={styles.indicatorContent}>

                    {jsxarr.map((item, index) => {
                        return <View key={index}>{item}</View>
                    })}

                </View>
                <Text style={styles.prText}>上次更新时间：{this.state.prTimeDisplay}</Text>
            </View>
        );

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

        jsx.push(<Text key={2} style={{color:'#979aa0'}}>{this.state.loadTitle}</Text>);

        return (jsx);
    }

    rendeTextContent() {

        let prStateStyle = {
            marginBottom: 20,
            fontSize: 12,
        };

        return (<Text style={prStateStyle}>{this.state.prTitle}</Text>);
    }

    rendeImgContent() {
        this.transform = [{
            rotate: this.state.prArrowDeg.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '-180deg']
            })
        }];
        let jsxarr = [];
        let arrowStyle = {
            width: 14,
            height: 23,
            marginBottom: 20,
            transform: this.transform
        };
        let indicatorStyle = {
            width: 16,
            height: 16,
            marginBottom: 20,
        };

        if (this.props.indicatorImg.url) {
            if (this.props.indicatorImg.style) {
                indicatorStyle = this.props.indicatorImg.style;
            }
            if (this.state.prLoading) {
                jsxarr.push(<Image style={indicatorStyle} source={{uri: this.props.indicatorImg.url}}/>);
            } else {
                jsxarr.push(null);
            }
        } else if (this.state.prLoading) {
            //@ts-ignore
            jsxarr.push(<ActivityIndicatorIOS style={indicatorStyle} animated={true}/>);
        } else {
            jsxarr.push(null);
        }

        if (this.props.indicatorArrowImg.url) {
            if (this.props.indicatorArrowImg.style) {
                arrowStyle = this.props.arrowStyle.style;
            }
            arrowStyle.transform = this.transform;
            if (!this.state.prLoading) {
                jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'}
                                            source={{uri: this.props.indicatorArrowImg.url}}/>);
            } else {
                jsxarr.push(null);
            }
        } else if (!this.state.prLoading) {
            jsxarr.push(<Animated.Image style={arrowStyle} resizeMode={'contain'}
                                        source={{uri: this.base64Icon}}/>);
        } else {
            jsxarr.push(null);
        }

        return jsxarr;
    }

    renderIndicatorContent() {
        if (Dimensions.get('window').height - this.props.contentHeight > 0 && Platform.OS === 'android') {
            return null;
        }

        let type = this.props.refreshType;
        let jsx = null;

        if (type === RefreshType.NORMAL) {
            jsx = [this.renderNormalContent()];
        }
        if (type === RefreshType.TEXT) {
            jsx = [this.rendeTextContent()];
        }

        //暂不支持图片刷新
        if (type === RefreshType.IMAGE) {
            return;
        }


        return (
            <View style={Platform.OS === 'ios' ? styles.pullRefresh : {width:Dimensions.get('window').width, height: this.loadMoreHeight}}>

                {jsx.map((item, index) => {
                    return <View key={index}>{item}</View>
                })}
            </View>
        );
    }

    renderIndicatorContentBottom() {
        if (!this.props.useLoadMore) {
            return null;
        }
        if (Dimensions.get('window').height - this.props.contentHeight > 0) {
            return null;
        }
        let jsx = [this.renderBottomContent()];

        return (
            <View style={styles.loadMore}>

                {jsx.map((item, index) => {
                    return <View key={index}>{item}</View>
                })}
            </View>
        );
    }

    getScrollResponder() {
        return this.scrollView.getScrollResponder();
    }

    setNativeProps(props) {
        this.scrollView.setNativeProps(props);
    }

    fixSticky() {
        let stickyHeaderIndices = [];
        let propsStickHeader = this.props.stickyHeaderIndices || [];

        for (let i = 0; i < propsStickHeader.length; i++) {
            if (i > 0) {
                stickyHeaderIndices.push(propsStickHeader[i] + 1);
            }

        }
        return stickyHeaderIndices;
    }


    render() {

        return (<ScrollView
            ref={(scrollView) => {
                this.scrollView = scrollView
            }}
            {...this.props}
            bounces={true}
            onMomentumScrollEnd={(e) => {
                if (Platform.OS === 'android') {
                    let target = e.nativeEvent;
                    let y = target.contentOffset.y;

                    if (y >= 0 && y <= this.loadMoreHeight) {
                        this.setState({
                            prTitle: this.refreshingText,
                            prLoading: true,
                            prArrowDeg: new Animated.Value(0),

                        });

                        // 触发外部的下拉刷新方法
                        if (this.props.onRefresh) {
                            this.props.onRefresh(this);
                        }
                    }
                }

            }}
            stickyHeaderIndices={this.props.stickyHeaderIndices ? [this.props.stickyHeaderIndices] : null}
            scrollEventThrottle={16}
            onScrollEndDrag={(e) => this.onScrollEndDrag(e)}
            onScrollBeginDrag={() => this.onScrollBeginDrag()}
            onScroll={(e) => this.onScroll(e)}
            onLayout={(!this._isSizeChangedCalledOnce || this.props.canChangeSize) ? this._onLayout : this._dummyOnLayout}
        >
            <View style={{flexDirection: this.props.isHorizontal ? "row" : "column"}}>
                {this.renderIndicatorContent()}
                <View style={{
                    height: this.props.contentHeight,
                    width: this.props.contentWidth,
                }}>
                    {this.props.children}
                </View>
                {this.useLoadMore ? this.renderIndicatorContentBottom() : null}
            </View>
        </ScrollView>);

    }

    private _dummyOnLayout: (event: LayoutChangeEvent) => void = TSCast.cast(null);

    private _onLayout(event: LayoutChangeEvent): void {
        if (this._height !== event.nativeEvent.layout.height || this._width !== event.nativeEvent.layout.width) {
            this._height = event.nativeEvent.layout.height;
            this._width = event.nativeEvent.layout.width;
            if (this.props && this.props.onSizeChanged) {
                this._isSizeChangedCalledOnce = true;
                this.props.onSizeChanged(event.nativeEvent.layout);
            }
        }
    }

}


const dateFormat = function (dateTime, fmt) {
    let date = new Date(dateTime);

    let tmp = fmt || 'yyyy-MM-dd';
    let o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
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
}
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

Object.assign(PullRefreshScrollView.prototype, ScrollableMixin);
