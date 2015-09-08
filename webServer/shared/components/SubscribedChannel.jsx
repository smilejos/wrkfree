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

/**
 * material-ui components
 */
var Mui = require('material-ui');
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;


module.exports = React.createClass({
    mixins: [Router.Navigation, Router.State, FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: used to enter the workspace of current channel
     */
    _enterWorkspace: function() {
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

    /**
     * @Author: George_Chen
     * @Description: used to set channel left icon
     */
    _setLeftIcon: function() {
        var iconColor = '#27A';
        var iconAction = 'bookmark_border';
        if (this.props.hasConferenceCall) {
            iconColor = Colors.green500;
            iconAction = 'phone_in_talk';
        }
        return (
            <FontIcon style={{marginTop: -5}} className="material-icons" color={iconColor}>
                {iconAction}
            </FontIcon>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: used to set channel right icon
     */
    _setRightIcon: function() {
        if (this.props.unreadMsgNumbers > 0) {
            return (
                <Avatar size={20} style={{marginTop: 5, fontSize: 11}} backgroundColor={Colors.red500}>
                    {this.props.unreadMsgNumbers}
                </Avatar>
            );
        }
        return (<div/>);
    },

    render: function() {
        var cNameStyle = {
            overflow: 'hidden', 
            marginLeft: -20,
            marginTop: -10,
            fontSize: 14
        };
        var uNameStyle = {
            overflow: 'hidden', 
            marginLeft: -20,
            fontSize: 12
        };
        return (
            <div >
                <ListItem 
                    onTouchTap={this._enterWorkspace}
                    style={{height: 55}}
                    primaryText={<div style={cNameStyle}>{this.props.name}</div>} 
                    secondaryText={<div style={uNameStyle}>{'@' + this.props.hostInfo.nickName}</div>} 
                    leftIcon={this._setLeftIcon()}
                    rightAvatar={this._setRightIcon()} />
                <ListDivider inset />
            </div>
        );
    } 
});
