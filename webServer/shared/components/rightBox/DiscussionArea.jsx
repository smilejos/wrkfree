var React = require('react');
var UserAvatar = require('../common/userAvatar.jsx');
/**
 * material ui components
 */
var Mui = require('material-ui');
var TextField = Mui.TextField;

/**
 * the workspace.jsx is the main container of each channel
 */
var DiscussionArea = React.createClass({
    getInitialState: function() {
        return { 
            message : '',
            messageList: [
            {
                avatar: "https://graph.facebook.com/333479400166173/picture",
                sender : 'Jos',
                message : 'Hello, world.',
                timestamp: new Date(2015,4,13,13,21,12)
            } , {
                avatar: "https://graph.facebook.com/Malachi1005/picture",
                sender : 'Grogre',
                message : 'Say something',
                timestamp: new Date(2015,4,13,13,23,35)
            }
        ]};
    },

    _handleKeyDown: function(e){
        if( e.which === 13 ) {
            var _list = this.state.messageList;
            _list.push({
                avatar: "https://graph.facebook.com/333479400166173/picture",
                sender: 'Jos',
                message : this.refs.send.getValue(),
                timestamp: new Date()
            });
            this.refs.send.clearValue();
            this.setState({messageList: _list});
        }
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
        return <div>{_MessageList}</div>;
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
                    <MsgHead sender={this.props.data.sender}/>
                    <MsgText message={this.props.data.message}/>
                    <MsgTime time={this.props.data.timestamp}/>
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