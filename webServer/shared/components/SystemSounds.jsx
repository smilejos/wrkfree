var React = require('react');

/**
 * container used to store system sounds
 */
module.exports = React.createClass({
    componentDidMount: function() {
        document.getElementById('message_sound').src = 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/sounds/message.mp3';
        document.getElementById('notification_sound').src = 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/sounds/notification.mp3';
        document.getElementById('phonecall_sound').src = 'https://s3-ap-southeast-1.amazonaws.com/wrkfree/sounds/phonecall.mp3';
    },

    render: function(){
        return (
            <div>
                <audio id="message_sound" />
                <audio id="notification_sound" />
                <audio id="phonecall_sound" />
            </div>
        );
    }
});
