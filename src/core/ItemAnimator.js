export class BaseItemAnimator {
    animateWillMount(atX, atY, itemIndex) {
    }
    animateDidMount(atX, atY, itemRef, itemIndex) {
    }
    animateWillUpdate(fromX, fromY, toX, toY, itemRef, itemIndex) {
    }
    animateShift(fromX, fromY, toX, toY, itemRef, itemIndex) {
        return false;
    }
    animateWillUnmount(atX, atY, itemRef, itemIndex) {
    }
}
BaseItemAnimator.USE_NATIVE_DRIVER = true;
//# sourceMappingURL=ItemAnimator.js.map