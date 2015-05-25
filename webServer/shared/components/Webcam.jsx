var React = require('react');

/**
 * the container component for local video component
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div id="Webcam" className="Webcam-shown">
                <div className="icon fa fa-video-camera fa-2x"></div>
                <video 
                    width="250"
                    id="localVideo"
                    className="video-hidden" />
            </div>
        );
    }
});
