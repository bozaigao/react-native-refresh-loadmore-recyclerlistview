export default class LayoutProvider {
    constructor(getLayoutTypeForIndex, setLayoutForType) {
        this._getLayoutTypeForIndex = getLayoutTypeForIndex;
        this._setLayoutForType = setLayoutForType;
    }
    getLayoutTypeForIndex(index) {
        return this._getLayoutTypeForIndex(index);
    }
    setLayoutForType(type, dimension, index) {
        return this._setLayoutForType(type, dimension, index);
    }
}
//# sourceMappingURL=LayoutProvider.js.map