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
        return (
            <div className="rtcVideo">
                <video 
                    width="250" 
                    id={this.props.videoId}
                    muted />
            </div>
        );
    }
});
