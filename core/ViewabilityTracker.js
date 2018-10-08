import BinarySearch from "../utils/BinarySearch";
export default class ViewabilityTracker {
    constructor(renderAheadOffset, initialOffset) {
        this._layouts = [];
        this._currentOffset = Math.max(0, initialOffset);
        this._maxOffset = 0;
        this._renderAheadOffset = renderAheadOffset;
        this._visibleWindow = { start: 0, end: 0 };
        this._engagedWindow = { start: 0, end: 0 };
        this._isHorizontal = false;
        this._windowBound = 0;
        this._visibleIndexes = [];
        this._engagedIndexes = [];
        this.onVisibleRowsChanged = null;
        this.onEngagedRowsChanged = null;
        this._relevantDim = { start: 0, end: 0 };
        this._valueExtractorForBinarySearch = this._valueExtractorForBinarySearch.bind(this);
    }
    init() {
        this._doInitialFit(this._currentOffset);
    }
    setLayouts(layouts, maxOffset) {
        this._layouts = layouts;
        this._maxOffset = maxOffset;
    }
    setDimensions(dimension, isHorizontal) {
        this._isHorizontal = isHorizontal;
        this._windowBound = isHorizontal ? dimension.width : dimension.height;
    }
    forceRefresh() {
        const shouldForceScroll = this._currentOffset >= (this._maxOffset - this._windowBound);
        this.forceRefreshWithOffset(this._currentOffset);
        return shouldForceScroll;
    }
    forceRefreshWithOffset(offset) {
        this._currentOffset = -1;
        this.updateOffset(offset);
    }
    updateOffset(offset) {
        let offsetTmp = Math.min(this._maxOffset, Math.max(0, offset));
        if (this._currentOffset !== offsetTmp) {
            this._currentOffset = offsetTmp;
            this._updateTrackingWindows(offset);
            let startIndex = 0;
            if (this._visibleIndexes.length > 0) {
                startIndex = this._visibleIndexes[0];
            }
            this._fitAndUpdate(startIndex);
        }
    }
    getLastOffset() {
        return this._currentOffset;
    }
    findFirstLogicallyVisibleIndex() {
        const relevantIndex = this._findFirstVisibleIndexUsingBS(0.001);
        let result = relevantIndex;
        for (let i = relevantIndex - 1; i >= 0; i--) {
            if (this._isHorizontal) {
                if (this._layouts[relevantIndex].x !== this._layouts[i].x) {
                    break;
                }
                else {
                    result = i;
                }
            }
            else if (this._layouts[relevantIndex].y !== this._layouts[i].y) {
                break;
            }
            else {
                result = i;
            }
        }
        return result;
    }
    _findFirstVisibleIndexOptimally() {
        let firstVisibleIndex = 0;
        if (this._currentOffset > 5000) {
            firstVisibleIndex = this._findFirstVisibleIndexUsingBS();
        }
        else if (this._currentOffset > 0) {
            firstVisibleIndex = this._findFirstVisibleIndexLinearly();
        }
        return firstVisibleIndex;
    }
    _fitAndUpdate(startIndex) {
        const newVisibleItems = [], newEngagedItems = [];
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex, true);
        this._fitIndexes(newVisibleItems, newEngagedItems, startIndex + 1, false);
        this._diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems, newEngagedItems);
    }
    _doInitialFit(offset) {
        let offsetTmp = Math.min(this._maxOffset, Math.max(0, offset));
        this._updateTrackingWindows(offsetTmp);
        const firstVisibleIndex = this._findFirstVisibleIndexOptimally();
        this._fitAndUpdate(firstVisibleIndex);
    }
    _findFirstVisibleIndexLinearly() {
        const count = this._layouts.length;
        let itemRect = null;
        const relevantDim = { start: 0, end: 0 };
        for (let i = 0; i < count; i++) {
            itemRect = this._layouts[i];
            this._setRelevantBounds(itemRect, relevantDim);
            if (this._itemIntersectsVisibleWindow(relevantDim.start, relevantDim.end)) {
                return i;
            }
        }
        return 0;
    }
    _findFirstVisibleIndexUsingBS(bias = 0) {
        const count = this._layouts.length;
        return BinarySearch.findClosestHigherValueIndex(count, this._visibleWindow.start + bias, this._valueExtractorForBinarySearch);
    }
    _valueExtractorForBinarySearch(index) {
        const itemRect = this._layouts[index];
        this._setRelevantBounds(itemRect, this._relevantDim);
        return this._relevantDim.end;
    }
    _fitIndexes(newVisibleIndexes, newEngagedIndexes, startIndex, isReverse) {
        const count = this._layouts.length, relevantDim = { start: 0, end: 0 };
        let i = 0, atLeastOneLocated = false;
        if (startIndex < count) {
            if (!isReverse) {
                for (i = startIndex; i < count; i++) {
                    if (this._checkIntersectionAndReport(i, false, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    }
                    else if (atLeastOneLocated) {
                        break;
                    }
                }
            }
            else {
                for (i = startIndex; i >= 0; i--) {
                    if (this._checkIntersectionAndReport(i, true, relevantDim, newVisibleIndexes, newEngagedIndexes)) {
                        atLeastOneLocated = true;
                    }
                    else if (atLeastOneLocated) {
                        break;
                    }
                }
            }
        }
    }
    _checkIntersectionAndReport(index, insertOnTop, relevantDim, newVisibleIndexes, newEngagedIndexes) {
        const itemRect = this._layouts[index];
        let isFound = false;
        this._setRelevantBounds(itemRect, relevantDim);
        if (this._itemIntersectsVisibleWindow(relevantDim.start, relevantDim.end)) {
            if (insertOnTop) {
                newVisibleIndexes.splice(0, 0, index);
                newEngagedIndexes.splice(0, 0, index);
            }
            else {
                newVisibleIndexes.push(index);
                newEngagedIndexes.push(index);
            }
            isFound = true;
        }
        else if (this._itemIntersectsEngagedWindow(relevantDim.start, relevantDim.end)) {
            if (insertOnTop) {
                newEngagedIndexes.splice(0, 0, index);
            }
            else {
                newEngagedIndexes.push(index);
            }
            isFound = true;
        }
        return isFound;
    }
    _setRelevantBounds(itemRect, relevantDim) {
        if (this._isHorizontal) {
            relevantDim.end = itemRect.x + itemRect.width;
            relevantDim.start = itemRect.x;
        }
        else {
            relevantDim.end = itemRect.y + itemRect.height;
            relevantDim.start = itemRect.y;
        }
    }
    _isItemInBounds(window, itemBound) {
        return (window.start < itemBound && window.end > itemBound);
    }
    _isItemBoundsBeyondWindow(window, startBound, endBound) {
        return (window.start >= startBound && window.end <= endBound);
    }
    _itemIntersectsWindow(window, startBound, endBound) {
        return this._isItemInBounds(window, startBound) ||
            this._isItemInBounds(window, endBound) ||
            this._isItemBoundsBeyondWindow(window, startBound, endBound);
    }
    _itemIntersectsEngagedWindow(startBound, endBound) {
        return this._itemIntersectsWindow(this._engagedWindow, startBound, endBound);
    }
    _itemIntersectsVisibleWindow(startBound, endBound) {
        return this._itemIntersectsWindow(this._visibleWindow, startBound, endBound);
    }
    _updateTrackingWindows(newOffset) {
        this._engagedWindow.start = Math.max(0, newOffset - this._renderAheadOffset);
        this._engagedWindow.end = newOffset + this._windowBound + this._renderAheadOffset;
        this._visibleWindow.start = newOffset;
        this._visibleWindow.end = newOffset + this._windowBound;
    }
    _diffUpdateOriginalIndexesAndRaiseEvents(newVisibleItems, newEngagedItems) {
        this._diffArraysAndCallFunc(newVisibleItems, this._visibleIndexes, this.onVisibleRowsChanged);
        this._diffArraysAndCallFunc(newEngagedItems, this._engagedIndexes, this.onEngagedRowsChanged);
        this._visibleIndexes = newVisibleItems;
        this._engagedIndexes = newEngagedItems;
    }
    _diffArraysAndCallFunc(newItems, oldItems, func) {
        if (func) {
            const now = this._calculateArrayDiff(newItems, oldItems), notNow = this._calculateArrayDiff(oldItems, newItems);
            if (now.length > 0 || notNow.length > 0) {
                func([...newItems], now, notNow);
            }
        }
    }
    _calculateArrayDiff(arr1, arr2) {
        const len = arr1.length, diffArr = [];
        for (let i = 0; i < len; i++) {
            if (BinarySearch.findIndexOf(arr2, arr1[i]) === -1) {
                diffArr.push(arr1[i]);
            }
        }
        return diffArr;
    }
}
//# sourceMappingURL=ViewabilityTracker.js.map