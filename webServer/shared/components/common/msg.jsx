var UserAvatar = require('./userAvatar.jsx');
var React = require('react');

/**
 * @Author: George_Chen
 * @Description: Msg React Component
 */
var Msg = React.createClass({
    /**
     * @Author: George_Chen
     * @Description: get the avatar wrapped div
     */
    getUserAvatar: function(){
        return (
            <div className="pure-u-3-24">
                <UserAvatar avatar={this.props.avatar}/>
            </div>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: get the msg content wrapped div
     */
    getMsgContent: function() {
        var contentStyle = (this.props.sender==='self') ? 'right' : 'left' ;
        return (
            <div className="pure-u-20-24">
                <MsgContent msgContent={this.props.content} time={this.props.timestamp} style={contentStyle}/>
            </div>
        );
    },

    render: function(){
        var sender = this.props.sender;
        return (
            <div className="Msg">
                {(sender==='self') ? this.getMsgContent(): this.getUserAvatar()}
                {(sender==='self') ? this.getUserAvatar(): this.getMsgContent()}
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: Msg Content of React Component
 */
var MsgContent = React.createClass({
    render: function(){
        var contentClass = 'bubble '+this.props.style;
        var timeStyle = (this.props.style==='left') ? 'right' : 'left';
        return (
            <div className="MsgContent">
                <span className={contentClass}>
                    <span className='tail'>&nbsp;</span>
                    <div>{this.props.msgContent}</div>
                    <MsgTime time={this.props.time} style={timeStyle}/>
                </span>
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: Msg Time of React Component
 * NOTE: currently used 12-hour format
 */
var MsgTime = React.createClass({
    render: function(){
        var d = new Date(this.props.time);
        var timeNotation = (d.getHours()>=12) ? 'PM' : 'AM'
        var inlineStyle = {
            'textAlign': this.props.style
        };
        return (
            <div className="MsgTime" style={inlineStyle}>
                {d.getHours()%12+':'+d.getMinutes()+' '+timeNotation}
            </div>
        );
    }
});

module.exports = Msg;