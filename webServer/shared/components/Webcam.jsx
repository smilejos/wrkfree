var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;

/**
 * store
 */
var WebcamStore = require('../stores/WebcamStore');

/**
 * child components
 */
var RtcVideo = require('./common/rtcVideo.jsx');

/**
 * the container component for local video component
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onStoreChange': [WebcamStore]
        }
    },

    _getStoreState: function(){
        return this.getStore(WebcamStore).getState();
    },

    _onStoreChange: function() {
        var state = this._getStoreState();
        state.isVideoShown = !!state.stream;
        this.setState(state);
    },

    /**
     * @Author: George_Chen
     * @Description: simply toggle the local video shown or nott
     */
    _toggleVideo: function() {
        this.setState({
            isVideoShown: !this.state.isVideoShown
        });
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    render: function(){
        var style = (this.state.isEnabled ? 'Webcam-shown' : 'Webcam-hidden');
        var videoComponent = '';
        if (this.state.stream && this.state.isVideoShown) {
            videoComponent = (
                <RtcVideo 
                    isMuted
                    videoId="localVideo"
                    stream={this.state.stream} />
            );
        }
        return (
            <div className={style}>
                <div className="icon">
                    <IconButton 
                        iconClassName="fa fa-dot-circle-o"
                        tooltip={'Show Webcam Video'}
                        touch  
                        onClick={this._toggleVideo} />
                </div>
                {videoComponent}
            </div>
        );
    }
});
