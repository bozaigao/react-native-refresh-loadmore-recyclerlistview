export default class DataProvider {
    constructor(rowHasChanged) {
        this._firstIndexToProcess = 0;
        this._size = 0;
        this._data = [];
        this.rowHasChanged = rowHasChanged;
    }
    getDataForIndex(index) {
        return this._data[index];
    }
    getAllData() {
        return this._data;
    }
    getSize() {
        return this._size;
    }
    getFirstIndexToProcessInternal() {
        return this._firstIndexToProcess;
    }
    cloneWithRows(newData) {
        const dp = new DataProvider(this.rowHasChanged), newSize = newData.length, iterCount = Math.min(this._size, newSize);
        let i = 0;
        for (i = 0; i < iterCount; i++) {
            if (this.rowHasChanged(this._data[i], newData[i])) {
                break;
            }
        }
        dp._firstIndexToProcess = i;
        dp._data = newData;
        dp._size = newSize;
        return dp;
    }
}
//# sourceMappingURL=DataProvider.js.map