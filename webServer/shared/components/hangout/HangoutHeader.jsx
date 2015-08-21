var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var Router = require('react-router');

var EnterWorkspace = require('../../../client/actions/enterWorkspace');
var CloseHangout = require('../../../client/actions/closeHangout');
var ResizeHangout = require('../../../client/actions/resizeHangout');

/**
 * Public API
 * @Author: George_Chen
 * @Description: hangout header area component
 *         
 * @param {String}      this.props.channelId, the channel id
 * @param {String}      this.props.title, the hangout header title
 * @param {Boolean}     this.props.isCompressed, indicate hangout window size state
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],

    /**
     * @Author: George_Chen
     * @Description: handler for compress current hangout window
     */
    _compress: function() {
        this.executeAction(ResizeHangout, {
            channelId: this.props.channelId,
            isCompressed: true
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for expand current hangout window
     */
    _expand: function() {
        this.executeAction(ResizeHangout, {
            channelId: this.props.channelId,
            isCompressed: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for close current hangout window
     */
    _close: function() {
        this.executeAction(CloseHangout, {
            channelId: this.props.channelId,
            isStayed: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for setting resize icon
     */
    _setResizeIcon: function() {
        var isCompressed = this.props.isCompressed;
        var iconClass = (isCompressed ? 'controlIcon fa fa-expand' : 'controlIcon fa fa-minus');
        var iconHandler = (isCompressed ? this._expand : this._compress);
        return <span className={iconClass} onClick={iconHandler} />
    },

    /**
     * @Author: George_Chen
     * @Description: switch current hangout sapce to workspace
     */
    _switchWorkSpace: function() {
        this.executeAction(EnterWorkspace, {
            urlNavigator: this.transitionTo,
            channelId: this.props.channelId
        });
    },

    render: function() {
        // because the fontawesome close icon size looks smaller, so we adjust here
        var closeIconStyle = {
            'fontSize': 20
        };
        return (
            <div className="hangoutHeader">
                <div className="hangoutHeaderTitle">
                    {this.props.title}
                </div>
                <div className="hangoutHeaderControls">
                    {this._setResizeIcon()}
                    <span className="controlIcon fa fa-random"
                        onClick={this._switchWorkSpace} />
                    <span className="controlIcon fa fa-times"
                        style={closeIconStyle}
                        onClick={this._close} />
                </div>
            </div>
        );
    }
});
