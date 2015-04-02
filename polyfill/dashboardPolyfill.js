'use strict';
var CryptoUtils = require('../sharedUtils/cryptoUtils');
var StorageManager = require('../storageService/StorageManager')(require('../storageService/configs'));
var ChannelStorage = StorageManager.getService('Channel');
var UserStorage = StorageManager.getService('User');
var Promise = require('../sharedUtils/node_modules/bluebird');

/**
 * your login uid
 */
var Developer = 'bamoo456@gmail.com';

var TestUsers = [{
    email: 'bamoo456@gmail.com',
    familyName: 'Chen',
    givenName: 'George',
    avatar: 'https://graph.facebook.com/10203820423178468/picture',
    gender: 'male',
    facebook: '10203820423178468',
    locale: 'en_US'
}, {
    email: 'bamoo789@gmail.com',
    familyName: 'Chen',
    givenName: 'ChiaChu',
    avatar: 'https://graph.facebook.com/564830220310497/picture',
    gender: 'male',
    facebook: '564830220310497',
    locale: 'en_US'
}, {
    email: 'clearwindjos@gmail.com',
    familyName: 'Tung',
    givenName: 'Jos',
    avatar: 'https://graph.facebook.com/333479400166173/picture',
    gender: 'male',
    facebook: '333479400166173',
    locale: 'zh_TW'
}, {
    email: 'normanywei@gmail.com',
    familyName: 'Huang',
    givenName: 'Norman',
    avatar: 'https://graph.facebook.com/Normanywei/picture',
    gender: 'male',
    facebook: 'Normanywei',
    locale: 'en_US'
}, {
    email: 'biaomin@gmail.com',
    familyName: 'Lin',
    givenName: 'Biao',
    avatar: 'https://graph.facebook.com/biaomin/picture',
    gender: 'male',
    facebook: 'biaomin',
    locale: 'en_US'
}, {
    email: 'Malachi1005@gmail.com',
    familyName: 'Chen',
    givenName: 'Andrew',
    avatar: 'https://graph.facebook.com/Malachi1005/picture',
    gender: 'male',
    facebook: 'Malachi1005',
    locale: 'en_US'
}, {
    email: 'yajun.yang@gmail.com',
    familyName: 'Yang',
    givenName: 'Jun',
    avatar: 'https://graph.facebook.com/yajun.yang/picture',
    gender: 'male',
    facebook: 'yajun.yang',
    locale: 'en_US'
}, {
    email: 'eric.hung.779@gmail.com',
    familyName: 'Hung',
    givenName: 'Eric',
    avatar: 'https://graph.facebook.com/eric.hung.779/picture',
    gender: 'male',
    facebook: 'eric.hung.779',
    locale: 'en_US'
}, {
    email: 'chuangaching@gmail.com',
    familyName: 'Chuang',
    givenName: 'Aching',
    avatar: 'https://graph.facebook.com/chuangaching/picture',
    gender: 'male',
    facebook: 'chuangaching',
    locale: 'en_US'
}, {
    email: 'seasonny@gmail.com',
    familyName: 'Huang',
    givenName: 'WeiTang',
    avatar: 'https://graph.facebook.com/seasonny/picture',
    gender: 'male',
    facebook: 'seasonny',
    locale: 'en_US'
}, ];

var TestChannelList = [{
    name: 'Wrkfree',
    host: Developer,
    members: [
        TestUsers[8].email,
        TestUsers[1].email,
        TestUsers[2].email,
        TestUsers[3].email,
        TestUsers[7].email,
        TestUsers[5].email
    ]
}, {
    name: 'Development',
    host: TestUsers[3].email,
    members: [
        TestUsers[4].email,
        TestUsers[5].email,
        TestUsers[2].email,
        TestUsers[0].email
    ]
}, {
    name: 'UI',
    host: TestUsers[2].email,
    members: [
        TestUsers[6].email,
        TestUsers[7].email,
        TestUsers[3].email,
        TestUsers[5].email
    ]
}, {
    name: 'git_repo',
    host: TestUsers[9].email,
    members: [
        TestUsers[5].email,
        TestUsers[8].email,
        TestUsers[2].email,
        TestUsers[1].email
    ]
}, {
    name: 'Marketing',
    host: TestUsers[7].email,
    members: [
        TestUsers[1].email,
        TestUsers[2].email,
        TestUsers[3].email,
        TestUsers[4].email,
        TestUsers[5].email
    ]
}, {
    name: 'House',
    host: TestUsers[8].email,
    members: [
        TestUsers[1].email
    ]
}, ];


function loadUsersAsync(users) {
    return Promise.map(users, function(userInfo) {
        return UserStorage.addUserAsync(userInfo);
    });
}

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
        }).then(function() {
            // update visit time
            return ChannelStorage.visitChannelAsync(Developer, chId);
        });
}

return loadUsersAsync(TestUsers)
    .then(function() {
        return TestChannelList;
    }).map(function(channel) {
        channel.members.push(Developer);
        return buildChannelAsync(channel.host, channel.name, channel.members);
    });
