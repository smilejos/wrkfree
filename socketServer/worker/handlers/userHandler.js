'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var StorageManager = require('../../../storageService/storageManager');
var UserStorage = StorageManager.getService('User');
var ReqRespStorage = StorageManager.getService('ReqResp');

/**
 * Public API
 * @Author: George_Chen
 * @Description: handle the request of getting user info
 *
 * @param {Object}          socket, the client socket instance
 * @param {Array/String}    data.users, array of uids or single uid
 */
exports.getInfoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.try(function() {
        if (SharedUtils.isMd5Hex(data.users)) {
            return UserStorage.getUserAsync(data.users);
        }
        var list = SharedUtils.fastArrayMap(data.users, function(user) {
            if (SharedUtils.isMd5Hex(user)) {
                return user;
            }
            throw new Error('data.users params error');
        });
        return UserStorage.getUserAsync(list, uid);
    }).then(function(result) {
        if (result === null) {
            throw new Error('get user info fail on storage service');
        }
        if (!result || result.length === 0) {
            throw new Error('user not exist');
        }
        return result;
    }).catch(function(err) {
        SharedUtils.printError('userHandler.js', 'getInfoAsync', err);
        throw new Error('get user info fail');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get user self information
 */
exports.getSelfInfoAsync = function(socket) {
    var uid = socket.getAuthToken();
    return UserStorage.getUserAsync(uid, true)
        .then(function(result) {
            if (result === null) {
                throw new Error('get user self info fail on storage service');
            }
            return result;
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'getSelfInfoAsync', err);
            throw new Error('get user self info fail');
        });
};

/**
 * TODO: currently only support reqResp like notifications
 * Public API
 * @Author: George_Chen
 * @Description: get user notifications with read or unread.
 *         NOTE: if data.isReaded is not set, default will query all notifications
 *
 * @param {Object}          socket, the client socket instance
 * @param {Boolean}         data.isReaded, notification status (optional)
 */
exports.getNotificationsAsync = function(socket, data) {
    return Promise.try(function() {
        if (data.isReaded === 'undefined') {
            return data.isReaded;
        }
        return SharedUtils.argsCheckAsync(data.isReaded, 'boolean');
    }).then(function(isReadedFlag) {
        var uid = socket.getAuthToken();
        return Promise.props({
            reqResps: ReqRespStorage.getReqRespAsync(uid, isReadedFlag),
            notifications: UserStorage.getNotificationsAsync(uid)
        });
    }).then(function(notifications) {
        var errMsg = 'fail to get user notifications on storage service';
        return SharedUtils.checkExecuteResult(notifications, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('userHandler.js', 'getNotificationsAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to reset unread notice counts on header;
 *
 * @param {Object}          socket, the client socket instance
 */
exports.resetUnreadNoticeAsync = function(socket) {
    var uid = socket.getAuthToken();
    return UserStorage.resetUnreadNoticeAsync(uid)
        .then(function(result) {
            var errMsg = 'reset user unread notifications fail on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'resetUnreadNoticeAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to set his/her dashboard layout
 *
 * @param {Object}          socket, the client socket instance
 * @param {Boolean}         data.isDashboardGrid, to indicate layout is grid or not
 */
exports.setDashboardLayoutAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.isDashboardGrid, 'boolean')
        .then(function(isGrid) {
            var uid = socket.getAuthToken();
            return UserStorage.setDashboardLayoutAsync(uid, isGrid);
        }).then(function(result) {
            var errMsg = 'fail to set user dashboard layout on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'resetUnreadNoticeAsync', err);
            throw err;
        });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to hide the default tourguide state on current user 
 *
 * @param {Object}          socket, the client socket instance
 */
exports.hideDefaultTourAsync = function(socket) {
    var uid = socket.getAuthToken();
    return UserStorage.setDefaultTourAsync(uid, true)
        .then(function(result) {
            var errMsg = 'fail to set user default tour state on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'hideDefaultTourAsync', err);
            throw err;
        });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to get the default tourguide state on current user 
 *
 * @param {Object}          socket, the client socket instance
 */
exports.getDefaultTourStateAsync = function(socket) {
    var uid = socket.getAuthToken();
    return Promise.props({
        isHidden: UserStorage.isDefaultTourHiddenAsync(uid)
    }).then(function(result) {
        if (result.isHidden === null) {
            throw new Error('fail to check user default tour state on storage service');
        }
        return result;
    }).catch(function(err) {
        SharedUtils.printError('userHandler.js', 'getDefaultTourStateAsync', err);
        throw err;
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: handle the client's opinion and send it to slack channel
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}      data.message, the content of this message
 */
exports.clientReportAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.message, 'string')
        .then(function(msg) {
            var uid = socket.getAuthToken();
            return UserStorage.getUserAsync(uid)
                .then(function(info) {
                    if (info === null) {
                        throw new Error('get user info fail');
                    }
                    LogUtils.info('REPORT', null, '[' + uid + '][' + info.nickName + '] says: ' + msg);
                });
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'clientReportAsync', err);
            throw err;
        });
};
