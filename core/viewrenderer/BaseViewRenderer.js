import * as React from "react";
export default class BaseViewRenderer extends React.Component {
    shouldComponentUpdate(newProps) {
        const hasMoved = this.props.x !== newProps.x || this.props.y !== newProps.y, hasSizeChanged = !newProps.forceNonDeterministicRendering &&
            (this.props.width !== newProps.width || this.props.height !== newProps.height) ||
            this.props.layoutProvider !== newProps.layoutProvider, hasExtendedStateChanged = this.props.extendedState !== newProps.extendedState, hasDataChanged = (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data));
        let shouldUpdate = hasSizeChanged || hasDataChanged || hasExtendedStateChanged;
        if (shouldUpdate) {
            newProps.itemAnimator.animateWillUpdate(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef(), newProps.index);
        }
        else if (hasMoved) {
            shouldUpdate = !newProps.itemAnimator.animateShift(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef(), newProps.index);
        }
        return shouldUpdate;
    }
    componentDidMount() {
        this.props.itemAnimator.animateDidMount(this.props.x, this.props.y, this.getRef(), this.props.index);
    }
    componentWillMount() {
        this.props.itemAnimator.animateWillMount(this.props.x, this.props.y, this.props.index);
    }
    componentWillUnmount() {
        this.props.itemAnimator.animateWillUnmount(this.props.x, this.props.y, this.getRef(), this.props.index);
    }
    renderChild() {
        return this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index, this.props.extendedState);
    }
}
//# sourceMappingURL=BaseViewRenderer.js.map