var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var EnterWorkspace = require('../../client/actions/enterWorkspace');
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var SubscribeChannelNotification = require('../../client/actions/channel/subscribeChannelNotification');


module.exports = React.createClass({
    mixins: [Router.Navigation, Router.State, FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: used to enter the workspace of current channel
     */
    _enterWorkspace: function() {
        this.executeAction(ToggleChannelNav, {});
        this.executeAction(EnterWorkspace, {
            urlNavigator: this.transitionTo,
            channelId: this.props.channelId
        });
    },

    componentDidMount: function() {
        this.executeAction(SubscribeChannelNotification, {
            channelId: this.props.channelId
        });
    },

    componentWillUnmount: function() {
        // TODO: when user stop starred channel, the item will be umounted, 
        //       then we should unsubscribe it !
    },

    render: function() {
        return (
            <div className="Channel" 
                onClick={this._enterWorkspace}>
                <div className="ChannelText">
                    <div className="ChannelName">
                        {this.props.name}    
                    </div>
                    <div className="ChannelHost">
                        {'@' + this.props.hostInfo.nickName}
                    </div>
                </div>
                <div className="Signal">
                    {this.props.isConferenceExist ? <div className="Conference fa fa-users" /> : ''}
                    {this.props.unreadMsgNumbers > 0 ? <div className="Counter">{this.props.unreadMsgNumbers}</div> : '' }
                </div>
            </div>
        );
    } 
});
