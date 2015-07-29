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

/**
 * stores
 */
var ConferenceStore = require('../stores/ConferenceStore');
var ToggleStore = require('../stores/ToggleStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var FloatingActionButton = Mui.FloatingActionButton;
var Colors = Mui.Styles.Colors;
var FontIcon = Mui.FontIcon;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],
    statics: {
        storeListeners: {
            '_onConferenceChange': [ConferenceStore],
            '_onStoreChange': [ToggleStore]
        }
    },

    getInitialState: function() {
        var toggleStore = this.getStore(ToggleStore);
        return {
            isConferenceExist: false,
            isConferenceVisible: toggleStore.conferenceVisible,
            isDiscussionVisible: toggleStore.discussionVisible,
            isVideoOn: true,
            isAudioOn: true,
            defaultIconStyle: {
                color: Colors.grey500
            },
            starIconStyle: {
                color: Colors.amber500
            }
        };
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
     * @Description: for leaving current workspace
     */
    _onLeave: function () {
        this.transitionTo('/app/dashboard');
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

    render: function (){
        var barStyle = {};
        var starIconStyle = this.state.defaultIconStyle;
        var switchChatStyle = 'pure-u-1-2 switchButton ' + (this.state.isDiscussionVisible ? 'switchButtonActive' : '');
        var switchVieoStyle = 'pure-u-1-2 switchButton ' + (this.state.isConferenceVisible ? 'switchButtonActive' : '');
        if (this.props.onConferenceCall) {
            barStyle = {
                'backgroundColor': '#000'
            };
        }
        if (this.props.status.isStarred) {
            starIconStyle = this.state.starIconStyle;
        }
        var conferenceIconStyle = {
            color: this.state.isConferenceExist ? 'rgba(0,0,0,0.3)' : '#FFF'
        };
        var ctrlIconStyle = {
            color: this.state.isConferenceExist ? '#FFF' : 'rgba(0,0,0,0.3)'
        };
        var nameStyle = {
            color: '#000',
            fontSize: 18,
            paddingLeft: 20,
            paddingTop: 15
        };
        var is1on1 = this.props.channel.is1on1;
        return (
            <div className="footer" style={barStyle} >
                <div className="pure-u-1-3 baseFonts" style={nameStyle} >
                    <span className={is1on1 ? 'fa fa-at' : 'fa fa-briefcase'} style={{color: Colors.grey500}} />
                    &nbsp;
                    {this.props.channel.name}
                </div>
                <div className="pure-u-1-3">
                    <FloatingActionButton mini secondary
                        disabled={this.state.isConferenceExist}
                        onClick={this._startConference} >
                        <i className="material-icons" style={conferenceIconStyle}>
                            {'settings_phone'}
                        </i>
                    </FloatingActionButton>
                    &nbsp;
                    <FloatingActionButton mini secondary
                        disabled={!this.state.isConferenceExist}
                        onClick={this._controlMedia.bind(this, true)} >
                        <i className="material-icons" style={ctrlIconStyle}>
                            {this.state.isVideoOn ? 'videocam_off' : 'videocam'}
                        </i>
                    </FloatingActionButton>
                    &nbsp;
                    <FloatingActionButton mini secondary
                        disabled={!this.state.isConferenceExist}
                        onClick={this._controlMedia.bind(this, false)} >
                        <i className="material-icons" style={ctrlIconStyle}>
                            {this.state.isAudioOn ? 'mic_off' : 'mic'}
                        </i>
                    </FloatingActionButton>
                    &nbsp;
                    <FloatingActionButton mini primary
                        disabled={!this.state.isConferenceExist}
                        onClick={this._hangupConference}>
                        <i className="material-icons" style={ctrlIconStyle}>
                            {'call_end'}
                        </i>
                    </FloatingActionButton>
                </div>
                <div className="pure-u-1-3">
                    <IconButton iconClassName="fa fa-user-plus"
                                iconStyle={this.state.defaultIconStyle} />
                    <IconButton iconClassName="fa fa-star" 
                                iconStyle={starIconStyle}
                                onClick={this._starChannel} />
                    <IconButton iconClassName="fa fa-link"
                                iconStyle={this.state.defaultIconStyle} />
                    <IconButton iconClassName="fa fa-sign-out"
                                iconStyle={this.state.defaultIconStyle}
                                onClick={this._onLeave} />
                </div>
                <div className="rightControl" >
                    <div className={switchVieoStyle} onClick={this._switchVideo}>Video</div>
                    <div className={switchChatStyle} onClick={this._switchChat}>Chat</div>
                </div>
            </div>
        );
    }
});
