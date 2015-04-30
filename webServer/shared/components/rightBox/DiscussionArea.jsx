var React = require('react');
var FluxibleMixin = require('fluxible').Mixin; 

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
 * material ui components
 */
var Mui = require('material-ui');
var TextField = Mui.TextField;

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
        container.scrollTop = container.scrollHeight;
    },

    /**
     * @Author: George_Chen
     * @Description: only switch between different channels will trigger pullMessages
     */
    componentWillReceiveProps: function(nextProps) {
        if (this.props.channel.channelId !== nextProps.channel.channelId) {
            this._pullMessages(nextProps.channel.channelId);
        }
    },

    /**
     * @Author: George_Chen
     * @Description: start to load channel messages from server
     */
    componentDidMount: function(){
        this._pullMessages(this._getChannelId());
    },

    getInitialState: function() {
        return this._getStateFromStores();
    },

    onStoreChange: function(){
        var state = this._getStateFromStores();
        this.setState(state);
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
        return this.props.channel.channelId;
    },

    _getStateFromStores: function () {
        return { 
            messageList : this.getStore(MessageStore).getMessages(this._getChannelId()) 
        };
    },

    render: function(){
        return (
            <div className="infoBox" >
                <MessageList data={this.state.messageList} />
                <div className="DiscussionArea" >
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

var MessageList = React.createClass({
    render: function(){
        var _MessageList = this.props.data.map( function( message ){
            return <Message data={message} />;
        });
        return ( 
            <div className="MsgContainer" id="MsgContainer">
                {_MessageList}
            </div> 
        );
    }
});

var Message = React.createClass({
    render: function(){
        return (
            <div className="MsgContent">
                <div className="pure-u-5-24">
                    <UserAvatar avatar={this.props.data.avatar} isCircle={true} />
                </div>
                <div className="pure-u-18-24">
                    <MsgHead sender={this.props.data.nickName}/>
                    <MsgText message={this.props.data.message}/>
                    <MsgTime time={this.props.data.sentTime}/>
                </div>
            </div>
        );
    }
});

var MsgHead = React.createClass({
    render: function(){
        return (
            <div className="MsgSender">  
                {this.props.sender}
            </div>
        );
    }
});

var MsgText = React.createClass({
    render: function(){
        return (
            <div className="MsgText">  
                {this.props.message}
            </div>
        );
    }
});

var MsgTime = React.createClass({
    render: function(){
        var d = new Date(this.props.time);
        var timeNotation = (d.getHours()>=12) ? 'pm' : 'am'
        return (
            <div className="MsgTime">  
                {d.getHours()%12+':'+d.getMinutes()+' '+timeNotation}
            </div>
        );
    }
});

module.exports = DiscussionArea;
