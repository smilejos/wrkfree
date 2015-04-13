'use strict';
var CryptoUtils = require('../sharedUtils/cryptoUtils');
var StorageManager = require('../storageService/StorageManager');
StorageManager.connectDb();
var ChannelStorage = StorageManager.getService('Channel');
var Promise = require('../sharedUtils/node_modules/bluebird');
var Mongoose = require('../storageService/node_modules/mongoose');
var UserModel = Mongoose.model('User');
var UserDao = require('../storageService/daos/UserDao');

/**
 * for developer, please change to your oauth login 'email'
 */
var Developer = 'bamoo456@gmail.com';

/**
 * test channels for polyfilling
 */
var channelList = [
    'Wrkfree', 'Development', 'UI', 'git_repo', 'Marketing', 'Houst'
];

function buildChannelAsync(user, chName, members) {
    // add channel
    var name = user + '#' + chName;
    var chId = CryptoUtils.getMd5Hex(name);

    return ChannelStorage.createChannelAsync(user, chId, name, 'public')
        .then(function() {
            return members;
        }).each(function(memberInfo) {
            // add members
            return ChannelStorage.addNewMemberAsync(user, memberInfo, chId);
        });
}

function getRandom(maximum){
    return Math.floor(Math.random()* maximum);
}

function pcikMembers (defaultUid, uids) {
    var uidsNum = uids.length;
    var memberNum = getRandom(uidsNum);
    var members = [defaultUid];
    for (var i=0;i<= memberNum; ++i) {
        var index = getRandom(uidsNum);
        if (members.indexOf(uids[index]) === -1) {
            members.push(uids[index]);
        }
    }
    return members;
}

/**
 * use current user collections as members to create channels
 */
return Promise.props({
    developer: UserDao.findByEmailAsync(Developer),
    users: UserModel.find({}).lean().execAsync()
}).then(function(data){
    return Promise.filter(data.users, function(userInfo){
        return (data.developer._id !== userInfo._id);
    }).map(function(member){
        return member._id;
    }).then(function(uids){
        return Promise.map(channelList, function(channel){
            var host = uids[getRandom((uids.length))];
            return buildChannelAsync(host, channel, pcikMembers(data.developer._id, uids));
        });
    });
});
