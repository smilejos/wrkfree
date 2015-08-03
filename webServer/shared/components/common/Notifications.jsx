var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin'); 

var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * stores
 */
var NotificationStore = require('../../stores/NotificationStore');

/**
 * child components
 */
var UserAvatar = require('./userAvatar.jsx');
var NormalNotice = require('./normalNotice.jsx');
var ReqNotice = require('./reqNotice.jsx');
var RespNotice = require('./respNotice.jsx');

/**
 * @Author: Jos Tung
 * @Description: an notification component to display notice message
 * 
 * LAST UPDATED: George_Chen
 */
var Notification = React.createClass({
    mixins: [FluxibleMixin],
    statics: {
        storeListeners: {
            '_onStoreChange': [NotificationStore]
        }
    },

    _getStoreState: function() {
        return this.getStore(NotificationStore).getState();
    },

    _onStoreChange: function(){
        var state = this._getStoreState();
        this.setState(state);
    },

    getInitialState: function() {
        return this._getStoreState();
    },

    render: function(){
        var notifications = this.state.notifications;
        var list = SharedUtils.fastArrayMap(notifications, function(info) {
            return <Notices key={info.reqId} info={info} />
        });
        return (
            <div className={this.state.isActive ? "Notification NotificationShow" : "Notification"}>
                {list}
            </div>
        );
    }
});

/**
 * @Author: George_Chen
 * @Description: the main notice component
 *         
 * @param {Object}      this.props.info, the notice info
 */
var Notices = React.createClass({
    getInitialState: function() {
        return {
           isTimeVisible : true 
        };
    },
    /**
     * @Author: George_Chen
     * @Description: handler for hiding timestamp
     */
    _hideTimestamp: function() {
        this.setState({
            isTimeVisible: false
        });
    },

    /**
     * @Author: George_Chen
     * @Description: handler for show timestamp
     */
    _showTimestamp: function() {
        this.setState({
            isTimeVisible: true
        });
    },

    render: function(){
        var info = this.props.info;
        var isReq = info.isReq;
        var noticeContent = '';
        info.isTimeVisible = this.state.isTimeVisible;
        if (info.isNotification) {
            noticeContent = (<NormalNotice info={info} />);
        } else {
            noticeContent = (isReq ? <ReqNotice info={info} /> : <RespNotice info={info} />);
        }
        return (
            <div className="Notice" onMouseEnter={this._hideTimestamp} onMouseLeave={this._showTimestamp} >
                <div className="NoticeSender">
                    <UserAvatar avatar={this.props.info.sender.avatar} isCircle={true} />
                </div>
                <div className="NoticeContent">
                    {noticeContent}
                </div>
            </div>
        );
    }
});

module.exports = Notification;
