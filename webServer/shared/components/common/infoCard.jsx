var React = require('react');
var Router = require('react-router');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;

/**
 * actions
 */
var SendChannelReq = require('../../../client/actions/channel/sendChannelReq');
var SendFriendReq = require('../../../client/actions/friend/sendFriendReq');
var CheckChannelReq = require('../../../client/actions/channel/checkChannelReq');
var CheckFriendReq = require('../../../client/actions/friend/checkFriendReq');
var OpenHangout = require('../../../client/actions/openHangout');

/**
 * stores
 */
var InfoCardStore = require('../../stores/InfoCardStore');
var HeaderStore = require('../../stores/HeaderStore');

/**
 * @Author: George_Chen
 * @Description: the main component of infoCard, the card state is stored at infoCardStore
 *         
 * @param {String}       props.cardId, the info card id
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin, Router.Navigation],
    statics: {
        storeListeners: {
            '_onStoreChange': [InfoCardStore],
        }
    },

    /**
     * @Author: George_Chen
     * @Description: set and get the cover image of info card
     */
    _getCoverImgUrl: function(url){
        if (url.search('facebook') !== -1) {
            return (url + '?width=150&height=150');
        }
        return url.replace(/sz=50/, 'sz=150');
    },

    /**
     * @Author: George_Chen
     * @Description: polyfill the extra info on infoCard
     */
    _setExtraInfo: function() {
        var info = this.state.extraInfo;
        if (!info) {
            return '';
        }
        return <div className="extraInfoContent"> {info} </div>
    },

    /**
     * @Author: George_Chen
     * @Description: button info for sending channel requst
     */
    _sendChannelReq: function(){
        return {
            value: 'Ask to Join',
            style: 'fa fa-envelope-o',
            handler: function(cardInfo){
                if (this.state.isReqSent !== null) {
                    this.executeAction(SendChannelReq, {
                        targetUser: cardInfo.targetUid,
                        channelId: cardInfo.channelId
                    });
                }
            }
        };
    },

    /**
     * @Author: George_Chen
     * @Description: button info for sending friend requst
     */
    _sendFriendReq: function(){
        return {
            value: 'Add Friend',
            style: 'fa fa-user-plus',
            handler: function(cardInfo){
                if (this.state.isReqSent !== null) {
                    this.executeAction(SendFriendReq, {
                        targetUser: cardInfo.targetUid
                    });
                }
            }
        };
    },

    /**
     * @Author: George_Chen
     * @Description: button info for enter WorkSpace
     */
    _enterWorkSpace: function() {
        return {
            value: 'WorkSpace',
            style: 'fa fa-sign-in',
            handler: function(cardInfo){
                this.transitionTo('/app/workspace/' + cardInfo.channelId);
            }
        };
    },

    /**
     * @Author: George_Chen
     * @Description: button info for open Hangout
     */
    _openHangout: function() {
        return {
            value: 'Hangout',
            style: 'fa fa-comments-o',
            handler: function(cardInfo){
                var selfUid = this.getStore(HeaderStore).getSelfInfo().uid;
                this.executeAction(OpenHangout, {
                    channelId: SharedUtils.get1on1ChannelId(cardInfo.targetUid, selfUid),
                    hangoutTitle: cardInfo.nickName
                });
            }
        };
    },

    /**
     * @Author: George_Chen
     * @Description: get the button info and its handler
     *
     * @param {String}      infoType, the type of info card
     *                      NOTE: "channel" or "user"
     * @param {String}      btnType, the type of button
     *                      NOTE: "request" or "allowed"
     */
    _getBtnInfo: function(infoType, btnType) {
        var btnInfo = {
            channel: {
                request: this._sendChannelReq,
                allowed: this._enterWorkSpace
            },
            user: {
                request: this._sendFriendReq,
                allowed: this._openHangout
            }
        };
        if (typeof btnInfo[infoType][btnType] !== 'function') {
            return {};
        }
        return btnInfo[infoType][btnType]();
    },

    /**
     * @Author: George_Chen
     * @Description: to get the card state from infoCardStore
     */
    _getCardState: function() {
        var cardId = this.props.cardId;
        return this.getStore(InfoCardStore).getCardState(cardId);
    },

    _onStoreChange: function() {
        var state = this._getCardState();
        this.setState(state);
    },

    getInitialState: function() {
        return this._getCardState();
    },

    /**
     * check the button state should be disabled or not based on
     * the request has been sent or not
     */
    componentDidMount: function(){
        if (this.state.isKnown) {
            return;
        }
        var reqData = {
            cardId: this.props.cardId,
            targetUid: this.state.targetUid,
        };
        if (this.state.type === 'channel') {
            reqData.channelId = this.state.channelId;
            return this.executeAction(CheckChannelReq, reqData);
        }
        return this.executeAction(CheckFriendReq, reqData);
    },

    render: function() {
        var classSet = React.addons.classSet;
        var cardInfo = this.state;
        var coverImgSrc = this._getCoverImgUrl(cardInfo.avatar);
        var infoType = (cardInfo.type === 'user' ? 'user' : 'channel');
        var btnType = (cardInfo.isKnown ? 'allowed' : 'request');
        var btnInfo = this._getBtnInfo(infoType, btnType);
        var cardStyle = {
            'button-request': !cardInfo.isKnown,
            'button-allowed': cardInfo.isKnown,
            'pure-button-disabled': (!cardInfo.isKnown && cardInfo.isReqSent),
            'pure-button': true,
        };
        return (
            <div className="InfoCard" >
                <Paper zDepth={1} rounded={false} >
                    <img src={coverImgSrc} width="147" height="147"/>
                    <Paper zDepth={0} className="infoCardContent">
                        <div>{'@'+cardInfo.nickName}</div>
                        {this._setExtraInfo()}
                    </Paper>
                    <button className={classSet(cardStyle)}
                            onClick={btnInfo.handler.bind(this, cardInfo)} >
                        <i className={btnInfo.style}></i>
                        &nbsp;
                        {btnInfo.value}
                    </button>
                </Paper>
            </div>
        );
    }
});
