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
        if (this.props.stream) {
            AttachStream(
                this.props.stream, 
                document.getElementById(this.props.videoId)
            );
        }
    },

    render: function(){
        var videoWidth = (this.props.width ? this.props.width : 250);
        return (
            <div className="rtcVideo">
                <video 
                    width={videoWidth} 
                    id={this.props.videoId}
                    muted />
            </div>
        );
    }
});
