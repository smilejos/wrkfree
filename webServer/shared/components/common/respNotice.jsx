var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible').Mixin;

/**
 * actions
 */
 var NavToBoard = require('../../../client/actions/draw/navToBoard');

/**
 * child components
 */
var NoticeMessage = require('./noticeMessage.jsx');

/**
 * @Author: George_Chen
 * @Description: the response notice component
 *         
 * @param {Object}      this.props.info, the notice info
 */
module.exports = React.createClass({
    mixins: [Router.Navigation, FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: handler for navigating to target workspace
     */
    _openWorkSpace: function() {
        this.executeAction(NavToBoard, {
            urlNavigator: this.transitionTo,
            channelId: this.props.info.extraInfo.channelId,
            boardId: 0
        });
    },
    
    /**
     * @Author: George_Chen
     * @Description: handler for opening hangout with target user
     */
    _openHangout: function() {
        // TODO:
    },
    
    /**
     * @Author: George_Chen
     * @Description: handler for showing current response notice message
     */
    _getNoticeMessage: function() {
        var type = this.props.info.type;
        var action = (this.props.info.respToPermitted ? 'approved' : 'rejected');
        if (type === 'channel') {
            return (action + ' your request on channel ');
        }
        return (action + ' your ' + type + ' request');
    },

    /**
     * @Author: George_Chen
     * @Description: handler for notice next action view
     */
    _getNoticeNextAction: function() {
        var handler = null;
        var actionTips = '';
        if (!this.props.info.respToPermitted) {
            return '';
        }
        if (this.props.info.type === 'channel') {
            handler = this._openWorkSpace;
            actionTips = 'WORKSPACE';
        } else if (this.props.info.type === 'friend') {
            handler = this._openHangout;
            actionTips = 'HANGOUT';
        }
        return (
            <div className="NoticeAction">
                <div className="action action-navigation"
                    onClick={handler} >
                    <span className="fa fa-angle-double-right" />
                    {actionTips}
                </div>
            </div>
        );
    },

    render: function() {
        return (
            <div>
                <NoticeMessage message={this._getNoticeMessage()}
                    title={this.props.info.sender.nickName}
                    date={new Date(this.props.info.updatedTime)}
                    extraInfo={this.props.info.extraInfo.name} />
                {this._getNoticeNextAction()}
            </div>
        );
    }
});
