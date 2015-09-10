var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * material ui components
 */
var Mui = require('material-ui');
var TextField = Mui.TextField;
var FontIcon = Mui.FontIcon;

/**
 * actions
 */
var StartConference = require('../../../client/actions/rtc/startConference');
var HangupConference = require('../../../client/actions/rtc/hangupConference');
var SendMessageAction = require('../../../client/actions/chat/sendMessage');
var UpdateHangoutTwinkle = require('../../../client/actions/updateHangoutTwinkle');
var FocusHangout = require('../../../client/actions/focusHangout');

var PHONE_ICON_ONCALL_COLOR = '#43A047';
var PHONE_ICON_NORMAL_COLOR = '#333';
var HANUP_ICON_COLOR = '#E53935';
var INPUTBAR_NORMAL_COLOR = '#FFF';
var INPUTBAR_ONCALL_COLOR = 'rgba(0, 0, 0, .5)';

/**
 * Public API
 * @Author: George_Chen
 * @Description: hangout input bar component
 *         
 * @param {String}      this.props.channelId, the channel id
 * @param {String}      this.props.self, the self uid
 * @param {Boolean}     this.props.hasConference, indicate hangout has conference or not
 * @param {Boolean}     this.props.onCall, indicate has oncall conference or not
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: handler for message send out
     */
    _handleKeyDown: function(e){
        if( e.which === 13 ) {
            var message = {
                channelId: this.props.channelId,
                message : this.refs.msgInput.getValue(),
                from: this.props.self
            };
            this.refs.msgInput.clearValue();
            this.executeAction(SendMessageAction, message);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handler for start conference
     */
    _rtcCall: function() {
        this.executeAction(StartConference, {
            channelId: this.props.channelId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for hangup conference
     */
    _hangupCall: function() {
        this.executeAction(HangupConference, {
            channelId: this.props.channelId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler when message input has been focused or blured
     * 
     * @param {Boolean}      onInputFocused, indicate message input is focused or blured
     */
    _onInputFocused: function(onInputFocused) {
        this.executeAction(FocusHangout, {
            channelId: this.props.channelId,
            onFocused: onInputFocused
        });
        if (onInputFocused) {
            this.executeAction(UpdateHangoutTwinkle, {
                channelId: this.props.channelId,
                isTwinkled: false
            });
        }
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: focusing current message input area
     */
    focusInput: function() {
        this.refs.msgInput.focus();
    },

    componentDidMount: function() {
        this.focusInput();
    },

    render: function() {
        var rtcIconName = (this.props.hasConference ? 'call_end' : 'settings_phone');
        var rtcHandler = (this.props.hasConference ? this._hangupCall : this._rtcCall);
        var barStyle = {};
        var rtcIconStyle = {
            fontSize: 23,
            color: (this.props.hasConference ? HANUP_ICON_COLOR : PHONE_ICON_NORMAL_COLOR),
        };
        if (this.props.onCall) {
            rtcIconStyle.color = (this.props.hasConference ? HANUP_ICON_COLOR : PHONE_ICON_ONCALL_COLOR);
            barStyle.backgroundColor = (this.props.hasConference ? INPUTBAR_NORMAL_COLOR : INPUTBAR_ONCALL_COLOR);
            rtcIconName = 'phone_in_talk';
        }
        return (
            <div className={this.props.onCall ? 'hangoutInputBar onTwinkle' : 'hangoutInputBar'} style={barStyle}>
                <div className="hangoutRtcIcon" >
                    <FontIcon className="material-icons"
                        onClick={rtcHandler}
                        style={rtcIconStyle} >
                        {rtcIconName}
                    </FontIcon>
                </div>
                <div className="hangoutTextField" >
                    <TextField 
                        hintText="send message ..." 
                        onFocus={this._onInputFocused.bind(this, true)}
                        onBlur={this._onInputFocused.bind(this, false)}
                        onKeyDown={this._handleKeyDown} 
                        getValue={this._getMessage}
                        ref="msgInput" />
                </div>
            </div>
        );
    }
});
