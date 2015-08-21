var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var ControlMedia = require('../../client/actions/rtc/controlMedia');
var StartConference = require('../../client/actions/rtc/startConference');
var HangupConference = require('../../client/actions/rtc/hangupConference');
var ToggleComponent = require('../../client/actions/toggleComponent');
var StarChannel = require('../../client/actions/channel/starChannel');
var OpenHangout = require('../../client/actions/openHangout');

/**
 * stores
 */
var ConferenceStore = require('../stores/ConferenceStore');
var WebcamStore = require('../stores/WebcamStore');
var HangoutStore = require('../stores/HangoutStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var FloatingActionButton = Mui.FloatingActionButton;
var Colors = Mui.Styles.Colors;
var FontIcon = Mui.FontIcon;
var Dialog = Mui.Dialog;
var Tooltip = Mui.Tooltip;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],
    statics: {
        storeListeners: {
            '_onConferenceChange': [ConferenceStore],
            '_onWebcamChange': [WebcamStore]
        }
    },

    getInitialState: function() {
        var conferenceStore = this.getStore(ConferenceStore);
        var cid = this.props.channel.channelId;
        return {
            isConferenceExist: conferenceStore.isExist(cid),
            isVideoSupported: true,
            isAudioSupported: true,
            isVideoOn: true,
            isAudioOn: true,
            defaultIconStyle: {
                color: Colors.grey500
            },
            dialogInfo: {}
        };
    },

    _onWebcamChange: function() {
        var webcamStore = this.getStore(WebcamStore);
        var supportedMedia = webcamStore.getState().supportedMedia;
        this.setState({
            isVideoSupported: supportedMedia.video,
            isAudioSupported: supportedMedia.audio,
        });
    },

    /**
     * @Author: George_Chen
     * @Description: for tracking channel's conference state
     */
    _onConferenceChange: function() {
        var conferenceStore = this.getStore(ConferenceStore);
        var channelId = this.props.channel.channelId;
        this.setState({
            isConferenceExist: conferenceStore.isExist(channelId)
        });
    },

    /**
     * @Author: George_Chen
     * @Description: for switch current workspace into hangout window
     */
    _siwthToHangout: function() {
        var channel = this.props.channel;
        return window.context.executeAction(OpenHangout, {
            channelId: channel.channelId,
            hangoutTitle: channel.name,
            isforcedToOpen: true
        }).bind(this).then(function(){
            this.transitionTo('/app/dashboard');
        });
    },

    /**
     * @Author: George_Chen
     * @Description: for leaving current workspace
     */
    _onLeave: function () {
        this.setState({
            dialogInfo: {
                title: 'Warning',
                content: 'You are about to leave current workspace',
                actions: [{
                    text: 'Cancel',
                    onClick: this.refs.dialog.dismiss
                }, {
                    text: 'Continue',
                    onClick: this.transitionTo.bind(this, '/app/dashboard')
                }]
            }
        });
        this.refs.dialog.show();
    },

    _setStarIcon: function() {
        if (this.props.channel.is1on1) {
            return (<span className="fa fa-at" style={this.state.defaultIconStyle} />);
        }
        var isStarred = this.props.status.isStarred;
        var starIconStyle = {
            color: (isStarred ? Colors.yellow900 : Colors.grey500),
            cursor: 'pointer'
        }
        return (
            <span className="fa fa-star-o" 
                style={starIconStyle}
                onClick={this._starChannel} />
        );
    },

    /**
     * @Author: George_Chen
     * @Description: for user to star current workspace channel
     */
    _starChannel: function() {
        this.executeAction(StarChannel, {
            channelId: this.props.channel.channelId,
            name: this.props.channel.name,
            host: this.props.channel.host,
            toStar: !this.props.status.isStarred
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to start conference state on current channel
     */
    _startConference: function() {
        this.executeAction(StartConference, {
            channelId: this.props.channel.channelId
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to hangup current conference
     */
    _hangupConference: function() {
        this.executeAction(HangupConference, {
            channelId: this.props.channel.channelId
        });
        // reset video and audio back to default
        this.setState({
            isVideoOn: true,
            isAudioOn: true,
        });
    },

    /**
     * @Author: George_Chen
     * @Description: control current rtc media (video/audio)
     *
     * @param {Boolean}          isVideoMode, indicate target media is video or not
     */
    _controlMedia: function(isVideoMode) {
        var nextState = {};
        var isModeOn = (isVideoMode ? !this.state.isVideoOn : !this.state.isAudioOn);
        if (isVideoMode) {
            nextState.isVideoOn = isModeOn;
        } else {
            nextState.isAudioOn = isModeOn;
        }
        this.executeAction(ControlMedia, {
            channelId: this.props.channel.channelId,
            isVideo: isVideoMode,
            isOn: isModeOn
        })
        this.setState(nextState);
    },

    componentWillReceiveProps: function(nextProps) {
        var isChannelChange = (this.props.channel.channelId !== nextProps.channel.channelId);
        if (isChannelChange && this.state.isConferenceExist) {
            this._hangupConference();
        }
    },

    componentWillUnmount: function() {
        var cid = this.props.channel.channelId;
        var isHangoutExist = this.getStore(HangoutStore).isHangoutExist(cid);
        if (this.state.isConferenceExist && !isHangoutExist) {
            this._hangupConference();
        }
    },

    render: function () {
        var activeIconColor = '#FFF';
        var inActiveIconColor = 'rgba(0,0,0,0.3)';
        var isConferenceExist = this.state.isConferenceExist;
        var isVideoSupported = this.state.isVideoSupported;
        var isAudioSupported = this.state.isAudioSupported;
        var conferenceIconStyle = {
            color: isConferenceExist ? inActiveIconColor : activeIconColor
        };
        var cameraIconStyle = {
            color: isConferenceExist && isVideoSupported ? activeIconColor : inActiveIconColor
        };
        var micIconStyle = {
            color: isConferenceExist && isAudioSupported ? activeIconColor : inActiveIconColor
        };
        var hangupIconStyle = {
            color: isConferenceExist ? activeIconColor : inActiveIconColor
        };
        return (
            <div className="footer" >
                <div className={this.props.onConferenceCall ? "leftControl onRtcCall" : "leftControl"}>
                    <div className="baseFonts" style={{position: 'absolute', fontSize: 20, left: 15, top: 10}}>
                        {this._setStarIcon()}
                        &nbsp;
                        {this.props.channel.name}
                    </div>
                    <div style={{position: 'absolute', left: '50%', marginLeft: -100, top: 0}}>
                        <RtcAction 
                            iconName="settings_phone"
                            iconStyle={conferenceIconStyle}
                            handler={this._startConference}
                            isButtonDisabled={isConferenceExist}
                            label="start call"/>
                        <RtcAction 
                            iconName={this.state.isVideoOn ? 'videocam_off' : 'videocam'}
                            label={this.state.isVideoOn ? 'block camera' : 'unblock camera'}
                            handler={this._controlMedia.bind(this, true)}
                            isButtonDisabled={!isConferenceExist || !isVideoSupported}
                            iconStyle={cameraIconStyle}/>
                        <RtcAction 
                            iconName={this.state.isAudioOn ? 'mic_off' : 'mic'}
                            label={this.state.isAudioOn ? 'mute microphone' : 'unmute microphone'}
                            handler={this._controlMedia.bind(this, false)}
                            isButtonDisabled={!isConferenceExist || !isAudioSupported}
                            iconStyle={micIconStyle}/>
                        <RtcAction 
                            isPramary
                            iconName="call_end"
                            label="hangup call"
                            handler={this._hangupConference}
                            isButtonDisabled={!this.state.isConferenceExist}
                            iconStyle={hangupIconStyle}/>
                    </div>
                    <div style={{position: 'absolute', right: 10, top: 0}}>
                        <IconButton iconClassName="fa fa-user-plus"
                                    tooltipPosition="top-left"
                                    tooltip="invite member"
                                    touch
                                    iconStyle={this.state.defaultIconStyle} />
                        <IconButton iconClassName="fa fa-link"
                                    tooltipPosition="top-left"
                                    tooltip="copy link"
                                    touch
                                    iconStyle={this.state.defaultIconStyle} />
                        <IconButton iconClassName="fa fa-random"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-left"
                                    tooltip="switch small window"
                                    touch
                                    onClick={this._siwthToHangout} />
                        <IconButton iconClassName="fa fa-sign-out"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-left"
                                    tooltip="leave workspace"
                                    touch
                                    onClick={this._onLeave} />
                    </div>
                </div>
                <Dialog ref="dialog" 
                    actions={this.state.dialogInfo.actions}
                    title={this.state.dialogInfo.title} >
                    {this.state.dialogInfo.content}
                </Dialog>
            </div>
        );
    }
});

/**
 * this is a temp workaround for adding tooltips on 
 * current RTC FloatingActionButton
 */
var RtcAction = React.createClass({
    getInitialState: function() {
        return {
            isTipsShown: false
        };
    },

    _showTips: function(isShown) {
        this.setState({
            isTipsShown: (isShown && !this.props.isButtonDisabled)
        });
    },

    render: function() {
        return (
            <div style={{float: 'left', marginLeft: 5}} 
                onMouseEnter={this._showTips.bind(this, true)}
                onMouseLeave={this._showTips.bind(this, false)}>
                <Tooltip 
                    touch
                    show={this.state.isTipsShown}
                    verticalPosition="top" 
                    horizontalPosition="right" 
                    label={this.props.label} />
                <FloatingActionButton mini secondary={!this.props.isPramary}
                    disabled={this.props.isButtonDisabled}
                    onClick={this.props.handler} >
                    <i className="material-icons" style={this.props.iconStyle}>
                        {this.props.iconName}
                    </i>
                </FloatingActionButton>
            </div>
        )
    }
});
