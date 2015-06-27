var React = require('react');
var Router = require('react-router');
var Mui = require('material-ui');
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

/**
 * child components
 */
var ToggleChannelNav = require('../../client/actions/toggleChannelNav');
var NavToBoard = require('../../client/actions/draw/navToBoard');

/**
 * material UI compoents
 */
var Paper = Mui.Paper;
var LeftNav = Mui.LeftNav;
var TextField = Mui.TextField;
var FlatButton = Mui.FlatButton;

/**
 * @Author: George_Chen
 * @Description: container component of application header
 *
 * @param {Array}         this.state.navInfo, an array of channel navigation info,
 * @param {String}        navInfo[i].channelId, target's channel id,
 * @param {String}        navInfo[i].channelName, target's channel name (without host uid)
 * @param {String}        navInfo[i].hostName, target channel's hostname
 * @param {Boolean}       this.state.isNameValid, to check creating channel name is valid or not
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
        if (state.createdChannel !== -1) {
            return this._checkCreatedChannel(state.createdChannel);
        }
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: used to check the result of create channel
     *
     * @param {Object}        createdChannel, the created channel
     */
    _checkCreatedChannel: function(createdChannel) {
        if (!createdChannel) {
            return;
            // TODO: create Channel fail
        }
        var toggleMode = {
            open: false
        };
        this.refs.channelName.clearValue();
        this.executeAction(ToggleChannelNav, toggleMode);
        this.executeAction(NavToBoard, {
            urlNavigator: this.transitionTo,
            channelId: createdChannel.channelId,
            boardId: 0
        });
    },

    _onChannelClick: function(route){
        this.executeAction(ToggleChannelNav, {});
        this.transitionTo(route);
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user create channel
     */
    _onCreateChannel: function() {
        this.executeAction(CreateChannel, {
            name: this.refs.channelName.getValue()
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for user to cancel channel create
     */
    _onCancelChannel: function() {
        this.refs.channelName.clearValue();
        this.executeAction(ToggleChannelNav, {
            open: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for checking channel name
     */
    _checkChannelName: function(e) {
        var self = this;
        setTimeout(function(){
            if (e.keyCode === 13) {
                self._onCreateChannel();
            }
            var name = self.refs.channelName.getValue();
            // TODO: we should trigger another actiion flow 
            self.setState({
                isNameValid: (name.length > 0)
            });
        }, 100);
    },

    /**
     * @Author: George_Chen
     * @Description: to generate header for channel navigation bar
     *     NOTE: currently we return a section for user creating channel
     */
    _getNavHeader: function() {
        var isNameValid = this.state.isNameValid;
        return (
            <div className="SubscriptionChannelsHeader">
                {'Create Cannel'}
                <div className="SubscriptionChannelsContent" >
                    <TextField 
                        hintText="channel name" 
                        ref={'channelName'}
                        onKeyDown={this._checkChannelName} />
                </div>
                <div >
                    <FlatButton disabled={!isNameValid} primary={isNameValid} onClick={this._onCreateChannel}>
                        {'create'}
                    </FlatButton>
                    <FlatButton disabled={!isNameValid} secondary={isNameValid} onClick={this._onCancelChannel}>
                        {'cancel'}
                    </FlatButton>
                </div>
            </div>
        );
    },

    /**
     * @Author: Jos Tung
     * @Description: handler for Subscription of channels 
     */
    _getChannelList: function(){
        var subscriptions = this.state.subscriptions;
        var route = '';
        var channelList = SharedUtils.fastArrayMap(subscriptions, function(item){
            route = '/app/workspace/'+item.channelId + '?board=1';
            return (
                <div className="Channel" 
                    key={item.channelId} 
                    onClick={this._onChannelClick.bind(this, route)}>
                    <div className="ChannelText">
                        <div className="ChannelName">
                            {item.name}    
                        </div>
                        <div className="ChannelHost">
                            {'@' + item.hostInfo.nickName}
                        </div>
                    </div>
                    <div className="Signal">
                        {item.isConferenceExist ? <div className="Conference fa fa-users" /> : ''}
                        {item.unreadMsgNumbers > 0 ? <div className="Counter">{item.unreadMsgNumbers}</div> : '' }
                    </div>
                </div>
            );
        }.bind(this));
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
        });
        this.executeAction(SetUnreadDiscussions, {
            counts: totalCounts
        });
    },

    componentDidMount: function() {
        this.executeAction(GetUnreadSubscribedMsgCounts);
    },

    render: function() {
        var Header = this._getNavHeader();
        var ChannelList = this._getChannelList();
        var style = "SubscriptionChannels" + ( this.state.isActived ? " SubscriptionChannelsShow" : " SubscriptionChannelsHide" );
        return (
            <div className={style}>
                {Header}
                {ChannelList}
            </div>
        );
    }
});
