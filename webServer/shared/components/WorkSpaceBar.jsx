var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible').Mixin;

/**
 * actions
 */
var StartConference = require('../../client/actions/rtc/startConference');
var HangupConference = require('../../client/actions/rtc/hangupConference');

/**
 * stores
 */
var ConferenceStore = require('../stores/ConferenceStore');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var FloatingActionButton = Mui.FloatingActionButton;

/**
 * workspace tool bar, now just a template
 */         
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],
    statics: {
        storeListeners: {
            '_onConferenceChange': [ConferenceStore]
        }
    },

    getInitialState: function() {
        return {
            isConferenceExist: false 
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
     * @Description: for leaving current workspace
     */
    _onLeave: function () {
        this.transitionTo('/app/dashboard');
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
    },

    render: function (){
        var barStyle = {};
        if (this.props.onConferenceCall) {
            barStyle = {
                'backgroundColor': '#000'
            };
        }
        return (
            <div className="footer" style={barStyle} >
                <div className="pure-u-1-3">
                    <IconButton iconClassName="fa fa-home"
                                onClick={this._onLeave} />
                    <IconButton iconClassName="fa fa-user-plus" />
                    <IconButton iconClassName="fa fa-tag" />
                    <IconButton iconClassName="fa fa-star" />
                </div>
                <div className="pure-u-1-3" style={{'marginLeft':'40px'}}>
                    <FloatingActionButton mini secondary
                        disabled={this.state.isConferenceExist}
                        iconClassName="fa fa-users" 
                        onClick={this._startConference} />
                    &nbsp;
                    <FloatingActionButton mini secondary
                        disabled={!this.state.isConferenceExist}
                        iconClassName="fa fa-video-camera" />
                    &nbsp;
                    <FloatingActionButton mini secondary
                        disabled={!this.state.isConferenceExist}
                        iconClassName="fa fa-microphone" />
                    &nbsp;
                    <FloatingActionButton mini primary
                        disabled={!this.state.isConferenceExist}
                        iconClassName="fa fa-tty" 
                        onClick={this._hangupConference} />
                </div>
                <div className="pure-u-1-3 Right" >
                </div>
            </div>
        );
    }
});
