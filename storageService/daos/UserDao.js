'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var DbUtil = require('../dbUtils');
var UserModel = Mongoose.model('User');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the user by uid (email)
 *
 * @param {String}          uid, user's uid
 */
exports.findByUidAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'uid')
        .then(function(validUid) {
            var condition = {
                email: validUid
            };
            var selectField = DbUtil.selectOriginDoc();
            return UserModel.findOne(condition, selectField).lean().execAsync();
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'findByUidAsync', err);
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
        return SharedUtils.argsCheckAsync(user, 'uid');
    }).then(function(userGroup) {
        var condition = {
            email: {
                $in: userGroup
            }
        };
        var selectField = {
            nickName: DbUtil.select(true),
            email: DbUtil.select(true),
            avatar: DbUtil.select(true),
            _id: DbUtil.select(false)
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
exports.isUserExistAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'uid')
        .then(function() {
            var condition = {
                email: uid
            };
            return UserModel.countAsync(condition);
        }).then(function(count) {
            return (count > 0);
        }).catch(function(err) {
            SharedUtils.printError('UserDao', 'isUserExistAsync', err);
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
    return Promise.join(
        SharedUtils.argsCheckAsync(userInfo.email, 'uid'),
        SharedUtils.argsCheckAsync(userInfo.familyName, 'string'),
        SharedUtils.argsCheckAsync(userInfo.givenName, 'string'),
        function() {
            if (userInfo.gender !== 'male' && userInfo.gender !== 'female') {
                throw new Error('user gender is not in correct format');
            }
            // null "locale" value will be take care by the default value 
            if (!!userInfo.locale && !SharedUtils.isString(userInfo.locale)) {
                throw new Error('user locale should only be string');
            }
            // TODO: avatar should be checked
            userInfo.nickName = userInfo.givenName + userInfo.familyName;
            var newUser = new UserModel(userInfo);
            // make mongoose cache outdated
            UserModel.find()._touchCollectionCheck(true);
            return newUser.saveAsync();
        }).then(function(result){
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
