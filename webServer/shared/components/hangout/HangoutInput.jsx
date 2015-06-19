var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * material ui components
 */
var Mui = require('material-ui');
var TextField = Mui.TextField;

/**
 * actions
 */
var StartConference = require('../../../client/actions/rtc/startConference');
var HangupConference = require('../../../client/actions/rtc/hangupConference');
var SendMessageAction = require('../../../client/actions/chat/sendMessage');

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

    render: function() {
        var rtcIconClass = (this.props.hasConference ? 'fa fa-tty' : 'fa fa-phone');
        var rtcHandler = (this.props.hasConference ? this._hangupCall : this._rtcCall);
        var barStyle = {};
        var rtcIconStyle = {
            'fontSize': 23,
            'color': (this.props.hasConference ? HANUP_ICON_COLOR : PHONE_ICON_NORMAL_COLOR),
        };
        if (this.props.onCall) {
            rtcIconStyle.color = (this.props.hasConference ? HANUP_ICON_COLOR : PHONE_ICON_ONCALL_COLOR);
            barStyle.backgroundColor = (this.props.hasConference ? INPUTBAR_NORMAL_COLOR : INPUTBAR_ONCALL_COLOR);
        }
        return (
            <div className="hangoutInputBar" style={barStyle}>
                <div className="hangoutRtcIcon" >
                    <span className={rtcIconClass}
                        onClick={rtcHandler}
                        style={rtcIconStyle} />
                </div>
                <div className="hangoutTextField" >
                    <TextField 
                        hintText="send message ..." 
                        onKeyDown={this._handleKeyDown} 
                        getValue={this._getMessage}
                        ref="msgInput" />
                </div>
            </div>
        );
    }
});