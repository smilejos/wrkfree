var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');
var Draggable = require('react-draggable');

/**
 * material ui components
 */
var Mui = require('material-ui');
var IconButton = Mui.IconButton;
var Colors = Mui.Styles.Colors;

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
     * @Description: disable default context menu when user drag the webcam
     */
    _disableMenu: function(e) {
        e.preventDefault();
    },

    /**
     * @Author: George_Chen
     * @Description: simply toggle the local video shown or not
     *         NOTE: currently not used
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
        var videoComponent = (<div style={{width: 180, height: 140, backgroundColor: '#000'}}/>);
        if (this.state.stream && this.state.isVideoShown) {
            videoComponent = (
                <RtcVideo 
                    isMuted
                    videoId="localVideo"
                    stream={this.state.stream} />
            );
        }
        return (
            <div onContextMenu={this._disableMenu} >
                <Draggable >
                    <div className={this.state.isEnabled ? 'Webcam-shown' : 'Webcam-hidden'} >
                        {videoComponent}
                    </div>
                </Draggable>
            </div>
        );
    }
});
