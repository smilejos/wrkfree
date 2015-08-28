'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelService = require('../services/channelService');
var UserService = require('../services/userService');
var ActionUtils = require('./actionUtils');

var DELAY_QUERY_TIME_IN_MSECOND = 1000;
var hasQuery = false;

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user get dashboard channels based on time period
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      data.period, the query time period
 */
module.exports = function(actionContext, data) {
    if (hasQuery) {
        return;
    }
    hasQuery = true;
    return Promise.props({
        period: SharedUtils.setQueryPeriod(data.period)
    }).delay(DELAY_QUERY_TIME_IN_MSECOND).then(function(reqData) {
        return ChannelService.getAuthChannelsAsync(reqData);
    }).timeout(3000).map(function(doc) {
        return UserService.getInfoAsync(doc.channel.host)
            .then(function(hostInfo) {
                doc.hostInfo = hostInfo;
                return doc;
            });
    }).then(function(result) {
        actionContext.dispatch('ON_CHANNELS_APPENDED', {
            channels: result
        });
        hasQuery = false;
    }).catch(function(err) {
        hasQuery = false;
        SharedUtils.printError('getDashboardStream.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'get channels fail');
    });
};
