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
var ToggleStore = require('../stores/ToggleStore');
var WebcamStore = require('../stores/WebcamStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var FloatingActionButton = Mui.FloatingActionButton;
var Colors = Mui.Styles.Colors;
var FontIcon = Mui.FontIcon;
var Dialog = Mui.Dialog;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],
    statics: {
        storeListeners: {
            '_onConferenceChange': [ConferenceStore],
            '_onStoreChange': [ToggleStore],
            '_onWebcamChange': [WebcamStore]
        }
    },

    getInitialState: function() {
        var toggleStore = this.getStore(ToggleStore);
        return {
            isConferenceExist: false,
            isConferenceVisible: toggleStore.conferenceVisible,
            isDiscussionVisible: toggleStore.discussionVisible,
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
     * @Description: for tracking channel's conference state
     */
    _onStoreChange: function() {
        var toggleStore = this.getStore(ToggleStore);
        this.setState({
            isConferenceVisible: toggleStore.conferenceVisible,
            isDiscussionVisible: toggleStore.discussionVisible
        });
    },

    /**
     * @Author: George_Chen
     * @Description: for switch current workspace into hangout window
     */
    _siwthToHangout: function() {
        var dialog = this.refs.dialog;
        var channel = this.props.channel;
        this.setState({
            dialogInfo: {
                title: 'Confirmation',
                content: 'Your are about to switch into hangout window',
                actions: [{
                    text: 'Cancel',
                    onClick: dialog.dismiss
                }, {
                    text: 'Continue',
                    onClick: function(){
                        this.transitionTo('/app/dashboard');
                        setTimeout(function(){
                            window.context.executeAction(OpenHangout, {
                                channelId: channel.channelId,
                                hangoutTitle: channel.name
                            });
                        }, 300);
                    }.bind(this)
                }]
            }
        });
        dialog.show();
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
     * @Author: Jos Tung
     * @Description: switch video display or not
     */
    _switchVideo: function() {
        this.executeAction(ToggleComponent, {
            param: 'conferenceVisible',
            isVisible: !this.state.isConferenceVisible,
        });
    },

    /**
     * @Author: Jos Tung
     * @Description: switch Discussion display or not
     */
    _switchChat: function() {
        this.executeAction(ToggleComponent, {
            param: 'discussionVisible',
            isVisible: !this.state.isDiscussionVisible
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
        var switchChatStyle = 'pure-u-1-2 switchButton ' + (this.state.isDiscussionVisible ? 'switchButtonActive' : '');
        var switchVieoStyle = 'pure-u-1-2 switchButton ' + (this.state.isConferenceVisible ? 'switchButtonActive' : '');
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
        var nameStyle = {
            color: '#000',
            fontSize: 18,
            paddingLeft: 20,
            paddingTop: 15
        };
        return (
            <div className="footer" >
                <div className={this.props.onConferenceCall ? "leftControl onRtcCall" : "leftControl"}>
                    <div className="pure-u-1-3 baseFonts" style={nameStyle} >
                        {this._setStarIcon()}
                        &nbsp;
                        {this.props.channel.name}
                    </div>
                    <div className="pure-u-1-3">
                        <FloatingActionButton mini secondary
                            disabled={isConferenceExist}
                            onClick={this._startConference} >
                            <i className="material-icons" style={conferenceIconStyle}>
                                {'settings_phone'}
                            </i>
                        </FloatingActionButton>
                        &nbsp;
                        <FloatingActionButton mini secondary
                            disabled={!isConferenceExist || !isVideoSupported}
                            onClick={this._controlMedia.bind(this, true)} >
                            <i className="material-icons" style={cameraIconStyle}>
                                {this.state.isVideoOn ? 'videocam_off' : 'videocam'}
                            </i>
                        </FloatingActionButton>
                        &nbsp;
                        <FloatingActionButton mini secondary
                            disabled={!isConferenceExist || !isAudioSupported}
                            onClick={this._controlMedia.bind(this, false)} >
                            <i className="material-icons" style={micIconStyle}>
                                {this.state.isAudioOn ? 'mic_off' : 'mic'}
                            </i>
                        </FloatingActionButton>
                        &nbsp;
                        <FloatingActionButton mini primary
                            disabled={!this.state.isConferenceExist}
                            onClick={this._hangupConference}>
                            <i className="material-icons" style={hangupIconStyle}>
                                {'call_end'}
                            </i>
                        </FloatingActionButton>
                    </div>
                    <div className="pure-u-1-3">
                        <IconButton iconClassName="fa fa-user-plus"
                                    tooltipPosition="top-center"
                                    tooltip="invite member"
                                    touch
                                    iconStyle={this.state.defaultIconStyle} />
                        <IconButton iconClassName="fa fa-link"
                                    tooltipPosition="top-center"
                                    tooltip="copy link"
                                    touch
                                    iconStyle={this.state.defaultIconStyle} />
                        <IconButton iconClassName="fa fa-random"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-center"
                                    tooltip="switch small window"
                                    touch
                                    onClick={this._siwthToHangout} />
                        <IconButton iconClassName="fa fa-sign-out"
                                    iconStyle={this.state.defaultIconStyle}
                                    tooltipPosition="top-center"
                                    tooltip="leave workspace"
                                    touch
                                    onClick={this._onLeave} />
                    </div>
                </div>
                <div className="rightControl" >
                    <div className={switchVieoStyle} onClick={this._switchVideo}>Video</div>
                    <div className={switchChatStyle} onClick={this._switchChat}>Chat</div>
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
