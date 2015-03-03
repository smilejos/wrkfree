'use strict';
var CreateStore = require('fluxible/utils/createStore');
var Promise = require('bluebird');

var SelfUid = null;

/**
 * Users store, currently we setup with fake datas
 */
var Users = {
    'bamoo456@gmail.com': {
        avatar: 'https://graph.facebook.com/10205072666803776/picture',
        channelId: false
    },
    'bamoo789@gmail.com': {
        avatar: 'https://graph.facebook.com/10204195195415019/picture',
        channelId: '5e2e717e84acd6518bbcd43570742d3f'
    }
};

/**
 * TODO: how to handling the failure of user fetching ?
 * @Author: George_Chen
 * @Description: to fetch user info from remote server
 *
 * @param {String}      uid, users'id
 */
function _fetchUserInfoAsync(uid) {
    // should be replaced by userInfoService
    return Promise.try(function() {
        // now simply invoke an fake user
        var userData = {
            avatar: 'matched avatar',
            channelId: 'matched channelId'
        };
        return (Users[uid] = userData);
    }).catch(function(err) {
        console.log('[_fetchUserInfoAsync] ', err);
        return {};
    });
}

var UserInfoStore = CreateStore({
    storeName: 'UserInfoStore',

    initialize: function() {
        SelfUid = 'bamoo456@gmail.com';
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: caller can use this to get the matched users info
     *
     * @param {String}      uid, users'id
     */
    getUserAsync: function(uid) {
        return Promise.try(function() {
            if (Users[uid]) {
                return Users[uid];
            }
            return _fetchUserInfoAsync(uid);
        });
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for getting the self info
     *
     */
    getSelfInfo: function() {
        var info = Users[SelfUid];
        info.uid = SelfUid;
        return info;
    },

    dehydrate: function() {
        return {
            self: SelfUid,
            usersInfo: Users
        };
    },

    rehydrate: function(serializedData) {
        Users = serializedData.usersInfo;
        SelfUid = serializedData.self;
    }
});



module.exports = UserInfoStore;