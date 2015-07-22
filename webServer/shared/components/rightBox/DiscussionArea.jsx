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

 /**
 * @Author: Jos Tung
 * @Description: a area for user cross-discuss in workspace
 *  NOTE: Use MessageStore to receive message from server
 */
var DiscussionArea = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [MessageStore]
        }
    },
    
    /**
     * @Author: Jos Tung
     * @Description: use this function to scroll-down div after component receive message
     */    
    componentDidUpdate: function(nextProps, nextState){
        var container = document.getElementById("MsgContainer");

        // if channel is not "reload message"
        // we don't auto scroll to bottom. 
        if( container.scrollTop != 0) {
            container.scrollTop = container.scrollHeight;    
        }
    },

    /**
     * @Author: George_Chen
     * @Description: only switch between different channels will trigger _pullLatestMessages
     */
    componentWillReceiveProps: function(nextProps) {
        var container = document.getElementById("MsgContainer");
        container.scrollTop = container.scrollHeight;
        if (this.props.channelId !== nextProps.channelId) {            
            this._pullLatestMessages(nextProps.channelId);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: start to load channel messages from server
     */
    componentDidMount: function(){
        var container = document.getElementById("MsgContainer");
        var channelId = this._getChannelId();
        this._pullLatestMessages(channelId);

        // Add scroll event listener to control reload message action.
        // We also use isReloading to avoid user duplicate reload message.
        container.addEventListener('scroll',function(e){
            if( e.srcElement.scrollTop == 0 && !this.state.isReloading) {
                this._pullOlderMessages();
                this.setState({ 
                    isReloading: true
                });
            }
        }.bind(this));
    },

    getInitialState: function() {
        return this._getStateFromStores();
    },

    onStoreChange: function(){
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
        var cid = this._getChannelId();
        var oldestMessage = this.getStore(MessageStore).getOldestMessage(cid);
        var timePeriod = {};
        if (oldestMessage) {
            timePeriod.end = oldestMessage.sentTime;
        }
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
    _pullMessages: function(cid, timePeriod){
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
                channelId: this._getChannelId(),
                message : this.refs.send.getValue(),
                from: selfInfo.uid
            };
            this.refs.send.clearValue();
            this.context.executeAction(SendMessageAction, message);
        }
    },

    _getChannelId: function(){
        return this.props.channelId;
    },

    _getStateFromStores: function () {
        return { 
            messages : this.getStore(MessageStore).getMessages(this._getChannelId()),
            isReloading : false
        };
    },

    render: function(){
        return (
            <div className="DiscussionArea" style={this.props.inlineStyle} >
                <ReloadImg isReload={this.state.isReloading} />
                <MessageList data={this.state.messages} isReload={this.state.isReloading} />
                <div className="DiscussionInput" >
                    <TextField 
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
        var divStyle = {
            opacity: this.props.isReload ? 1 : 0
        }
        return ( 
            <div className="ReloadImg" style={divStyle}>
                <CircularProgress size={0.4}  color={'#888'} />
            </div> 
        );
    }
});

var MessageList = React.createClass({
    render: function(){
        var inlineStyle = {
            top: this.props.isReload ? 40 : 0
        }
        var messages = this.props.data.map( function( message ){
            return <Message key={message.sentTime} data={message} />;
        });
        return ( 
            <div className="MsgContainer" id="MsgContainer" style={inlineStyle}>
                {messages}
            </div> 
        );
    }
});

var Message = React.createClass({
    render: function(){
        var sentTime = new Date(this.props.data.sentTime);
        var timeNotation = sentTime.getHours() >=12 ? 'pm' : 'am';
        console.log('sentTime', sentTime);
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
