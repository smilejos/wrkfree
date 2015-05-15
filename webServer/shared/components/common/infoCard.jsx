var React = require('react');
var FluxibleMixin = require('fluxible').Mixin;

/**
 * material UI compoents
 */
var Mui = require('material-ui');
var Paper = Mui.Paper;


/**
 * @Author: George_Chen
 * @Description: the main component of infoCard
 *         NOTE: the type should only be "user" or "channel"
 *         
 * @param {String}       props.targetInfo.avatar, the target avatarUrl
 * @param {String}       props.targetInfo.nickName, the target nickName
 * @param {String}       props.targetInfo.type, the type of this info card
 * @param {Boolean}      props.targetInfo.isKnown, indicate target is known or not
 * @param {String}       props.targetInfo.extraInfo, the extra information of this target
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

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
        var info = this.props.targetInfo.extraInfo;
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
            handler: function(){
                // TODO:
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
            handler: function(){
                // TODO:
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
            handler: function(){
                // TODO:
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
            handler: function(){
                // TODO:
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

    render: function() {
        var classSet = React.addons.classSet;
        var coverImgSrc = this._getCoverImgUrl(this.props.targetInfo.avatar);
        var infoType = (this.props.targetInfo.type === 'user' ? 'user' : 'channel');
        var btnType = (this.props.targetInfo.isKnown ? 'allowed' : 'request');
        var btnInfo = this._getBtnInfo(infoType, btnType);
        var cardStyle = {
            'button-request': !this.props.targetInfo.isKnown,
            'button-allowed': this.props.targetInfo.isKnown,
            'pure-button': true,
        };
        return (
            <div className="InfoCard" >
                <Paper zDepth={1} rounded={false} >
                    <img src={coverImgSrc} width="147" height="147"/>
                    <Paper zDepth={0} className="infoCardContent">
                        <div>{'@'+this.props.targetInfo.nickName}</div>
                        {this._setExtraInfo()}
                    </Paper>
                    <button className={classSet(cardStyle)}
                            onClick={btnInfo.handler} >
                        <i className={btnInfo.style}></i>
                        &nbsp;
                        {btnInfo.value}
                    </button>
                </Paper>
            </div>
        );
    }
});
