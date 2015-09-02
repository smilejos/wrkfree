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
     * @Description: handler for showing extra-information
     */
    _showInfo: function(isShown) {
        this.setState({
            isInfoVisible: isShown
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
            isInfoVisible: false,
            listHeight: 0
        };
    },

    /**
     * @Author: George_Chen
     * @Description: count the unread conversation when friend list updated
     */
    componentDidUpdate: function(prevProps, prevState) {
        // this ensure the update unreadConversations is not triggered by timeVisible
        if (prevState.isInfoVisible === this.state.isInfoVisible) {
            return Promise.reduce(this.state.friends, function(total, friendItem){
                return (!friendItem.isMessageReaded || friendItem.hasIncomingCall ? total + 1 : total);
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
        var self = this;
        var selfUid = this.state.selfUid;
        var cids = SharedUtils.fastArrayMap(this.state.friends, function(info){
            return SharedUtils.get1on1ChannelId(selfUid, info.uid);
        });
        if (cids.length > 0) {
            this.executeAction(GetLastMessages, {
                channels: cids
            });
        }
        this._resizeHeight();
        window.addEventListener('resize', function(e) {
            clearTimeout(ResizeTimeout);
            ResizeTimeout = setTimeout(function() {
                self._resizeHeight();
            }, 100);
        });
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
    
    render: function(){
        var friends = this.state.friends;
        var selfUid = this.state.selfUid;
        var isInfoVisible = this.state.isInfoVisible;
        var friendList = SharedUtils.fastArrayMap(friends, function(friendInfo){
            return <Friend 
                key={friendInfo.uid}
                self={selfUid}
                timeVisible={isInfoVisible}
                hasIncomingCall={friendInfo.hasIncomingCall}
                info={friendInfo} />
        });
        var listContainerStyle = {
            overflow: this.state.isInfoVisible ? 'auto' : 'hidden',
        };
        if (this.state.listHeight > 0) {
            listContainerStyle.height = this.state.listHeight;
        }
        return (
            <div className={this.state.isActive ? 'FriendsShow' : 'Friends'} >
                <List style={{marginTop: 1}}>
                    <ListItem disabled primaryText="Friends"
                        leftIcon={<FontIcon color={'#27A'} className="material-icons">{'people'}</FontIcon>} />
                </List>
                <ListDivider />
                <List ref="friendList"
                    onMouseEnter={this._showInfo.bind(this, true)} 
                    onMouseLeave={this._showInfo.bind(this, false)} 
                    style={listContainerStyle}>
                    {friendList}
                </List>
            </div>
        );
    }
});
