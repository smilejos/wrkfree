'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var Model = Mongoose.model('ReqResp');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to create a rquest document
 *
 * @param {String}          reqUser, the uid of req uesr
 * @param {String}          targetUser, the uid of target user
 * @param {String}          reqType, request type
 * @param {String}          info, extra information
 */
exports.saveReqAsync = function(reqUser, targetUser, reqType, info) {
    return Promise.props({
        _id: Mongoose.Types.ObjectId().toString(),
        sender: SharedUtils.argsCheckAsync(reqUser, 'md5'),
        target: SharedUtils.argsCheckAsync(targetUser, 'md5'),
        type: reqType,
        extraInfo: _checkInfo(reqType, info)
    }).then(function(doc) {
        return new Model(doc);
    }).then(function(newReq) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return newReq.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'saveReqAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find all request and response based on target user id
 *
 * @param {String}          targetUser, the uid of target user
 * @param {Boolean}         isReaded, the isReaded flag (optional)
 */
exports.findByTargetAsync = function(targetUser, isReaded) {
    return Promise.props({
        target: SharedUtils.argsCheckAsync(targetUser, 'md5')
    }).then(function(condition) {
        if (SharedUtils.isBoolean(isReaded)) {
            condition.isReaded = isReaded;
        }
        var fields = {
            __v: DbUtil.select(false)
        };
        var sortOrder = DbUtil.getSort('updatedTime', 'descending');
        return Model.find(condition).sort(sortOrder).select(fields).lean().execAsync();
    }).map(function(doc) {
        return DbUtil.transformToNewIdAsync(doc, 'reqId');
    }).map(function(doc) {
        return DbUtil.transformTimeAsync(doc, 'updatedTime');
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'findByTargetAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to find specific friend request
 *
 * @param {String}          reqUser, the uid of req uesr
 * @param {String}          targetUser, the uid of target user
 */
exports.findFriendReqAsync = function(reqUser, targetUser) {
    return Promise.props({
        sender: SharedUtils.argsCheckAsync(reqUser, 'md5'),
        target: SharedUtils.argsCheckAsync(targetUser, 'md5'),
        type: 'friend',
        isReq: true
    }).then(function(condition) {
        var fields = {
            __v: DbUtil.select(false)
        };
        return Model.findOne(condition).select(fields).lean().execAsync();
    }).then(function(doc) {
        return (doc ? DbUtil.transformToNewIdAsync(doc, 'reqId') : null);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'findFriendReqAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check certain type of request has been sent or not
 *         e.g. we can check friend/channel request has been sent or not
 *
 * @param {String}          reqUser, the uid of req uesr
 * @param {String}          targetUser, the uid of target user
 * @param {String}          reqType, request type
 * @param {String}          info, extra information
 */
exports.isReqSentAsync = function(reqUser, targetUser, reqType, info) {
    return Promise.props({
        sender: SharedUtils.argsCheckAsync(reqUser, 'md5'),
        target: SharedUtils.argsCheckAsync(targetUser, 'md5'),
        type: reqType,
        extraInfo: _checkInfo(reqType, info),
        isReq: true
    }).then(function(condition) {
        return _exist(condition);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'isReqSentAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check replier is auth to reply or not
 *
 * @param {String}          reqId, the request id
 * @param {String}          replier, the replier uid
 */
exports.isReplierAuthAsync = function(reqId, replier) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(reqId, '_id'),
        target: SharedUtils.argsCheckAsync(replier, 'md5'),
    }).then(function(condition) {
        return _exist(condition);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'isReplierAuthAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update target user's request and response to readed
 *
 * @param {String}          targetUser, the uid of target user
 */
exports.updateToAllReadedAsync = function(targetUser) {
    return Promise.props({
        target: SharedUtils.argsCheckAsync(targetUser, 'md5'),
        isReaded: false
    }).then(function(condition) {
        var updateDoc = {
            isReaded: true
        };
        return _update(condition, updateDoc, true);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'updateToAllReadedAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update current reqresp document to readed status
 *
 * @param {String}          reqId, the _id of reqresp document
 * @param {String}          targetUser, the uid of target user
 */
exports.updateToReadedAsync = function(reqId, targetUser) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(reqId, '_id'),
        target: SharedUtils.argsCheckAsync(targetUser, 'md5')
    }).then(function(condition) {
        var updateDoc = {
            isReaded: true,
            updatedTime: Date.now()
        };
        return _update(condition, updateDoc);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'updateToReadedAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used for user to reply any request sent to him or her
 *         NOTE: this API will transform the original request docuemnt
 *               into a new response document
 *         
 * @param {String}          reqId, the _id of reqresp document
 * @param {String}          replier, the uid of request replier
 * @param {String}          originalSender, the uid of request sender
 * @param {Boolean}         respToPermitted, the reply answer
 */
exports.updateToRespAsync = function(reqId, replier, originalSender, respToPermitted) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(reqId, '_id'),
        sender: SharedUtils.argsCheckAsync(originalSender, 'md5'),
        target: SharedUtils.argsCheckAsync(replier, 'md5'),
        isReq: true
    }).then(function(condition) {
        var updateDoc = {
            sender: condition.target,
            target: condition.sender,
            respToPermitted: !!respToPermitted,
            isReq: false,
            isReaded: false,
            updatedTime: Date.now()
        };
        return _update(condition, updateDoc);
    }).catch(function(err) {
        SharedUtils.printError('ReqRespDao', 'updateToRespAsync', err);
        throw err;
    });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: used to check specific docuemnt is exist or not
 *
 * @param {Object}      condition, the update query condition
 */
function _exist(condition) {
    return Model.count(condition).execAsync()
        .then(function(count) {
            return DbUtil.checkDocumentExistStatusAsync(count);
        });
}

/**
 * @Author: George_Chen
 * @Description: an update implementation for each update public api
 *
 * @param {Object}      condition, the update query condition
 * @param {Object}      updateDoc, update json object
 * @param {Boolean}     isMulti, update multi docs or not
 */
function _update(condition, updateDoc, isMulti) {
    var options = {
        multi: !!isMulti
    };
    return Model.update(condition, updateDoc, options).execAsync()
        .then(function(result) {
            return DbUtil.checkDocumentUpdateStatusAsync(result);
        });
}

/**
 * @Author: George_Chen
 * @Description: to vertify the type and its extra infomration is valid or not
 *         NOTE: the extra info for "channel" type should be the channel name
 *         
 * @param {String}          type, request type
 * @param {String}          info, extra information
 */
function _checkInfo(type, info) {
    if (type === 'friend') {
        return '';
    }
    if (type === 'channel') {
        if (SharedUtils.isString(info)) {
            return info;
        }
        throw new Error('extra info is invalid');
    }
    throw new Error('req type invalid');
}
