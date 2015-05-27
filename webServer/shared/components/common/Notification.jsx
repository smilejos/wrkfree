var React = require('react');
var FluxibleMixin = require('fluxible').Mixin; 
var UserAvatar = require('./userAvatar.jsx');
var Mui = require('material-ui');
var IconButton = Mui.IconButton;


var ToggleStore = require('../../stores/ToggleStore');
/**
 * @Author: Jos Tung
 * @Description: an notification component to display notice message
 */
var Notification = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            'onStoreChange': [ToggleStore]
        }
    },

    // handler for handling the change of FriendStore
    onStoreChange: function(){

        var store = this.getStore(ToggleStore).getState();
        console.log("state",store.noticeVisiable);
        if (this.state.isVisible !== store.noticeVisiable) {
            this.setState({
                isVisible : store.noticeVisiable 
            }); 
        } else {
            return;
        }
    },

    getInitialState: function() {
        var store = this.getStore(ToggleStore).getState();
        return {
            isVisible : store.noticeVisiable,
            data : [
                {
                    reqId: '',
                    sender: 'bamoo456@gmail.com',
                    senderName: 'George',
                    senderAvatar: 'https://graph.facebook.com/10203820423178468/picture',
                    isNotification: true,
                    isReq: false,
                    extraInfo: ' Workfree channel was created.',
                    channelId : '',
                    sentTime: ''
                }, {
                    reqId: '',
                    sender: 'clearwindjos@gmail.com',
                    senderName: 'Jos',
                    senderAvatar: 'https://graph.facebook.com/333479400166173/picture',
                    isNotification: false,
                    isReq: true,
                    extraInfo: ' want to create friend relationship.',
                    channelId : '',
                    sentTime: ''
                }, {
                    reqId: '',
                    sender: 'Malachi1005@gmail.com',
                    senderName: 'Andrew',
                    senderAvatar: 'https://graph.facebook.com/Malachi1005/picture',
                    isNotification: false,
                    isReq: false,
                    extraInfo: ' agreed your friend invitation.',
                    channelId : '',
                    sentTime: ''
                }
            ]
        };
    },

    render: function(){
        var _NoticeList = this.state.data.map( function( notice, index ){
            return <Notices data={notice} />;
        });
        return (
            <div className={this.state.isVisible ? "Notification NotificationShow" : "Notification"}>
                {_NoticeList}
            </div>
        );
    }
});

var Notices = React.createClass({
    render: function(){
        return (
            <div className="Notice">
                <NoticeSender sender={this.props.data} />
                <NoticeContent content={this.props.data} />
            </div>
        )
    }
});

var NoticeSender = React.createClass({
   render: function(){
        return (
            <div className="NoticeSender">
                <UserAvatar avatar={this.props.sender.senderAvatar} isCircle={true} />
            </div>
        );
    } 
});

var NoticeContent = React.createClass({
    /**
     * @Author: Jos Tung
     * @Description: get the content with action
     */
    getResponse: function(){
        return (
            <div>
                <div className="NoticeMessage">
                    {this.props.content.extraInfo}
                </div>
                <div className="NoticeAction">
                    <span className="fa fa-check" /> Accept
                </div>
                <div className="NoticeAction">
                    <span className="fa fa-times" /> Cancel
                </div>
            </div>
        );
    },

    /**
     * @Author: Jos Tung
     * @Description: get the content only
     */
    getContent: function() {
        return (
            <div className="NoticeMessage">
                {this.props.content.extraInfo}
            </div>
        );
    },

    render: function(){
        return (
            <div className="NoticeContent">
                {this.props.content.isNotification ? this.getContent(): this.getResponse()}
            </div>
        );
    }
});

module.exports = Notification;
