var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

var FriendStore = require('../../stores/FriendStore');
var ToggleStore = require('../../stores/ToggleStore');
var HeaderStore = require('../../stores/HeaderStore');

/**
 * child components
 */
var Friend = require('../common/friend.jsx');

/**
 * actions
 */
var GetLastMessages = require('../../../client/actions/chat/getLastMessages');
var SetUnreadConverations = require('../../../client/actions/setUnreadConverations');
var SubscribeChannelNotification = require('../../../client/actions/channel/subscribeChannelNotification');
var TrackFriendActivity = require('../../../client/actions/friend/trackFriendActivity');

/**
 * @Author: George_Chen
 * @Description: An sub-container component to handle friend list
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [FriendStore],
            '_onVisiableChange': [ToggleStore]
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler for handling display or not
     */
    _onVisiableChange: function(){
        var store = this.getStore(ToggleStore).getState();
        if (this.state.isVisible !== store.friendVisiable) {
            this.setState({
                isVisible : store.friendVisiable 
            }); 
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler for showing last conversation time
     */
    _showTime: function(isShown) {
        this.setState({
            isTimeVisible: isShown
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for handling the change of FriendStore
     */
    _onStoreChange: function(){
        var store = this.getStore(FriendStore).getState();
        this.setState({
            friends : store.friends
        });
    },

    getInitialState: function() {
        return {
            isVisible : this.getStore(ToggleStore).getState().friendVisiable,
            friends : this.getStore(FriendStore).getState().friends,
            selfUid: this.getStore(HeaderStore).getSelfInfo().uid,
            isTimeVisible: false,
        };
    },

    /**
     * @Author: George_Chen
     * @Description: count the unread conversation when friend list updated
     */
    componentDidUpdate: function() {
        return Promise.reduce(this.state.friends, function(total, friendItem){
            return (friendItem.isMessageReaded ? total : total + 1);
        }, 0).bind(this).then(function(totalUnreads){
            this.executeAction(SetUnreadConverations, {
                counts: totalUnreads
            });
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to get last conversation messages when friendList mounted
     */
    componentDidMount: function() {
        var selfUid = this.state.selfUid;
        return Promise.map(this.state.friends, function(info){
            return info.uid;
        }).bind(this).then(function(uids){
            this.executeAction(TrackFriendActivity, {
                friendUids: uids
            });
            return uids;
        }).map(function(uid){
            return SharedUtils.get1on1ChannelId(selfUid, uid);
        }).then(function(cids){
            if (cids.length > 0) {
                this.executeAction(GetLastMessages, {
                    channels: cids
                });
                this.executeAction(SubscribeChannelNotification, {
                    channels: cids
                });
            }
        });
    },
    
    render: function(){
        var friends = this.state.friends;
        var selfUid = this.state.selfUid;
        var isTimeVisible = this.state.isTimeVisible;
        var friendList = SharedUtils.fastArrayMap(friends, function(friendInfo){
            return <Friend 
                key={friendInfo.uid}
                self={selfUid}
                timeVisible={isTimeVisible}
                info={friendInfo} />
        });
        return (
            <div className={this.state.isVisible ? 'FriendsShow' : 'Friends'}
                onMouseOver={this._showTime.bind(this, true)} 
                onMouseOut={this._showTime.bind(this, false)} >
                {friendList}
            </div>
        );
    }
});
