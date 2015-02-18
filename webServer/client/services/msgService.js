var SharedUtils = require('../../../sharedUtils/utils');
var Socket = require('./socket');
var ServerType = 'chat';

/**
 * @Public API
 * @Author: George_Chen
 * @Description: send chat msg to current channel
 *
 * @param {String}      channelId, channel's id
 * @param {String}      msgContent, channel's id
 */
exports.sendMsg = function(channelId, msgContent) {
    var param = {
        rid: channelId,
        contents: msgContent
    };
    return Socket.sendAsync(ServerType, 'sendMessage', param)
        .then(function(data) {
            if (!SharedUtils.isNumber(data.timestamp)) {
                console.log('[sendAsync] server reply is broken');
                return false;
            }
            return data.timestamp;
        });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: get previous msg of specific channel
 *
 * @param {String}      channelId, channel's id
 * @param {Object}      duration, the msg query duration
 * NOTE: duration (optional), used to query msgs in the duration
 *      duration.end:   the end time of the duration
 *      duration.start: the begin time of the duration
 */
exports.getPrevMsgs = function(channelId, duration) {
    var param = {
        rid: channelId,
        time: duration
    };
    return Socket.sendAsync(ServerType, 'pullMsg', param)
        .then(function(data) {
            if (!SharedUtils.isArray(data.prevMsgs)) {
                console.log('[getPrevMsgs] prevMsgs is broken');
                return [];
            }
            Socket.notifyAsync(ServerType, 'msgsAck', param);
            return data.prevMsgs;
        });
};