import { LayoutAnimation, Platform, UIManager } from "react-native";
export class DefaultNativeItemAnimator {
    constructor() {
        this.shouldAnimateOnce = true;
        this._hasAnimatedOnce = false;
        this._isTimerOn = false;
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
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
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                this._hasAnimatedOnce = true;
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
    }
}
//# sourceMappingURL=DefaultNativeItemAnimator.js.map