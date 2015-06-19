var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * stores
 */
var ConferenceStore = require('../../stores/ConferenceStore');

/**
 * child components
 */
var RtcVideo = require('../common/rtcVideo.jsx');

var HANGOUT_VIDEO_WIDTH = 200;

/**
 * Public API
 * @Author: George_Chen
 * @Description: hangout conference area component
 *         
 * @param {String}      this.props.channelId, the channel id
 * @param {Number}      this.props.conferenceHeight, the height of conference component
 * @param {Boolean}     this.props.hasConference, indicate hangout has conference or not
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [ConferenceStore]
        }
    },
    _onStoreChange: function(){
        var state = this._getStoreState();
        this.setState(state);
    },

    _getStoreState: function() {
        var channelId = this.props.channelId;
        return this.getStore(ConferenceStore).getState(channelId);
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    render: function() {
        var contentStyle ={
            'height': (this.props.hasConference ? this.props.conferenceHeight : 0)
        };
        var conference = this.state.conference;
        var rtcComponents = '';
        if (conference) {
            var participants = Object.keys(conference);
            rtcComponents = SharedUtils.fastArrayMap(participants, function(clientId){
                return (
                    <RtcVideo 
                        key={clientId}
                        videoId={clientId} 
                        width={HANGOUT_VIDEO_WIDTH}
                        stream={conference[clientId]} />
                );
            });
        }
        return (
            <div className="hangoutVideo Center" style={contentStyle}>
                {rtcComponents}
            </div>
        );
    }
});