var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');


/**
 * generate the full route prefix for backend routing
 */
var RoutePrefix = {
    draw: 'drawing.drawingHandler.',
    chat: 'chat.chatHandler.',
    rtc: 'rtc.rtcHandler.',
    connector: 'connector.entryHandler.',
    globalMgr: 'globalMgr.globalMgrHandler.'
};

/************************************************
 *
 *            Public APIs
 *
 ************************************************/

/**
 * @Public API
 * @Author: George_Chen
 * @Description: call the remote server api by socket
 *
 * @param {String}      srvType, the target server type on backend
 * @param {String}      api, the api of target server
 * @param {Object}      param, param object to sent
 */
exports.sendAsync = function(srvType, api, param) {
    return Promise.join(
        getRouteAsync(srvType, api),
        paramCheckAsync(srvType, param),
        function(route, validParam) {
            return new Promise(function(resolve) {
                Pomelo.request(route, param, resolve);
            });
        }).then(function(data) {
            if (!!data.error) {
                throw new Error('[sendAsync] ', data.error);
            }
            return data;
        }).catch(function(err) {
            console.log('[sendAsync] ', err);
            return null;
        });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: notifyt the remote server without waitting for callback
 *
 * @param {String}      srvType, the target server type on backend
 * @param {String}      api, the api of target server
 * @param {Object}      param, param object to sent
 */
exports.notifyAsync = function(srvType, api, param) {
    return Promise.join(
        getRouteAsync(srvType, api),
        paramCheckAsync(srvType, param),
        function(route, validParam) {
            return new Promise(function(resolve) {
                Pomelo.notify(route, param);
                return;
            });
        }).catch(function(err) {
            console.log('[notify] ', err);
            return null;
        });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: add the server event handler
 *
 * @param {String}      evt, socket event
 * @param {Function}    listner, socket listner function
 */
exports.addListner = function(evt, listner) {
    if (!SharedUtils.isString(evt)) {
        return console.log('[addListner] evt type is invalid');
    }
    if (!SharedUtils.isFunction(listner)) {
        return console.log('[addListner] listner is not function');
    }
    Pomelo.on(evt, listner);
};

/************************************************
 *
 *            internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: get the overall "route" based on server type and api
 *
 * @param {String}      srvType, the target server type on backend
 * @param {String}      api, the api of target server
 */
function getRouteAsync(srvType, api) {
    return Promise.try(function() {
        if (!!RoutePrefix[srvType]) {
            return RoutePrefix[srvType] + api;
        }
        throw new Error('[getRouteAsync] srvType %s is not support ! ', srvType);
    });
}

/**
 * @Author: George_Chen
 * @Description: get the overall "route" based on server type and api
 *
 * @param {String}      srvType, the target server type on backend
 * @param {Object}      param, param object to sent
 */
function paramCheckAsync(srvType, param) {
    return Promise.try(function() {
        if (!SharedUtils.isMd5Hex(param.rid)) {
            if (srvType !== 'connector' && srvType !== 'globalMgr') {
                throw new Error('[paramCheckAsync] param is broken');
            }
        }
        return param;
    });
}
