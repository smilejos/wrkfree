var React = require('react');
var FluxibleMixin = require('fluxible-addons-react/FluxibleMixin');

/**
 * store
 */
var ConferenceStore = require('../../stores/ConferenceStore');


/**
 * child components
 */
var HangoutHeader = require('./HangoutHeader.jsx');
var HangoutMessages = require('./HangoutMessages.jsx');
var HangoutConference = require('./HangoutConference.jsx');
var HangoutInput = require('./HangoutInput.jsx');

var HANGOUT_WIDTH = 260;
var HANGOUT_HEIGHT = 360;
var HANGOUT_INTERVAL_WIDTH = 270;
var HANGOUT_HEADER_HEIGHT = 30;
var HANGOUT_CONFERENCE_AREA_HEIGHT = 150;
var HANGOUT_MESSAGE_LIST_HEIGHT = 280;


/**
 * Public API
 * @Author: George_Chen
 * @Description: hangout space component
 *         
 * @param {String}      this.props.channelId, the channel id
 * @param {String}      this.props.self, the self uid
 * @param {String}      this.props.title, the hangout header title
 * @param {Boolean}     this.props.isCompressed, indicate hangout window size state
 * @param {Boolean}     this.props.onCall, indicate hangout has oncall conference or not
 * @param {Number}      this.props.hangoutIndex, the index of current hangout window
 * @param {Number}      this.props.bottomOffset, the hangout bottom offset
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    statics: {
        storeListeners: {
            '_onConferenceChange': [ConferenceStore]
        }
    },

    getInitialState: function() {
        var conferenceStore = this.getStore(ConferenceStore);
        return {
            hasConference: conferenceStore.isExist(this.props.channelId)
        };
    },

    _onConferenceChange: function() {
        var conferenceStore = this.getStore(ConferenceStore);
        var storeConfernceState = conferenceStore.isExist(this.props.channelId);
        if (storeConfernceState !== this.state.hasConference) {
            this.setState({
                hasConference: storeConfernceState
            });
        }
    },
    
    /**
     * @Author: George_Chen
     * @Description: focus current hangout input when hangout content has been clicked
     */
    _onContentClick: function() {
        this.refs.hangoutInput.focusInput();
    },

    render: function() {
        var hangoutStyle = {
            'right': HANGOUT_WIDTH + this.props.hangoutIndex * HANGOUT_INTERVAL_WIDTH,
            'height': (this.props.isCompressed ? HANGOUT_HEADER_HEIGHT : HANGOUT_HEIGHT ),
            'bottom': this.props.bottomOffset
        };
        var spaceClass = (this.props.isTwinkled ? 'HangoutSpace onTwinkle' : 'HangoutSpace');
        return (
            <div className={spaceClass} style={hangoutStyle} >
                <HangoutHeader 
                    title={this.props.title} 
                    isCompressed={this.props.isCompressed}
                    channelId={this.props.channelId} />
                <div style={{'visibility': (this.props.isCompressed ? 'hidden': 'visible')}} onClick={this._onContentClick} >
                    <HangoutConference
                        conferenceHeight={HANGOUT_CONFERENCE_AREA_HEIGHT}
                        hasConference={this.state.hasConference}
                        channelId={this.props.channelId} />
                    <HangoutMessages 
                        self={this.props.self}
                        conferenceHeight={HANGOUT_CONFERENCE_AREA_HEIGHT}
                        messagesHeight={HANGOUT_MESSAGE_LIST_HEIGHT}
                        hasConference={this.state.hasConference}
                        onFocused={this.props.onFocused}
                        channelId={this.props.channelId} />
                    <HangoutInput 
                        ref="hangoutInput"
                        self={this.props.self}
                        hasConference={this.state.hasConference}
                        onCall={this.props.onCall}
                        channelId={this.props.channelId} />
                </div>
            </div>
        );
    }
});
