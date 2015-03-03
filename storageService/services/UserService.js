'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../configs');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var Redis = require('redis');

var RedisClient = Redis.createClient(
    Configs.globalCacheEnv.port,
    Configs.globalCacheEnv.host,
    Configs.globalCacheEnv.options);

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to sign up an user account
 *
 * @param {Object} userInfo, user information object
 */
exports.addUserAsync = function(userInfo) {
    return UserDao.isUserExistAsync(userInfo.email)
        .then(function(exist) {
            return (exist ? false : UserDao.addNewUserAsync(userInfo));
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: vertify this client and return his info if success
 *
 * @param {String} clientId, oAuthId of this client
 * @param {String} provider, oAuth provider
 */
exports.oAuthLoginAsync = function(clientId, provider) {
    return UserDao.findByOAuthAsync(clientId, provider)
        .then(function(userInfo) {
            if (!userInfo) {
                return null;
            }
            return {
                email: userInfo.email,
                name: userInfo.nickName
            };
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specifc user by partial of his name
 *
 * @param {String}      findString, the string used to find user
 */
exports.findUsersAsync = function(findString) {
    return UserDao.findByNameAsync(findString);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find out the information of specific user
 *
 * @param {String/Array}      user, an user id or an array of users
 */
exports.getUserAsync = function(user) {
    return Promise.try(function() {
        if (SharedUtils.isArray(user)) {
            return UserDao.findByGroupAsync(user);
        }
        if (SharedUtils.isEmail(user)) {
            return UserDao.findByUidAsync(user);
        }
        throw new Error('not an valid user');
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'getUserAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check websocket owner got authorized or not
 *
 * @param  {String}           uid, user's id
 * @param  {String}           sid, user's web session id
 */
exports.getSessAuthAsync = function(user, sid) {
    return Promise.join(
        SharedUtils.argsCheckAsync(user, 'uid'),
        SharedUtils.argsCheckAsync(sid, 'string'),
        function(){
            var sessKey = 'sess:' + sid;
            return RedisClient.getAsync(sessKey);
        }).then(function(result){
            return (user === JSON.parse(result).passport.user.email);
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'getSessAuthAsync', err);
            return false;
        });
};
