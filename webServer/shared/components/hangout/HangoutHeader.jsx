var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var Router = require('react-router');

/**
 * stores
 */
var WorkSpaceStore = require('../../stores/WorkSpaceStore');

var EnterWorkspace = require('../../../client/actions/enterWorkspace');
var CloseHangout = require('../../../client/actions/closeHangout');
var OpenHangout = require('../../../client/actions/openHangout');
var ResizeHangout = require('../../../client/actions/resizeHangout');

var Tooltip = require('material-ui').Tooltip;

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
     * @Description: switch current hangout sapce to workspace
     */
    _switchWorkSpace: function() {
        var context = window.context;
        var wkState = this.getStore(WorkSpaceStore).getState();
        var wkChannel = wkState.channel;
        return Promise.try(function(){
            if (wkChannel.channelId) {
                return context.executeAction(OpenHangout, {
                    channelId: wkChannel.channelId,
                    hangoutTitle: wkChannel.name,
                    isforcedToOpen: true
                });
            }
        }).bind(this).then(function(){
            context.executeAction(EnterWorkspace, {
                urlNavigator: this.transitionTo,
                channelId: this.props.channelId
            });
        });
    },

    render: function() {
        var isCompressed = this.props.isCompressed;
        return (
            <div className="hangoutHeader">
                <div className="hangoutHeaderTitle">
                    {this.props.title}
                </div>
                <div className="hangoutHeaderControls">
                    <HangoutTool
                        containerClass="controlIcon material-icons"
                        iconName={isCompressed ? 'expand_less' : 'expand_more'}
                        tips={isCompressed ? 'expand window' : 'compress window'}
                        containerStyle={{fontSize: 22}}
                        clickHandler={isCompressed ? this._expand : this._compress} />
                    <HangoutTool
                        containerClass="controlIcon material-icons"
                        iconName="shuffle"
                        tips="swith to workspace"
                        containerStyle={{fontSize: 20}}
                        clickHandler={this._switchWorkSpace} />
                    <HangoutTool
                        iconName="close"
                        containerClass="controlIcon material-icons"
                        tips="close window"
                        containerStyle={{fontSize: 20}}
                        clickHandler={this._close} />
                </div>
            </div>
        );
    }
});

var HangoutTool = React.createClass({
    getInitialState: function() {
        return {
            isShown: false
        };
    },

    _onTipsShown: function(shownState) {
        if (this.props.tips) {
            this.setState({
                isShown: shownState
            });
        }
    },

    _onClick: function() {
        if (this.props.clickHandler) {
            this.props.clickHandler();
        }
    },

    render: function() {
        var containerClass = this.props.containerClass || '';
        var containerStyle = this.props.containerStyle || {};
        return (
            <div className={containerClass} 
                style={containerStyle}
                onClick={this._onClick}
                onMouseEnter={this._onTipsShown.bind(this, true)}
                onMouseLeave={this._onTipsShown.bind(this, false)}>
                {this.props.iconName}
                <Tooltip 
                    show={this.state.isShown}
                    verticalPosition="top" 
                    horizontalPosition="right" 
                    label={this.props.tips} />
            </div>
        );
    }
});
