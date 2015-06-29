'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var RtcService = require('../../services/rtcService');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to control rtc media (video/audio) on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.isVideo, the channel id
 * @param {Boolean}     data.isOn, the channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        isVideo: SharedUtils.argsCheckAsync(data.isVideo, 'boolean'),
        isOn: SharedUtils.argsCheckAsync(data.isOn, 'boolean'),
    }).then(function(reqData) {
        return RtcService.controlMediaAsync(reqData);
    }).catch(function(err) {
        SharedUtils.printError('controlMedia.js', 'core', err);
        ActionUtils.showWarningEvt('RTC', 'control rtc media fail');
    });
};
