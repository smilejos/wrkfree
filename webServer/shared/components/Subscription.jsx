var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');
var SubscriptionStore = require('../stores/SubscriptionStore');
var HeaderStore = require('../stores/HeaderStore');

/**
 * actions
 */
var CreateChannel = require('../../client/actions/channel/createChannel');
var GetUnreadSubscribedMsgCounts = require('../../client/actions/chat/getUnreadSubscribedMsgCounts.js');
var SetUnreadDiscussions = require('../../client/actions/setUnreadDiscussions.js');
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var NavToBoard = require('../../client/actions/draw/navToBoard');

/**
 * child components
 */
var SubscribedChannel = require('./SubscribedChannel.jsx');

/**
 * @Author: George_Chen
 * @Description: container component of application header
 *
 * @param {Array}         this.state.navInfo, an array of channel navigation info,
 * @param {String}        navInfo[i].channelId, target's channel id,
 * @param {String}        navInfo[i].channelName, target's channel name (without host uid)
 * @param {String}        navInfo[i].hostName, target channel's hostname
 * @param {Boolean}       this.state.isActived, indicate that channel nav should open or close
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, Router.State, FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [SubscriptionStore]
        }
    },

    /**
     * handler for channelNavStore change
     */
    onStoreChange: function() {
        var state = this.getStore(SubscriptionStore).getState();
        this.setState(state);
    },

    /**
     * @Author: Jos Tung
     * @Description: handler for Subscription of channels 
     */
    _getChannelList: function(){
        var subscriptions = this.state.subscriptions;
        var channelList = SharedUtils.fastArrayMap(subscriptions, function(item){
            return (
                <SubscribedChannel 
                    key={item.channelId}
                    channelId={item.channelId}
                    name={item.name}
                    hostInfo={item.hostInfo}
                    unreadMsgNumbers={item.unreadMsgNumbers}
                    hasConferenceCall={item.hasConferenceCall} />
            );
        });
        return (
            <div className="ChannelList">
                {channelList}
            </div>
        );
    },

    getInitialState: function() {
        return this.getStore(SubscriptionStore).getState();
    },

    /**
     * @Author: George_Chen
     * @Description: update the header unread discussion msgs after subscription updated
     */
    componentDidUpdate: function() {
        var totalCounts = 0;
        SharedUtils.fastArrayMap(this.state.subscriptions, function(item){
            totalCounts += item.unreadMsgNumbers;
            // count conference state
            if (item.hasConferenceCall) {
                totalCounts += 1;
            }
        });
        this.executeAction(SetUnreadDiscussions, {
            counts: totalCounts
        });
    },

    componentDidMount: function() {
        var cids = SharedUtils.fastArrayMap(this.state.subscriptions, function(info){
            return info.channelId;
        });
        if (cids.length > 0) {
            this.executeAction(GetUnreadSubscribedMsgCounts);
        }
    },

    render: function() {
        var ChannelList = this._getChannelList();
        var style = "SubscriptionChannels" + ( this.state.isActive ? " SubscriptionChannelsShow" : " SubscriptionChannelsHide" );
        return (
            <div className={style}>
                {ChannelList}
            </div>
        );
    }
});
