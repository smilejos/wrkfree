var React = require('react');

/**
 * container used to store system sounds
 */
module.exports = React.createClass({
    componentDidMount: function() {
        document.getElementById('message_sound').src = 'https://www.dropbox.com/s/v3ougyhc6hb0sac/message.mp3?dl=1';
        document.getElementById('notification_sound').src = 'https://www.dropbox.com/s/fgllq71zq7sll0a/notification.mp3?dl=1';
        document.getElementById('phonecall_sound').src = 'https://www.dropbox.com/s/ksewrstshf0m8ve/phonecall.mp3?dl=1';
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
