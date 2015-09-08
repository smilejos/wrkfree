var React = require('react');
var AttachStream = require('attachmediastream');

/**
 * the basic rtc video container
 */
module.exports = React.createClass({
    /**
     * attach the media stream to video element
     */
    componentDidMount: function(){
        var video = React.findDOMNode(this.refs.videoElement);
        if (this.props.stream) {
            return AttachStream(this.props.stream, video);
        }
    },

    render: function(){
        var videoWidth = (this.props.width ? this.props.width : 180);
        return (
            <div className="rtcVideo">
                <video 
                    ref="videoElement"
                    width={videoWidth}
                    poster="/assets/imgs/webcamPoster.svg"
                    muted={!!this.props.isMuted} />
            </div>
        );
    }
});
