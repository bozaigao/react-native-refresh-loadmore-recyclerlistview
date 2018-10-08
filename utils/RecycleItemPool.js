export default class RecycleItemPool {
    constructor() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }
    putRecycledObject(objectType, object) {
        let objectTypeTmp = this._stringify(objectType);
        const objectSet = this._getRelevantSet(objectTypeTmp);
        if (!this._availabilitySet[object]) {
            objectSet[object] = null;
            this._availabilitySet[object] = objectTypeTmp;
        }
    }
    getRecycledObject(objectType) {
        let objectTypeTmp = this._stringify(objectType);
        const objectSet = this._getRelevantSet(objectTypeTmp);
        let recycledObject = null;
        for (const property in objectSet) {
            if (objectSet.hasOwnProperty(property)) {
                recycledObject = property;
                break;
            }
        }
        if (recycledObject) {
            delete objectSet[recycledObject];
            delete this._availabilitySet[recycledObject];
        }
        return recycledObject;
    }
    removeFromPool(object) {
        if (this._availabilitySet[object]) {
            delete this._getRelevantSet(this._availabilitySet[object])[object];
            delete this._availabilitySet[object];
            return true;
        }
        return false;
    }
    clearAll() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }
    _getRelevantSet(objectType) {
        let objectSet = this._recyclableObjectMap[objectType];
        if (!objectSet) {
            objectSet = {};
            this._recyclableObjectMap[objectType] = objectSet;
        }
        return objectSet;
    }
    _stringify(objectType) {
        let objectTypeTmp = '';
        if (typeof objectType === "number") {
            objectTypeTmp = objectType.toString();
        }
        return objectTypeTmp;
    }
}
//# sourceMappingURL=RecycleItemPool.js.map