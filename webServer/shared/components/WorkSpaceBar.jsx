var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');

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
        var cid = this.props.channel.channelId;
        var conferenceStore = this.getStore(ConferenceStore);
        var webcamStore = this.getStore(WebcamStore);
        var supportedMedia = webcamStore.getState().supportedMedia;
        var streamState = webcamStore.getStreamState(cid);
        return {
            isConferenceExist: conferenceStore.isExist(cid),
            isVideoSupported: supportedMedia.video,
            isAudioSupported: supportedMedia.audio,
            isVideoOn: streamState.isVideoOn,
            isAudioOn: streamState.isAudioOn,
            defaultIconStyle: {
                color: Colors.grey500
            },
            dialogInfo: {}
        };
    },

    _onWebcamChange: function() {
        var webcamStore = this.getStore(WebcamStore);
        var supportedMedia = webcamStore.getState().supportedMedia;
        var streamState = webcamStore.getStreamState(this.props.channel.channelId);
        this.setState({
            isVideoSupported: supportedMedia.video,
            isAudioSupported: supportedMedia.audio,
            isVideoOn: streamState.isVideoOn,
            isAudioOn: streamState.isAudioOn,
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
        var isStarred = this.props.status.isStarred;
        var is1on1 = this.props.channel.is1on1;
        var starIconStyle = {
            color: (isStarred ? Colors.yellow700 : Colors.grey500)
        };
        return (
            <IconButton iconClassName="material-icons"
                        tooltipPosition="top-right"
                        tooltip={isStarred ? 'remove from Favorites' : 'add to Favorites'}
                        touch
                        tooltipStyles={{left: 45}}
                        disabled={is1on1}
                        onTouchTap={this._starChannel}
                        iconStyle={is1on1 ? this.state.defaultIconStyle : starIconStyle} >
                        {is1on1 ? 'person_outline' : 'star'}
            </IconButton>
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
        var cid = this.props.channel.channelId;
        var isHangoutExist = this.getStore(HangoutStore).isHangoutExist(cid);
        if (!isHangoutExist) {
            this.executeAction(HangupConference, {
                channelId: this.props.channel.channelId
            });
        }
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
        var webcamStore = this.getStore(WebcamStore);
        var supportedMedia = webcamStore.getState().supportedMedia;
        var streamState = webcamStore.getStreamState(nextProps.channel.channelId);
        if (isChannelChange && streamState) {
            this.setState({
                isVideoSupported: supportedMedia.video,
                isAudioSupported: supportedMedia.audio,
                isVideoOn: streamState.isVideoOn,
                isAudioOn: streamState.isAudioOn,
            });
        }
        if (isChannelChange && this.state.isConferenceExist) {
            this._hangupConference();
        }
    },

    componentWillUnmount: function() {
        if (this.state.isConferenceExist) {
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
                    <div className="baseFonts" >
                        {this._setStarIcon()}
                        <div style={{position: 'absolute', top: 17, left: 48, fontSize: 16, height: 48}}>
                            {this.props.channel.name}
                        </div>
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
                        <IconButton iconClassName="material-icons"
                                    tooltipPosition="top-left"
                                    tooltip="invite member"
                                    touch
                                    disabled
                                    iconStyle={this.state.defaultIconStyle} >
                                    {'supervisor_account'}
                        </IconButton>
                        <IconButton iconClassName="material-icons"
                                    tooltipPosition="top-left"
                                    tooltip="copy link"
                                    touch
                                    disabled
                                    iconStyle={this.state.defaultIconStyle} >
                                    {'link'}
                        </IconButton>
                        <IconButton iconClassName="material-icons"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-left"
                                    tooltip="switch to chatbox"
                                    touch
                                    onClick={this._siwthToHangout} >
                                    {'shuffle'}
                        </IconButton>
                        <IconButton iconClassName="material-icons"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-left"
                                    tooltip="back to dashboard"
                                    touch
                                    onClick={this._onLeave} >
                                    {'home'}
                        </IconButton>
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
