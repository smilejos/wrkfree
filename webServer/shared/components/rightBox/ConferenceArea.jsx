var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * store
 */
var ConferenceStore = require('../../stores/ConferenceStore');

/**
 * child components
 */
var RtcVideo = require('../common/rtcVideo.jsx');

/**
 * @Author: George_Chen
 * @Description: conference area component used to render remote rtc view
 *
 * @param {String}      this.props.channelId, channel's id
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
        var conference = this.state.conference;
        var rtcComponents = '';
        if (conference) {
            var participants = Object.keys(conference);
            rtcComponents = SharedUtils.fastArrayMap(participants, function(clientId, index){
                return (
                    <div key={clientId} style={{marginTop: 10}}>
                        <RtcVideo 
                            width={180}
                            videoId={clientId} 
                            stream={conference[clientId]} />
                    </div>
                );
            });
        }
        return (
            <div className="ConferenceArea" style={this.props.inlineStyle}>
                {rtcComponents}
            </div>
        );
    }
});
