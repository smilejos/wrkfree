'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var UserModel = Mongoose.model('User');
var CryptoUtils = require('../../sharedUtils/cryptoUtils');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the user by his uid
 *
 * @param {String/ObjectId}          id, user's uid
 */
exports.findByIdAsync = function(id) {
    return SharedUtils.argsCheckAsync(id, '_id')
        .then(function(uid) {
            var condition = {
                _id: uid
            };
            var selectField = DbUtil.selectOriginDoc();
            return UserModel.findOne(condition, selectField).lean().execAsync();
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'findByIdAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find user by his email
 *
 * @param {String}          email, user's email
 */
exports.findByEmailAsync = function(email) {
    return SharedUtils.argsCheckAsync(email, 'email')
        .then(function(validUid) {
            var condition = {
                email: validUid
            };
            var selectField = {};
            return UserModel.findOne(condition, selectField).lean().execAsync();
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'findByEmailAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find group of users info
 *
 * @param {Array}          uids, group of uids
 */
exports.findByGroupAsync = function(uids) {
    return Promise.map(uids, function(user) {
        return SharedUtils.argsCheckAsync(user, '_id');
    }).then(function(userGroup) {
        var condition = {
            _id: {
                $in: userGroup
            }
        };
        var selectField = {
            nickName: DbUtil.select(true),
            avatar: DbUtil.select(true)
        };
        return UserModel.find(condition, selectField).lean().execAsync();
    }).catch(function(err) {
        SharedUtils.printError('UserDao', 'findByGroupAsync', err);
        return [];
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user is exist or not
 *
 * @param {String} uid, user's uid
 */
exports.isEmailUsedAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'email')
        .then(function() {
            var condition = {
                email: uid
            };
            return UserModel.countAsync(condition);
        }).then(function(count) {
            return (count > 0);
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'isEmailUsedAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to find users by the partial name string
 *
 * @param {String} queryString, the string used to find specific user
 */
exports.findByNameAsync = function(queryString) {
    return SharedUtils.argsCheckAsync(queryString, 'alphabet')
        .then(function() {
            //  <code>abc.*</code> will match all the following words
            //         since they including <code>abc</code>. ggabcde ccabcffg abceedff
            var condition = {};
            condition.nickName = new RegExp(queryString + '.*', 'i');
            var selectField = {
                nickName: DbUtil.select(true),
                email: DbUtil.select(true),
                facebook: DbUtil.select(true),
                google: DbUtil.select(true),
                avatar: DbUtil.select(true),
                _id: DbUtil.select(false)
            };
            return UserModel.find(condition, selectField).lean().execAsync();
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'findByNameAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: use oauth id to find the user's info
 *
 * @param {String} oAuthId, the oAuth valid id
 * @param {String} provider, the oauth provider
 */
exports.findByOAuthAsync = function(oAuthId, provider) {
    return Promise.try(function() {
        if (!_checkOAuthProvider(provider)) {
            throw new Error('oauth provider is not support now');
        }
        var condition = {};
        var selectField = {};
        selectField.email = DbUtil.select(true);
        selectField.nickName = DbUtil.select(true);
        condition[provider] = oAuthId;
        return UserModel.findOne(condition, selectField).lean().execAsync();
    }).catch(function(err) {
        SharedUtils.printError('UserDao', 'findByOAuthAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for new user to register account
 *
 * @param {Object} userInfo, the new users information
 */
exports.addNewUserAsync = function(userInfo) {
    return Promise.props({
        _id: CryptoUtils.getMd5Hex(userInfo.email),
        email: SharedUtils.argsCheckAsync(userInfo.email, 'email'),
        givenName: SharedUtils.argsCheckAsync(userInfo.givenName, 'string'),
        familyName: SharedUtils.argsCheckAsync(userInfo.familyName, 'string'),
        nickName: userInfo.givenName + userInfo.familyName,
        avatar: SharedUtils.argsCheckAsync(userInfo.avatar, 'avatar'),
        locale: SharedUtils.argsCheckAsync(userInfo.locale, 'alphabet'),
        facebook: userInfo.facebook || '',
        google: userInfo.google || ''
    }).then(function(info) {
        if (userInfo.gender !== 'male' && userInfo.gender !== 'female') {
            throw new Error('gender is invalid');
        }
        if (!SharedUtils.isNickName(info.nickName)) {
            throw new Error('nickName format is invalid');
        }
        if (!SharedUtils.isNormalChar(info.facebook) || !SharedUtils.isNormalChar(info.google)) {
            throw new Error('oauth provider is invalid');
        }
        info.gender = userInfo.gender;
        var newUser = new UserModel(info);
        // make mongoose cache outdated
        UserModel.find()._touchCollectionCheck(true);
        return newUser.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('UserDao', 'addNewUserAsync', err);
        return null;
    });
};

/************************************************
 *
 *          internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: simply check the oauth provider is support or not
 */
function _checkOAuthProvider(provider) {
    switch (provider) {
        case 'google':
        case 'facebook':
            return true;
        default:
            return false;
    }
}
