let ScrollableMixin = {
    getInnerViewNode() {
        return this.getScrollResponder().getInnerViewNode();
    },
    scrollTo(destY, destX) {
        this.getScrollResponder().scrollTo(destY, destX);
    },
    scrollWithoutAnimationTo(destY, destX) {
        this.getScrollResponder().scrollWithoutAnimationTo(destY, destX);
    },
};
export default ScrollableMixin;
//# sourceMappingURL=ScrollableMixin.js.map