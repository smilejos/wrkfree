var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * stores
 */
var InfoCardStore = require('../stores/InfoCardStore');
var HeaderStore = require('../stores/HeaderStore');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var IconButton = Mui.IconButton;

/**
 * actions
 */
var SendChannelReq = require('../../client/actions/channel/sendChannelReq');
var SendFriendReq = require('../../client/actions/friend/sendFriendReq');
var CheckChannelReq = require('../../client/actions/channel/checkChannelReq');
var CheckFriendReq = require('../../client/actions/friend/checkFriendReq');
var OpenHangout = require('../../client/actions/openHangout');
var ToggleQuickSearch = require('../../client/actions/search/toggleQuickSearch');
var EnterWorkspace = require('../../client/actions/enterWorkspace');


/**
 * @Author: George_Chen
 * @Description: the searchResult component
 *         NOTE: the type should only be "users" or "channels"
 *         
 * @param {Array}       props.itemList, the search result items
 * @param {String}      props.type, the type of search results
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],
    statics: {
        storeListeners: {
            '_onStoreChange': [InfoCardStore],
        }
    },

    _onStoreChange: function() {
        var searchKey = this.props.searchKey;
        var state = this.getStore(InfoCardStore).getCardState(searchKey)
        this.setState(state);
    },

    _setActionButton: function() {
        var isUser = (this.state.type === 'user');
        var isKnown = this.state.isKnown;
        if (isUser) {
            return (isKnown ? this._setOpenChatBox() : this._setFriendReq());
        }
        return (isKnown ? this._setEnterWorkspace() : this._setChannelReq());
    },

    /**
     * @Author: George_Chen
     * @Description: button info for sending channel requst
     */
    _setChannelReq: function() {
        var self = this;
        var isReqSent = this.state.isReqSent;
        function sendChannelReq() {
            self.executeAction(SendChannelReq, {
                targetUser: self.state.targetUid,
                channelId: self.state.channelId
            });
        }
        return (
            <IconButton 
                disabled={isReqSent}
                onTouchTap={sendChannelReq}
                tooltipPosition="top-center"
                tooltip="send channel request"
                iconClassName="material-icons"
                iconStyle={{color: isReqSent ? Colors.red200 : Colors.red500}}>
                {'group_add'}
            </IconButton>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: button info for sending friend requst
     */
    _setFriendReq: function() {
        var self = this;
        var isReqSent = this.state.isReqSent;
        function sendFriendReq() {
            self.executeAction(SendFriendReq, {
                targetUser: self.state.targetUid
            });
        }
        return (
            <IconButton 
                disabled={isReqSent}
                onTouchTap={sendFriendReq}
                iconClassName="material-icons"
                iconStyle={{color: isReqSent ? Colors.red200 : Colors.red500}}>
                {'person_add'}
            </IconButton>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: button info for enter Workspace
     */
    _setEnterWorkspace: function() {
        var self = this;
        var cid = this.state.channelId;
        function enterWorkspace() {
            var context = window.context;
            return context.executeAction(EnterWorkspace, {
                urlNavigator: self.transitionTo,
                channelId: cid
            });
        }
        return (
            <IconButton 
                onTouchTap={enterWorkspace}
                tooltipPosition="top-center"
                tooltip="enter workspace"
                iconClassName="material-icons"
                iconStyle={{color: Colors.lightBlue600}}>
                {'input'}
            </IconButton>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: button info for open chatBox
     */
    _setOpenChatBox: function() {
        var self = this;
        function openChatBox() {
            var context = window.context;
            var selfUid = self.getStore(HeaderStore).getSelfInfo().uid;
            context.executeAction(OpenHangout, {
                channelId: SharedUtils.get1on1ChannelId(self.state.targetUid, selfUid),
                hangoutTitle: self.state.nickName,
                isforcedToOpen: false
            });
        }
        return (
            <IconButton 
                onTouchTap={openChatBox}
                tooltipPosition="top-center"
                tooltip="open chatBox"
                iconClassName="material-icons"
                iconStyle={{color: Colors.lightBlue600}}>
                {'chat'}
            </IconButton>
        );
    },

    getInitialState: function() {
        var searchKey = this.props.searchKey;
        return this.getStore(InfoCardStore).getCardState(searchKey)
    },

    /**
     * check the button state should be disabled or not based on
     * the request has been sent or not
     */
    componentDidMount: function(){
        if (this.state.isKnown) {
            return;
        }
        var reqData = {
            cardId: this.props.searchKey,
            targetUid: this.state.targetUid,
        };
        if (this.state.type === 'channel') {
            reqData.channelId = this.state.channelId;
            return this.executeAction(CheckChannelReq, reqData);
        }
        return this.executeAction(CheckFriendReq, reqData);
    },

    render: function(){
        return (
            <div>
                <ListItem 
                    style={{height: 65}}
                    primaryText={<div style={{fontSize: 13}}>{this.state.extraInfo}</div>}
                    secondaryText={<div style={{fontSize: 12}}>{'@'+this.state.nickName}</div>} 
                    leftAvatar={<Avatar src={this.state.avatar} />}
                    rightIconButton={this._setActionButton()}/>
                <ListDivider inset />
            </div>
        );
    }
});
