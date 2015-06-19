var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * stores
 */
var MessageStore = require('../../stores/MessageStore');

/**
 * actions
 */
var PullMessagesAction = require('../../../client/actions/chat/pullMessages');

/**
 * child components
 */
var UserAvatar = require('../common/userAvatar.jsx');

/**
 * Public API
 * @Author: George_Chen
 * @Description: hangout message list component
 *         
 * @param {String}      this.props.channelId, the channel id
 * @param {String}      this.props.self, the self uid
 * @param {Number}      this.props.conferenceHeight, the height of conference component
 * @param {Number}      this.props.messagesHeight, the height of message list component
 * @param {Boolean}     this.props.hasConference, indicate hangout has conference or not
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onMessageUpdate': [MessageStore]
        }
    },

    _getStoreMessages: function() {
        var cid = this.props.channelId;
        return this.getStore(MessageStore).getMessages(cid);
    },

    _onMessageUpdate: function() {
        this.setState({
            messages: this._getStoreMessages()
        });
    },

    /**
     * @Author: George_Chen
     * @Description: start to load channel messages from server
     */
    componentDidMount: function(){
        this._pullLatestMessages(this.props.channelId);
    },

    componentDidUpdate: function(prevProps, prevState) {
        var currentLastMsg = this.state.messages[this.state.messages.length-1];
        var prevLastMsg = prevState.messages[prevState.messages.length-1];
        // initial component update
        if (!prevLastMsg) {
            return this._scrollToBottom();
        }
        // new incoming message
        if (currentLastMsg.sentTime > prevLastMsg.sentTime) {
            return this._scrollToBottom();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: handle the message scroll bar on message list
     */
    _scrollToBottom: function() {
        var node = React.findDOMNode(this);
        node.scrollTop = node.scrollHeight;
    },

    /**
     * @Author: George_Chen
     * @Description: pull latest messages on current channel
     *         NOTE: different from _pullOlderMessages, we must assign
     *               channelId because this function usually triggered on
     *               channel switching
     */
    _pullLatestMessages: function(cid) {
        var latestMessage = this.getStore(MessageStore).getLatestMessage(cid);
        var timePeriod = {};
        if (latestMessage) {
            timePeriod.start = latestMessage.sentTime;
        }
        return this._pullMessages(cid, timePeriod);
    },

    /**
     * @Author: George_Chen
     * @Description: pull older messages on current channel
     */
    _pullOlderMessages: function() {
        var cid = this.props.channelId;
        var oldestMessage = this.getStore(MessageStore).getOldestMessage(cid);
        var timePeriod = {};
        if (oldestMessage) {
            timePeriod.end = oldestMessage.sentTime;
        }
        return this._pullMessages(cid, timePeriod);
    },

    /**
     * @Author: George_Chen
     * @Description: used to trigger pullMessages action
     *         NOTE: specify timePeriod.start or timePeriod.end 
     *               can restrict message documents queried from server
     *               
     * @param {String}      cid, the channel's id
     * @param {Object}      timePeriod, the time period object, [optional]
     */
    _pullMessages: function(cid, timePeriod){
        this.executeAction(PullMessagesAction, {
            channelId: cid,
            period: timePeriod || {}
        });
    },

    getInitialState: function() {
        return {
            messages: [] 
        };
    },

    render: function() {
        var selfUid = this.props.self;
        var contentStyle ={
            'top': (this.props.hasConference ? this.props.conferenceHeight : 0),
            'height': (this.props.hasConference ? 125 : this.props.messagesHeight),
        };
        var list = SharedUtils.fastArrayMap(this.state.messages, function(msgItem){
            return (
                <HangoutMsg
                    avatar={selfUid === msgItem.from ? '' : msgItem.avatar}
                    content={msgItem.message} />
            );
        });
        return (
            <div className="hangoutMessages" style={contentStyle}>
                {list}
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: hangout message component
 *         
 * @param {String}      this.props.avatar, the avatar of message sender
 * @param {Object}      this.props.content, the content object of message
 */
var HangoutMsg = React.createClass({
    _setAvatar: function() {
        if (!this.props.avatar) {
            return '';
        }
        var avatarStyle = {
            'float': 'left',
            'width': '50px',
            'margin': '5px 0px 0px 5px'
        };
        return (
            <div className="messageAvatar" >
                <UserAvatar avatar={this.props.avatar} isCircle style={avatarStyle} />
            </div>
        );
    },

    render: function() {
        var bubbleClass = (this.props.avatar ? 'msgBubble left': 'msgBubble right');
        return (
            <div className="message" >
                {this._setAvatar()}
                <div className="messageContent">
                    <div className={bubbleClass}>
                        <span className='msgBubbleTail'>&nbsp;</span>
                        {this.props.content}
                    </div>
                </div>
            </div>
        );
    }
});