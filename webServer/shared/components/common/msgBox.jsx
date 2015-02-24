var Msg = require('./msg.jsx');
var React = require('react');

/**
 * @Author: George_Chen
 * @Description: MsgBox React Component
 */
var MsgBox = React.createClass({
    render: function(){
        return (
            <div className="MsgBox">
                <MsgBoxHeader header={this.props.header}/>
                <MsgList msgList={this.props.msgs}/>
                <hr/>
                <InputArea />
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: MsgBox header React Component
 * NOTE: currently just used purecss to control the layout
 */
var MsgBoxHeader = React.createClass({
    render: function() {
        return (
            <div className="MsgBoxHeader">
                <div className="pure-u-3-4">{this.props.header}</div>
                <div className="pure-u-1-4"> 
                    <div className="pure-u-1-3"> 
                        <div className="fa fa-video-camera"></div>
                    </div>
                    <div className="pure-u-1-3"> 
                        <div className="fa fa-paperclip"></div>
                    </div>
                    <div className="pure-u-1-3"> 
                        <div className="fa fa-close"></div>
                    </div>
                </div>
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: MsgList React Component
 */
var MsgList = React.createClass({
    render: function(){
        var msgs = this.props.msgList;
        var msgItems = msgs.map(function(item){
            return <Msg 
                avatar={item.avatar} 
                content={item.contents} 
                timestamp={item.timestamp} 
                sender={item.sender}/>
        }, this);
        return (
            <div className="MsgList">
                {msgItems}
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: MsgInput React Component
 */
var InputArea = React.createClass({
    render: function(){
        return (
            <form className="pure-form InputArea">
                <input className="pure-input-2-3 InputBox" type="text" placeholder="Enter you message ..."/>
                <button className="pure-button msgSubmitButton">send</button>
            </form>
        );
    }
});

module.exports = MsgBox;