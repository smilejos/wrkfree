var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');
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
 * material-ui components
 */
var Mui = require('material-ui');
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var Colors = Mui.Styles.Colors;

var ResizeTimeout = null;

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
            '_onStoreChange': [SubscriptionStore]
        }
    },

    getInitialState: function() {
        var state = this.getStore(SubscriptionStore).getState();
        state.isScrollShown = false;
        state.listHeight = 0;
        return state;
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
        var self = this;
        var cids = SharedUtils.fastArrayMap(this.state.subscriptions, function(info){
            return info.channelId;
        });
        if (cids.length > 0) {
            this.executeAction(GetUnreadSubscribedMsgCounts);
        }
        this._resizeHeight();
        window.addEventListener('resize', function(e) {
            if (ResizeTimeout) {
                clearTimeout(ResizeTimeout);
            }
            ResizeTimeout = setTimeout(function() {
                self._resizeHeight();
            }, 100);
        });
    },

    /**
     * handler for SubscriptionStore change
     */
    _onStoreChange: function() {
        var state = this.getStore(SubscriptionStore).getState();
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: resize current list height when window height change
     */
    _resizeHeight: function() {
        this.setState({
            listHeight: window.innerHeight - 150
        });
    },    

    /**
     * @Author: George_Chen
     * @Description: used to handle scroll bar shown or not
     */
    _onScrollShown: function(showState) {
        this.setState({
            isScrollShown: showState
        });
    },

    render: function() {
        var subscriptions = this.state.subscriptions;
        var containerClass = "SubscriptionChannels" + ( this.state.isActive ? " SubscriptionChannelsShow" : " SubscriptionChannelsHide" );
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
        var listContainerStyle = {
            overflow: this.state.isScrollShown ? 'auto' : 'hidden',
        };
        if (this.state.listHeight > 0) {
            listContainerStyle.height = this.state.listHeight;
        }
        return (
            <div className={containerClass} 
                style={{marginTop: 1, borderRadius: 5, borderTopLeftRadius: 0, height: this.state.listHeight + 93}}>
                <List style={{marginTop: 1}}>
                    <ListItem disabled primaryText="Favorites"
                        leftIcon={<FontIcon color={Colors.yellow700} className="material-icons">{'star'}</FontIcon>} />
                </List>
                <ListDivider />
                <List ref="favoritesList"
                    onMouseEnter={this._onScrollShown.bind(this, true)}
                    onMouseLeave={this._onScrollShown.bind(this, false)} 
                    style={listContainerStyle}>
                    {channelList}
                </List>
            </div>
        );
    }
});
