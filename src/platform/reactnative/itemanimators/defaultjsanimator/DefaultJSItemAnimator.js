import { Animated, Easing, Platform } from "react-native";
import { BaseItemAnimator } from "../../../../core/ItemAnimator";
const IS_WEB = Platform.OS === "web";
export class DefaultJSItemAnimator {
    constructor() {
        this.shouldAnimateOnce = true;
        this._hasAnimatedOnce = false;
        this._isTimerOn = false;
    }
    animateWillMount(atX, atY, itemIndex) {
    }
    animateDidMount(atX, atY, itemRef, itemIndex) {
    }
    animateWillUpdate(fromX, fromY, toX, toY, itemRef, itemIndex) {
        this._hasAnimatedOnce = true;
    }
    animateShift(fromX, fromY, toX, toY, itemRef, itemIndex) {
        if (fromX !== toX || fromY !== toY) {
            if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this._hasAnimatedOnce) {
                const viewRef = itemRef, animXY = new Animated.ValueXY({ x: fromX, y: fromY });
                animXY.addListener((value) => {
                    if (viewRef._isUnmountedForRecyclerListView) {
                        animXY.stopAnimation();
                        return;
                    }
                    viewRef.setNativeProps(this._getNativePropObject(value.x, value.y));
                });
                if (viewRef._lastAnimVal) {
                    viewRef._lastAnimVal.stopAnimation();
                }
                viewRef._lastAnimVal = animXY;
                Animated.timing(animXY, {
                    toValue: { x: toX, y: toY },
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: BaseItemAnimator.USE_NATIVE_DRIVER,
                }).start(() => {
                    viewRef._lastAnimVal = null;
                    this._hasAnimatedOnce = true;
                });
                return true;
            }
        }
        else if (!this._isTimerOn) {
            this._isTimerOn = true;
            if (!this._hasAnimatedOnce) {
                setTimeout(() => {
                    this._hasAnimatedOnce = true;
                }, 1000);
            }
        }
        return false;
    }
    animateWillUnmount(atX, atY, itemRef, itemIndex) {
        itemRef._isUnmountedForRecyclerListView = true;
    }
    _getNativePropObject(x, y) {
        const point = { left: x, top: y };
        return !IS_WEB ? point : { style: point };
    }
}
//# sourceMappingURL=DefaultJSItemAnimator.js.map