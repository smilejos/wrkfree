var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 

/**
 * wrkfree store/action on workspace
 */
var HeaderStore = require('../../stores/HeaderStore');
var MessageStore = require('../../stores/MessageStore');
var SendMessageAction = require('../../../client/actions/chat/sendMessage');
var PullMessagesAction = require('../../../client/actions/chat/pullMessages');

/**
 * common components
 */
var UserAvatar = require('../common/userAvatar.jsx');

/**
 * Material-ui circle progress
 */
var CircularProgress = require('material-ui').CircularProgress;
var TextField = require('material-ui').TextField;
var IconButton = require('material-ui').IconButton;

 /**
 * @Author: Jos Tung
 * @Description: a area for user cross-discuss in workspace
 *  NOTE: Use MessageStore to receive message from server
 */
var DiscussionArea = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [MessageStore]
        }
    },
    
    /**
     * @Author: Jos Tung
     * @Description: use this function to scroll-down div after component receive message
     */    
    componentDidUpdate: function(prevProps, prevState){
        var currentLastMsg = this.state.messages[this.state.messages.length-1];
        var prevLastMsg = prevState.messages[prevState.messages.length-1];
        if (!prevLastMsg) {
            return this.refs.msgList.scrollToBottom();
        }
        // new incoming message
        if (prevLastMsg && currentLastMsg.sentTime > prevLastMsg.sentTime) {
            // if message input is current not focused, then twinkle the discussion area
            if (!this.state.isFocused) {
                this.setState({
                    isTwinkled: true
                });
            }
        }
    },

    /**
     * @Author: George_Chen
     * @Description: only switch between different channels will trigger _pullLatestMessages
     */
    componentWillReceiveProps: function(nextProps) {
        this.refs.msgList.scrollToBottom();
        if (this.props.channelId !== nextProps.channelId) {            
            this._pullLatestMessages(nextProps.channelId);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: start to load channel messages from server
     */
    componentDidMount: function(){
        var channelId = this.props.channelId;
        this._pullLatestMessages(channelId);
    },

    getInitialState: function() {
        var state = this._getStateFromStores();
        state.isShown = false;
        state.isFocused = false;
        state.isTwinkled = false;
        return state;
    },

    _onStoreChange: function(){
        var state = this._getStateFromStores;
        this.setState(state);
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
        this.setState({ 
            isReloading: true
        });
        return this._pullMessages(cid, timePeriod);
    },

    /**
     * @Author: Jos Tung
     * @Description: used to trigger pullMessages action
     *         NOTE: specify timePeriod.start or timePeriod.end 
     *               can restrict message documents queried from server
     *               
     * @param {String}      cid, the channel's id
     * @param {Object}      timePeriod, the time period object, [optional]
     */
    _pullMessages: function(cid, timePeriod) {
        setTimeout(function(){
            this.executeAction(PullMessagesAction, {
                channelId: cid,
                period: timePeriod || {}
            });
        }.bind(this), 500);
    },

    /**
     * @Author: Jos Tung
     * @Description: handler message send-out function when user press 'enter' key on discussion area.
     */
    _handleKeyDown: function(e){
        if( e.which === 13 ) {
            var headerStore = this.getStore(HeaderStore);
            var selfInfo = headerStore.getSelfInfo();
            var message = {
                channelId: this.props.channelId,
                message : this.refs.send.getValue(),
                from: selfInfo.uid
            };
            this.refs.send.clearValue();
            this.refs.msgList.scrollToBottom();
            this.context.executeAction(SendMessageAction, message);
        }
    },

    _updateFocusedState: function(focusState) {
        var state = {};
        state.isFocused = focusState;
        if (focusState) {
            state.isTwinkled = false;
        }
        this.setState(state);
    },

    _getStateFromStores: function () {
        var cid = this.props.channelId;
        return { 
            messages : this.getStore(MessageStore).getMessages(cid),
            isReloading : false
        };
    },

    /**
     * @Author: George_Chen
     * @Description: used to handle show discussion messages or not
     */
    _showMessages: function(shownState) {
        if (shownState) {
            this.refs.msgList.scrollToBottom();
        }
        this.setState({
            isShown: shownState
        });
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: focusing current message input area
     */
    _focusInput: function() {
        this.refs.send.focus();
    },

    render: function(){
        var isShown = this.state.isShown;
        var isTwinkled = this.state.isTwinkled;
        var ContainerStyle = {
            bottom: (isShown ? 40 : -7),
            boxShadow: (isShown ? '-1px 2px 2px rgba(0,0,0,0.1), 2px 6px 12px rgba(0,0,0,0.1)' : ''),
        };
        var headerStyle = {
            backgroundColor: '#262626',
            height: 40,
            color: '#FFF',
            opacity: 0.8,
            lineHeight: 2.8,
            fontWeight: 500
        };
        var enableContainerStyle = {
            position: 'absolute',
            top: -5,
            right: 0
        };
        return (
            <div className={isTwinkled ? 'DiscussionArea onTwinkle' : 'DiscussionArea'} style={ContainerStyle}>
                <div style={headerStyle}>
                    &nbsp;
                    &nbsp;
                    <span className="fa fa-comment" />
                    &nbsp;
                    &nbsp;
                    {'Messages'}
                </div>
                <div style={enableContainerStyle}>
                    <IconButton iconClassName={isShown ? "fa fa-angle-down" : "fa fa-angle-up"}
                        tooltipPosition="top-left"
                        tooltip={isShown ? "hide message" : "show message"}
                        onClick={this._showMessages.bind(this, !isShown)}
                        touch
                        iconStyle={{color: '#FFF'}} />
                </div>
                <ReloadImg isReload={this.state.isReloading} />
                <MessageList isShown={isShown}
                    ref="msgList"
                    data={this.state.messages}
                    pullMsgAction={this._pullOlderMessages}
                    isReload={this.state.isReloading} 
                    onClick={this._focusInput} />
                <div className="DiscussionInput" style={{visibility: isShown ? 'visible' : 'hidden'}}>
                    <TextField 
                        onFocus={this._updateFocusedState.bind(this, true)}
                        onBlur={this._updateFocusedState.bind(this, false)}
                        hintText="say something ..." 
                        onKeyDown={this._handleKeyDown} 
                        getValue={this._getMessage}
                        ref="send" />
                </div>
            </div>
        );
    }
});


var ReloadImg = React.createClass({
    render: function(){
        var isReload = this.props.isReload;
        var divStyle = {
            marginBottom: -30,
            opacity: isReload ? 1 : 0
        }
        return ( 
            <div className="ReloadImg" style={divStyle}>
                <CircularProgress size={0.4}   />
            </div> 
        );
    }
});

var MessageList = React.createClass({
    scrollToBottom: function() {
        var container = React.findDOMNode(this);
        container.scrollTop = container.scrollHeight;
    },

    componentDidUpdate: function() {
        var node = React.findDOMNode(this);
        // the normal message list height is less than "500" currently
        if (node.scrollHeight - node.scrollTop < 500) {
            node.scrollTop = node.scrollHeight;
        }
    },

    _onScroll: function() {
        var node = React.findDOMNode(this);
        if (node.scrollTop === 0 && !this.props.isReload) {
            this.props.pullMsgAction();
        }
    },

    render: function(){
        var inlineStyle = {
            top: this.props.isReload ? 40 : 0,
            height: this.props.isShown ? 350 : 0,
            backgroundColor: '#FFF'
        }
        var messages = this.props.data.map( function( message ){
            return <Message key={message.sentTime} data={message} />;
        });
        return (
            <div className="MsgContainer" 
                style={inlineStyle}
                onClick={this.props.onClick} 
                onScroll={this._onScroll} >
                    {messages}
            </div> 
        );
    }
});

var Message = React.createClass({
    render: function(){
        var sentTime = new Date(this.props.data.sentTime);
        var timeNotation = sentTime.getHours() >=12 ? 'pm' : 'am';
        return (
            <div className="MsgContent">
                <div className="pure-u-5-24">
                    <UserAvatar avatar={this.props.data.avatar} isCircle={true} />
                </div>
                <div className="pure-u-18-24">
                    <div className="MsgSender">  
                        {this.props.data.nickName}
                    </div>
                    <div className="MsgText">  
                        {this.props.data.message}
                    </div>
                    <div className="MsgTime">  
                        {sentTime.getHours()%12+':'+sentTime.getMinutes()+' '+timeNotation}
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = DiscussionArea;
