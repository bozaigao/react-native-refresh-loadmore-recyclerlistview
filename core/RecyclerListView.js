import { debounce } from "lodash-es";
import * as PropTypes from "prop-types";
import * as React from "react";
import { ObjectUtil, Default } from "ts-object-utils";
import ContextProvider from "./dependencies/ContextProvider";
import DataProvider from "./dependencies/DataProvider";
import LayoutProvider from "./dependencies/LayoutProvider";
import CustomError from "./exceptions/CustomError";
import RecyclerListViewExceptions from "./exceptions/RecyclerListViewExceptions";
import LayoutManager from "./layoutmanager/LayoutManager";
import Messages from "./messages/Messages";
import VirtualRenderer from "./VirtualRenderer";
import { BaseItemAnimator } from "./ItemAnimator";
import { ScrollView } from 'react-native';
import ViewRenderer from "../platform/reactnative/viewrenderer/ViewRenderer";
import { DefaultJSItemAnimator as DefaultItemAnimator } from "../platform/reactnative/itemanimators/defaultjsanimator/DefaultJSItemAnimator";
import { Platform } from "react-native";
import PullRefreshScrollView from "../platform/reactnative/scrollcomponent/PullRefreshScrollView";
import { View, Text, StyleSheet } from "react-native";
import TSCast from "react-native-refresh-loadmore-recyclerlistview/utils/TSCast";
const IS_WEB = Platform.OS === "web", refreshRequestDebouncer = debounce((executable) => {
    executable();
});
export default class RecyclerListView extends React.Component {
    constructor(props) {
        super(props);
        this._onEndReachedCalled = false;
        this._initComplete = false;
        this._relayoutReqIndex = -1;
        this._params = {
            initialOffset: 0,
            initialRenderIndex: 0,
            isHorizontal: false,
            itemCount: 0,
            renderAheadOffset: 250,
        };
        this._layout = { height: 0, width: 0 };
        this._pendingScrollToOffset = null;
        this._tempDim = { height: 0, width: 0 };
        this._initialOffset = 0;
        this._defaultItemAnimator = new DefaultItemAnimator();
        this.onRefreshEnd = () => {
            this._scrollComponent.onRefreshEnd();
        };
        this.default_props = {
            refreshedText: '释放立即刷新',
            refreshingText: '正在刷新数据中..',
            refreshText: '下拉可以刷新',
            endText: '',
            noDataText: '',
            endingText: '',
            indicatorArrowImg: {
                style: [],
                url: ''
            },
            indicatorImg: {
                style: [],
                url: ''
            },
            refreshType: 'normal',
            onRefresh: props.onRefresh,
            useLoadMore: props.useLoadMore,
            stickyHeaderIndices: null,
            onSizeChanged: null,
            canChangeSize: false,
            isHorizontal: false,
            contentHeight: 0,
            contentWidth: 0,
            onLoadMore: props.onEndReached,
            externalScrollView: TSCast.cast(ScrollView),
            scrollThrottle: 16,
        };
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);
        this._dataHasChanged = this._dataHasChanged.bind(this);
        this.scrollToOffset = this.scrollToOffset.bind(this);
        this._renderStackWhenReady = this._renderStackWhenReady.bind(this);
        this._onViewContainerSizeChange = this._onViewContainerSizeChange.bind(this);
        this._virtualRenderer = new VirtualRenderer(this._renderStackWhenReady, (offset) => {
            this._pendingScrollToOffset = offset;
        }, !props.disableRecycling);
        this.state = {
            renderStack: {},
        };
    }
    componentWillReceiveProps(newProps) {
        this._assertDependencyPresence(newProps);
        this._checkAndChangeLayouts(newProps);
        if (!this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.removeVisibleItemsListener();
        }
        else {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndexesChanged);
        }
    }
    componentDidUpdate() {
        if (this._pendingScrollToOffset) {
            const offset = this._pendingScrollToOffset;
            this._pendingScrollToOffset = null;
            if (this.props.isHorizontal) {
                offset.y = 0;
            }
            else {
                offset.x = 0;
            }
            setTimeout(() => {
                this.scrollToOffset(offset.x, offset.y, false);
            }, 0);
        }
        this._processOnEndReached();
        this._checkAndChangeLayouts(this.props);
    }
    componentWillUnmount() {
        if (this.props.contextProvider) {
            const uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                this.props.contextProvider.save(uniqueKey, this.getCurrentScrollOffset());
                if (this.props.forceNonDeterministicRendering) {
                    if (this._virtualRenderer) {
                        const layoutManager = this._virtualRenderer.getLayoutManager();
                        if (layoutManager) {
                            const layoutsToCache = layoutManager.getLayouts();
                            this.props.contextProvider.save(uniqueKey + "_layouts", JSON.stringify({ layoutArray: layoutsToCache }));
                        }
                    }
                }
            }
        }
    }
    componentWillMount() {
        if (this.props.contextProvider) {
            const uniqueKey = this.props.contextProvider.getUniqueKey();
            if (uniqueKey) {
                const offset = this.props.contextProvider.get(uniqueKey);
                if (typeof offset === "number" && offset > 0) {
                    this._initialOffset = offset;
                }
                if (this.props.forceNonDeterministicRendering) {
                    const cachedLayouts = this.props.contextProvider.get(uniqueKey + "_layouts");
                    if (cachedLayouts && typeof cachedLayouts === "string") {
                        this._cachedLayouts = JSON.parse(cachedLayouts).layoutArray;
                    }
                }
                this.props.contextProvider.remove(uniqueKey);
            }
        }
    }
    scrollToIndex(index, animate) {
        const layoutManager = this._virtualRenderer.getLayoutManager();
        if (layoutManager) {
            const offsets = layoutManager.getOffsetForIndex(index);
            this.scrollToOffset(offsets.x, offsets.y, animate);
        }
        else {
            console.warn(Messages.WARN_SCROLL_TO_INDEX);
        }
    }
    scrollToItem(data, animate) {
        const count = this.props.dataProvider.getSize();
        for (let i = 0; i < count; i++) {
            if (this.props.dataProvider.getDataForIndex(i) === data) {
                this.scrollToIndex(i, animate);
                break;
            }
        }
    }
    scrollToTop(animate) {
        this.scrollToOffset(0, 0, animate);
    }
    scrollToEnd(animate) {
        const lastIndex = this.props.dataProvider.getSize() - 1;
        this.scrollToIndex(lastIndex, animate);
    }
    scrollToOffset(x, y, animate = false) {
        if (this._scrollComponent) {
            this._scrollComponent.scrollTo(x, y, animate);
        }
    }
    getCurrentScrollOffset() {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
    }
    findApproxFirstVisibleIndex() {
        const viewabilityTracker = this._virtualRenderer.getViewabilityTracker();
        return viewabilityTracker ? viewabilityTracker.findFirstLogicallyVisibleIndex() : 0;
    }
    render() {
        return (<PullRefreshScrollView ref={(scrollComponent) => {
            this._scrollComponent = scrollComponent;
            return this._scrollComponent;
        }} {...this.props} {...this.props.scrollViewProps} {...this.default_props} onScroll={this._onScroll} onSizeChanged={this._onSizeChanged} contentHeight={this._initComplete ? this._virtualRenderer.getLayoutDimension().height : 0} contentWidth={this._initComplete ? this._virtualRenderer.getLayoutDimension().width : 0}>
                {this._generateRenderStack()}
            </PullRefreshScrollView>);
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
        jsx.push(<Text key={2} style={{ color: '#979aa0' }}>{'加载跟多'}</Text>);
        return (jsx);
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
        this._scrollComponent.onLoadFinish();
    }
    onNoDataToLoad() {
        this._scrollComponent.onNoDataToLoad();
    }
    _checkAndChangeLayouts(newProps, forceFullRender) {
        this._params.isHorizontal = newProps.isHorizontal;
        this._params.itemCount = newProps.dataProvider.getSize();
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        if (forceFullRender || this.props.layoutProvider !== newProps.layoutProvider || this.props.isHorizontal !== newProps.isHorizontal) {
            this._virtualRenderer.setLayoutManager(new LayoutManager(newProps.layoutProvider, this._layout, newProps.isHorizontal));
            this._virtualRenderer.refreshWithAnchor();
            this._refreshViewability();
        }
        else if (this.props.dataProvider !== newProps.dataProvider) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(newProps.dataProvider.getFirstIndexToProcessInternal(), newProps.dataProvider.getSize());
                this._virtualRenderer.refresh();
            }
        }
        else if (this._relayoutReqIndex >= 0) {
            const layoutManager = this._virtualRenderer.getLayoutManager();
            if (layoutManager) {
                layoutManager.reLayoutFromIndex(this._relayoutReqIndex, newProps.dataProvider.getSize());
                this._relayoutReqIndex = -1;
                this._refreshViewability();
            }
        }
    }
    _refreshViewability() {
        this._virtualRenderer.refresh();
        this._queueStateRefresh();
    }
    _queueStateRefresh() {
        refreshRequestDebouncer(() => {
            this.setState((prevState) => {
                return prevState;
            });
        });
    }
    _onSizeChanged(layout) {
        const hasHeightChanged = this._layout.height !== layout.height, hasWidthChanged = this._layout.width !== layout.width;
        this._layout.height = layout.height;
        this._layout.width = layout.width;
        if (layout.height === 0 || layout.width === 0) {
            throw new CustomError(RecyclerListViewExceptions.layoutException);
        }
        if (!this._initComplete) {
            this._initComplete = true;
            this._initTrackers();
            this._processOnEndReached();
        }
        else if ((hasHeightChanged && hasWidthChanged) ||
            (hasHeightChanged && this.props.isHorizontal) ||
            (hasWidthChanged && !this.props.isHorizontal)) {
            this._checkAndChangeLayouts(this.props, true);
        }
        else {
            this._refreshViewability();
        }
    }
    _renderStackWhenReady(stack) {
        this.setState(() => {
            return { renderStack: stack };
        });
    }
    _initTrackers() {
        this._assertDependencyPresence(this.props);
        if (this.props.onVisibleIndexesChanged) {
            this._virtualRenderer.attachVisibleItemsListener(this.props.onVisibleIndexesChanged);
        }
        this._params = {
            initialOffset: this.props.initialOffset ? this.props.initialOffset : this._initialOffset,
            initialRenderIndex: this.props.initialRenderIndex,
            isHorizontal: this.props.isHorizontal,
            itemCount: this.props.dataProvider.getSize(),
            renderAheadOffset: this.props.renderAheadOffset,
        };
        this._virtualRenderer.setParamsAndDimensions(this._params, this._layout);
        this._virtualRenderer.setLayoutManager(new LayoutManager(this.props.layoutProvider, this._layout, this.props.isHorizontal, this._cachedLayouts));
        this._virtualRenderer.setLayoutProvider(this.props.layoutProvider);
        this._virtualRenderer.init();
        const offset = this._virtualRenderer.getInitialOffset();
        if (offset.y > 0 || offset.x > 0) {
            this._pendingScrollToOffset = offset;
            this.setState({});
        }
        else {
            this._virtualRenderer.startViewabilityTracker();
        }
    }
    _assertDependencyPresence(props) {
        if (!props.dataProvider || !props.layoutProvider) {
            throw new CustomError(RecyclerListViewExceptions.unresolvedDependenciesException);
        }
    }
    _assertType(type) {
        if (!type && type !== 0) {
            throw new CustomError(RecyclerListViewExceptions.itemTypeNullException);
        }
    }
    _dataHasChanged(row1, row2) {
        return this.props.dataProvider.rowHasChanged(row1, row2);
    }
    _renderRowUsingMeta(itemMeta) {
        const dataSize = this.props.dataProvider.getSize(), dataIndex = itemMeta.dataIndex;
        if (!ObjectUtil.isNullOrUndefined(dataIndex) && dataIndex < dataSize) {
            const itemRect = this._virtualRenderer.getLayoutManager().getLayouts()[dataIndex], data = this.props.dataProvider.getDataForIndex(dataIndex), type = this.props.layoutProvider.getLayoutTypeForIndex(dataIndex);
            this._assertType(type);
            if (!this.props.forceNonDeterministicRendering) {
                this._checkExpectedDimensionDiscrepancy(itemRect, type, dataIndex);
            }
            return (<ViewRenderer key={itemMeta.key} data={data} dataHasChanged={this._dataHasChanged} x={itemRect.x} y={itemRect.y} layoutType={type} index={dataIndex} layoutProvider={this.props.layoutProvider} forceNonDeterministicRendering={this.props.forceNonDeterministicRendering} isHorizontal={this.props.isHorizontal} onSizeChanged={this._onViewContainerSizeChange} childRenderer={this.props.rowRenderer} height={itemRect.height} width={itemRect.width} itemAnimator={Default.value(this.props.itemAnimator, this._defaultItemAnimator)} extendedState={this.props.extendedState}/>);
        }
        return null;
    }
    _onViewContainerSizeChange(dim, index) {
        this._virtualRenderer.getLayoutManager().overrideLayout(index, dim);
        if (this._relayoutReqIndex === -1) {
            this._relayoutReqIndex = index;
        }
        else {
            this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
        }
        this._queueStateRefresh();
    }
    _checkExpectedDimensionDiscrepancy(itemRect, type, index) {
        const layoutManager = this._virtualRenderer.getLayoutManager();
        layoutManager.setMaxBounds(this._tempDim);
        this.props.layoutProvider.setLayoutForType(type, this._tempDim, index);
        layoutManager.setMaxBounds(this._tempDim);
        if (itemRect.height !== this._tempDim.height || itemRect.width !== this._tempDim.width) {
            if (this._relayoutReqIndex === -1) {
                this._relayoutReqIndex = index;
            }
            else {
                this._relayoutReqIndex = Math.min(this._relayoutReqIndex, index);
            }
        }
    }
    _generateRenderStack() {
        const renderedItems = [];
        for (const key in this.state.renderStack) {
            if (this.state.renderStack.hasOwnProperty(key)) {
                renderedItems.push(this._renderRowUsingMeta(this.state.renderStack[key]));
            }
        }
        return renderedItems;
    }
    _onScroll(offsetX, offsetY, rawEvent) {
        this._virtualRenderer.updateOffset(offsetX, offsetY);
        if (this.props.onScroll) {
            this.props.onScroll(rawEvent, offsetX, offsetY);
        }
        this._processOnEndReached();
    }
    _processOnEndReached() {
        if (this.props.onEndReached && this._virtualRenderer) {
            const layout = this._virtualRenderer.getLayoutDimension(), windowBound = this.props.isHorizontal ? layout.width - this._layout.width : layout.height - this._layout.height, viewabilityTracker = this._virtualRenderer.getViewabilityTracker(), lastOffset = viewabilityTracker ? viewabilityTracker.getLastOffset() : 0;
            if (windowBound - lastOffset <= Default.value(this.props.onEndReachedThreshold, 0)) {
                if (!this._onEndReachedCalled) {
                    this._onEndReachedCalled = true;
                    this.props.onEndReached();
                }
            }
            else {
                this._onEndReachedCalled = false;
            }
        }
    }
}
RecyclerListView.defaultProps = {
    canChangeSize: false,
    disableRecycling: false,
    initialOffset: 0,
    initialRenderIndex: 0,
    isHorizontal: false,
    onEndReachedThreshold: 0,
    renderAheadOffset: IS_WEB ? 1000 : 250,
};
RecyclerListView.propTypes = {};
RecyclerListView.propTypes = {
    layoutProvider: PropTypes.instanceOf(LayoutProvider).isRequired,
    dataProvider: PropTypes.instanceOf(DataProvider).isRequired,
    contextProvider: PropTypes.instanceOf(ContextProvider),
    rowRenderer: PropTypes.func.isRequired,
    initialOffset: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    isHorizontal: PropTypes.bool,
    onScroll: PropTypes.func,
    externalScrollView: PropTypes.func,
    onEndReached: PropTypes.func,
    onEndReachedThreshold: PropTypes.number,
    onVisibleIndexesChanged: PropTypes.func,
    renderFooter: PropTypes.func,
    initialRenderIndex: PropTypes.number,
    scrollThrottle: PropTypes.number,
    canChangeSize: PropTypes.bool,
    distanceFromWindow: PropTypes.number,
    useWindowScroll: PropTypes.bool,
    disableRecycling: PropTypes.bool,
    forceNonDeterministicRendering: PropTypes.bool,
    extendedState: PropTypes.object,
    itemAnimator: PropTypes.instanceOf(BaseItemAnimator),
    scrollViewProps: PropTypes.object,
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
//# sourceMappingURL=RecyclerListView.js.map