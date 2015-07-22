var React = require('react');
var Promise = require('bluebird');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

var FriendStore = require('../../stores/FriendStore');
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

/**
 * @Author: George_Chen
 * @Description: An sub-container component to handle friend list
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [FriendStore]
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
            friends : store.friends,
            isActive : this.state.isActive !== store.isActive ? store.isActive : this.state.isActive
        });
    },

    getInitialState: function() {
        return {
            isActive : this.getStore(FriendStore).getState().isActive,
            friends : this.getStore(FriendStore).getState().friends,
            selfUid: this.getStore(HeaderStore).getSelfInfo().uid,
            isTimeVisible: false,
        };
    },

    /**
     * @Author: George_Chen
     * @Description: count the unread conversation when friend list updated
     */
    componentDidUpdate: function(prevProps, prevState) {
        // this ensure the update unreadConversations is not triggered by timeVisible
        if (prevState.isTimeVisible === this.state.isTimeVisible) {
            return Promise.reduce(this.state.friends, function(total, friendItem){
                return (friendItem.isMessageReaded ? total : total + 1);
            }, 0).bind(this).then(function(totalUnreads){
                this.executeAction(SetUnreadConverations, {
                    counts: totalUnreads
                });
            });
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to get last conversation messages when friendList mounted
     */
    componentDidMount: function() {
        var selfUid = this.state.selfUid;
        var cids = SharedUtils.fastArrayMap(this.state.friends, function(info){
            return SharedUtils.get1on1ChannelId(selfUid, info.uid);
        });
        if (cids.length > 0) {
            this.executeAction(GetLastMessages, {
                channels: cids
            });
        }
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
            <div className={this.state.isActive ? 'FriendsShow' : 'Friends'}
                onMouseEnter={this._showTime.bind(this, true)} 
                onMouseLeave={this._showTime.bind(this, false)} >
                {friendList}
            </div>
        );
    }
});
