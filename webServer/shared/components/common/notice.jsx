var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material-ui components
 */
var Mui = require('material-ui');
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var FlatButton = Mui.FlatButton;

/**
 * actions
 */
var ReplyChannelReq = require('../../../client/actions/channel/replyChannelReq');
var ReplyFriendReq = require('../../../client/actions/friend/replyFriendReq');
var EnterWorkspace = require('../../../client/actions/enterWorkspace');
var OpenHangout = require('../../../client/actions/openHangout');
var SetNotificationReaded = require('../../../client/actions/setNotificationReaded');

/**
 * stores
 */
var HeaderStore = require('../../stores/HeaderStore');

/**
 * components
 */
var NoticeTime = require('./notificationTime.jsx');
var CustomizedString = require('./customizedString.jsx');

/**
 * @Author: George_Chen
 * @Description: the main notice component
 *
 * NOTE: common props
 * @param {Object}      this.props.info.isReq, indicate is request or not
 * @param {Object}      this.props.info.reqId, the notice reqId
 * @param {Object}      this.props.info.reqType, the notice type (channel/friend)
 * @param {Object}      this.props.info.updatedTime, the notice updatedTime
 * @param {Object}      this.props.info.sender, the info of sender (uid, nickName, avatar)
 *
 * NOTE: channel related request/response props
 * @param {Object}      this.props.info.extraInfo.channelId, the channel id
 * @param {Object}      this.props.info.extraInfo.name, the channel name
 *
 * NOTE: the response notice related props
 * @param {Object}      this.props.info.respToPermitted, the response answer
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],

    getInitialState: function() {
        return {
           isTimeVisible : true 
        };
    },

    /**
     * @Author: George_Chen
     * @Description: handler for hiding timestamp
     */
    _hideTimestamp: function() {
        this.setState({
            isTimeVisible: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for show timestamp
     */
    _showTimestamp: function() {
        this.setState({
            isTimeVisible: true
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for navigating to target workspace
     */
    _openWorkSpace: function() {
        var info = this.props.info;
        var cid = info.extraInfo.channelId;
        var selfUid = this.getStore(HeaderStore).getSelfInfo().uid;
        if (!cid) {
            cid = SharedUtils.get1on1ChannelId(info.sender.uid, selfUid);
        }
        this.executeAction(EnterWorkspace, {
            urlNavigator: this.transitionTo,
            channelId: cid
        });
    },
    
    /**
     * @Author: George_Chen
     * @Description: handler for opening hangout with target user
     */
    _openHangout: function() {
        var info = this.props.info;
        var cid = info.extraInfo.channelId;
        var selfUid = this.getStore(HeaderStore).getSelfInfo().uid;
        var title = info.extraInfo.name;
        if (!cid) {
            cid = SharedUtils.get1on1ChannelId(info.sender.uid, selfUid);
            title = info.sender.nickName;
        }
        this.executeAction(OpenHangout, {
            channelId: cid,
            hangoutTitle: title,
            isforcedToOpen: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to mark current notice to readed
     */
    _markReaded: function() {
        this.executeAction(SetNotificationReaded, {
            reqId: this.props.info.reqId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for replying channel/friend requests
     */
    _replyReq: function(toPermitted) {
        var data = {
            id: this.props.info.reqId,
            target: this.props.info.sender.uid,
            permit: toPermitted
        };
        if (this.props.info.type === 'channel') {
            data.channelId = this.props.info.extraInfo.channelId;
            this.executeAction(ReplyChannelReq, data);
        }
        if (this.props.info.type === 'friend') {
            this.executeAction(ReplyFriendReq, data);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: set the request notice content layout
     */
    _setReqContent: function() {
        var message = '';
        if (this.props.info.type === 'channel') {
            message = 'want to join your channel';
        } else if (this.props.info.type === 'friend') {
            message = 'want to be your friend';
        }
        var aceeptBtnInfo = {
            label: 'Accept',
            handler: this._replyReq.bind(this, true),
            hoverColor: Colors.green50,
            color: Colors.green500,
            iconName: 'check'
        };
        var rejectBtnInfo = {
            label: 'Reject',
            handler: this._replyReq.bind(this, false),
            hoverColor: Colors.red50,
            color: Colors.red500,
            iconName: 'close'
        };
        var actionButtons = (
            <div>
                {this._setActionButton(aceeptBtnInfo)}
                {this._setActionButton(rejectBtnInfo)}
            </div>
        );
        return this._setContent(message, actionButtons);
    },

    /**
     * @Author: George_Chen
     * @Description: set the response notice content layout
     */
    _setRespContent: function() {
        var message = '';
        var type = this.props.info.type;
        var toPermitted = this.props.info.respToPermitted;
        var action = (this.props.info.respToPermitted ? 'approved' : 'rejected');
        message = (type === 'channel' ? ' your request on channel ' : ' your ' + type + ' request');
        var actionButtons = (<div style={{height: 25}}/>);
        var workspaceBtnInfo = {
            label: 'workspace',
            handler: this._openWorkSpace,
            hoverColor: Colors.lightBlue50,
            color: Colors.lightBlue600,
            iconName: 'input'
        };
        var quickTalkBtnInfo = {
            label: 'quickTalk',
            handler: this._openHangout,
            hoverColor: Colors.lightBlue50,
            color: Colors.lightBlue600,
            iconName: 'chat'
        };
        if (this.props.info.respToPermitted) {
            actionButtons = (
                <div>
                    {this._setActionButton(workspaceBtnInfo)}
                    {this._setActionButton(quickTalkBtnInfo)}
                </div>
            );
        }
        return this._setContent(message, actionButtons);
    },

    /**
     * @Author: George_Chen
     * @Description: the main generator for creating notice content
     * 
     * @param {String}      displayMessage, the notice content message
     * @param {Object}      actionButtons, the notice action buttons (react element)
     */
    _setContent: function(displayMessage, actionButtons) {
        var contentStyle = {
            fontSize: 14,
            height: 'auto'
        };
        return (
            <div style={contentStyle}>
                {displayMessage}
                &nbsp;
                <CustomizedString label={this.props.info.extraInfo.name} limitLength={14} />
                <NoticeTime timestamp={this.props.info.updatedTime} 
                    iconHandler={this._markReaded}
                    isVisible={this.state.isTimeVisible} />
                {actionButtons}
            </div>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: used for generating notice action button
     * 
     * @param {Object}      btnInfo, the notice action button info
     */
    _setActionButton: function(btnInfo) {
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
            <FlatButton onTouchTap={btnInfo.handler}
                style={btnStyle} hoverColor={btnInfo.hoverColor}  label={btnInfo.label}>
                <FontIcon className="material-icons" style={fontIconStyle} color={btnInfo.color} >
                    {btnInfo.iconName}
                </FontIcon>
            </FlatButton>
        );
    },

    render: function() {
        var info = this.props.info;
        var nameStyle = {
            overflow: 'hidden', 
            marginTop: -10,
            fontSize: 13,
            fontWeight: 500
        };
        var content = (info.isReq ? this._setReqContent() : this._setRespContent());
        return (
            <div onMouseEnter={this._hideTimestamp} onMouseLeave={this._showTimestamp} >
                <ListItem 
                    disabled
                    style={{paddingBottom: 5}}
                    primaryText={<div style={nameStyle}>{this.props.info.sender.nickName}</div>} 
                    secondaryText={content} 
                    leftAvatar={<Avatar src={this.props.info.sender.avatar} />} />
                <ListDivider inset />
            </div>
        );
    }
});
