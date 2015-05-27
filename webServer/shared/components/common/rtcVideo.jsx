var React = require('react');
var AttachStream = require('attachmediastream');
var CryptoUtils = require('../../../../sharedUtils/cryptoUtils');

/**
 * the basic rtc video container
 */
module.exports = React.createClass({
    getInitialState: function() {
        return {
            videoId: null
        };
    },

    /**
     * generate a timebased video element id
     */
    componentDidMount: function(){
        var timeStr = Date.now().toString();
        this.setState({
            videoId: CryptoUtils.getMd5Hex(timeStr)
        });
    },

    render: function(){
        var stream = this.props.stream;
        var videoId = this.state.videoId;
        if (stream) {
            AttachStream(stream, document.getElementById(videoId));
        }
        return (
            <div className="rtcVideo">
                <video 
                    width="250" 
                    id={videoId}
                    muted
                    controls
                    className={this.props.isVisible ? 'video-shown' : 'video-hidden'} />
            </div>
        );
    }
});
