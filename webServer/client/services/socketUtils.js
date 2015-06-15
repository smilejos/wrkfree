'use strict';

/**
 * Public API
 * @Author: George_Chen
 * @Description: wrap request data to a formatted packet for remote handler
 *               
 * @param {String}          serviceName, the remote handler service type
 * @param {String}          serverApi, the server handler api
 * @param {String}          clientApi, the client receiver api
 * @param {Object}          data, the request parameters
 */
exports.setPacket = function(serviceName, serverApi, clientApi, data){
    return {
        service: serviceName,
        api: serverApi,
        clientHandler: clientApi,
        params: data
    };
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to create the channel subscription request
 *
 * @param {String}        channelId, channel's id
 */
exports.setChannelReq = function(channelId) {
    return 'channel:' + channelId;
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to create the channel subscription request
 *
 * @param {Function}      action, fluxible action
 * @param {Object}        data, the parameters for action
 * @param {String}        caller, the caller function name
 */
exports.execAction = function(action, data, caller) {
    if (typeof action !== 'function') {
        return console.error('abnormal on execAction by :', caller);
    }
    return window.context.executeAction(action, data);
};
