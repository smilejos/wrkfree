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
var FontIcon = Mui.FontIcon;
var FlatButton = Mui.FlatButton;

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
        if (!this.props.isList) {
            return this._setGridButton({
                label: 'Add Channel',
                handler: sendChannelReq,
                hoverColor: Colors.red50,
                color: (isReqSent ? Colors.red200 : Colors.red500),
                iconName: 'group_add',
                isDisabled: isReqSent
            });
        }
        return (
            <IconButton 
                disabled={isReqSent}
                onTouchTap={sendChannelReq}
                tooltipPosition="top-left"
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
        if (!this.props.isList) {
            return this._setGridButton({
                label: 'Add Friend',
                handler: sendFriendReq,
                hoverColor: Colors.red50,
                color: (isReqSent ? Colors.red200 : Colors.red500),
                iconName: 'person_add',
                isDisabled: isReqSent
            });
        }
        return (
            <IconButton 
                disabled={isReqSent}
                onTouchTap={sendFriendReq}
                tooltipPosition="top-left"
                tooltip="send friend request"
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
        if (!this.props.isList) {
            return this._setGridButton({
                label: 'workspace',
                handler: enterWorkspace,
                hoverColor: Colors.lightBlue50,
                color: Colors.lightBlue600,
                iconName: 'input'
            });
        }
        return (
            <IconButton 
                onTouchTap={enterWorkspace}
                tooltipPosition="top-left"
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
        if (!this.props.isList) {
            return this._setGridButton({
                label: 'chatBox',
                handler: openChatBox,
                hoverColor: Colors.lightBlue50,
                color: Colors.lightBlue600,
                iconName: 'chat'
            });
        }
        return (
            <IconButton 
                onTouchTap={openChatBox}
                tooltipPosition="top-left"
                tooltip="open chatBox"
                iconClassName="material-icons"
                iconStyle={{color: Colors.lightBlue600}}>
                {'chat'}
            </IconButton>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: used for generating notice action button
     * 
     * @param {Object}      btnInfo, the notice action button info
     */
    _setGridButton: function(btnInfo) {
        var fontIconStyle = {
            display: 'inline-block',
            verticalAlign: 'middle',
            float: 'left',
            paddingLeft: 10,
            lineHeight: '36px',
            width: 15,
            fontSize: 13
        };
        var btnStyle = {
            fontSize: 12,
            color: btnInfo.color
        };
        return (
            <FlatButton onTouchTap={btnInfo.handler} disabled={btnInfo.isDisabled}
                style={btnStyle} hoverColor={btnInfo.hoverColor}  label={btnInfo.label}>
                <FontIcon className="material-icons" style={fontIconStyle} color={btnInfo.color} >
                    {btnInfo.iconName}
                </FontIcon>
            </FlatButton>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: set search list result layout
     */
    _setListLayout: function() {
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
    },
    /**
     * @Author: George_Chen
     * @Description: set search grid result layout
     */
    _setGridLayout: function() {
        var containerStyle = {
            display: 'inline-block',
            width: this.props.gridWidth,
            height: 250,
            padding: '10px 10px 10px 10px'
        };
        var itemStyle = {
            border: 'solid 1px',
            width: 150,
            height: 230,
            color: Colors.grey300,
            textAlign: 'center'
        };
        return (
            <div style={containerStyle}>
                <div style={itemStyle}>
                    <img src={this._getGridImg()} width="148" height="148"/>
                    <div style={{fontSize: 12, color: Colors.grey400, fontWeight: 300}}>{'@'+this.state.nickName}</div>
                    <div style={{fontSize: 13, color: '#000', fontWeight: 400, height: 30}}>{this.state.extraInfo}</div>
                    {this._setActionButton()}
                </div>
            </div>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: set and get the cover image of info card
     */
    _getGridImg: function() {
        var url = this.state.avatar;
        if (url.search('facebook') !== -1) {
            return (url + '?width=150&height=150');
        }
        return url.replace(/sz=50/, 'sz=150');
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
        var isList = this.props.isList;
        return ( isList ? this._setListLayout() : this._setGridLayout() );
    }
});
