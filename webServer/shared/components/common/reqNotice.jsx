var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
 var ReplyChannelReq = require('../../../client/actions/channel/replyChannelReq');
 var ReplyFriendReq = require('../../../client/actions/friend/replyFriendReq');

/**
 * child components
 */
var NoticeMessage = require('./noticeMessage.jsx');

/**
 * @Author: George_Chen
 * @Description: the request notice component
 *         
 * @param {Object}      this.props.info, the notice info
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: to send 'true' for current request
     */
    _accpet: function() {
        return this._sendResp(true);
    },

    /**
     * @Author: George_Chen
     * @Description: to send 'false' for current request
     */
    _reject: function() {
        return this._sendResp(false);
    },

    /**
     * @Author: George_Chen
     * @Description: handler for execute response related actions
     *
     * @param {Boolean}      respToPermitted, the answer of current request
     */
    _sendResp: function(respToPermitted) {
        var data = {
            id: this.props.info.reqId,
            target: this.props.info.sender.uid,
            permit: respToPermitted
        };
        if (this.props.info.type === 'channel') {
            data.channelId = this.props.info.extraInfo.channelId;
            this.executeAction(ReplyChannelReq, data);
        }
        if (this.props.info.type === 'friend') {
            this.executeAction(ReplyFriendReq, data);
        }
    },

    render: function() {
        var message = '';
        if (this.props.info.type === 'channel') {
            message = 'want to join your channel';
        } else if (this.props.info.type === 'friend') {
            message = 'want to be your friend';
        }
        return (
            <div>
                <NoticeMessage message={message}
                    title={this.props.info.sender.nickName}
                    date={new Date(this.props.info.updatedTime)}
                    isTimeVisible={this.props.info.isTimeVisible}
                    emphasis={this.props.info.extraInfo.name} />
                <div className="NoticeAction">
                    <div className="action action-accept"
                        onClick={this._accpet} >
                        <span className="fa fa-check" /> ACCEPT
                    </div>
                    <div className="action action-reject"
                        onClick={this._reject} >
                        <span className="fa fa-times" /> REJECT
                    </div>
                </div>
            </div>
        );
    }
});
