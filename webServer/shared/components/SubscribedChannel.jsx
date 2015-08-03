var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var SetConferenceEvent = require('../../client/actions/rtc/setConferenceEvent');
var StartConference = require('../../client/actions/rtc/startConference');
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

    componentWillReceiveProps: function(nextProps) {
        var self = this;
        if (nextProps.hasConferenceCall !== this.props.hasConferenceCall) {
            self.executeAction(SetConferenceEvent, {
                channelId: self.props.channelId,
                isShown: nextProps.hasConferenceCall,
                title: 'Conference Call',
                message: 'Received from ['+ this.props.name + ']',
                callHandler: function() {
                    self.executeAction(EnterWorkspace, {
                        urlNavigator: self.transitionTo,
                        channelId: self.props.channelId
                    });
                    setTimeout(function(){
                        self.executeAction(StartConference, {
                            channelId: self.props.channelId
                        });
                    }, 1000);
                }
            });
        }
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
                    {this.props.hasConferenceCall ? <div className="Conference fa fa-users" /> : ''}
                    {this.props.unreadMsgNumbers > 0 ? <div className="Counter">{this.props.unreadMsgNumbers}</div> : '' }
                </div>
            </div>
        );
    } 
});
