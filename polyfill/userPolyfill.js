'use strict';
require('../storageService/StorageManager')(require('../storageService/configs'));
var UserDao = require('../storageService/daos/UserDao');

var Users = [
    {
        // Developer's info
        email: 'bamoo456@gmail.com',
        familyName: 'Chen',
        givenName: 'George',
        avatar: 'https://graph.facebook.com/10203820423178468/picture',
        gender: 'male',
        facebook: '10203820423178468',
        locale: 'en_US'
    },
    {
        email: 'bamoo789@gmail.com',
        familyName: 'Chen',
        givenName: 'GhiaChu',
        avatar: 'https://graph.facebook.com/564830220310497/picture',
        gender: 'male',
        facebook: '564830220310497',
        locale: 'en_US'
    },
    {
        email: 'meetfree.in@gmail.com',
        familyName: 'In',
        givenName: 'Meetfree',
        avatar: 'https://graph.facebook.com/1377776862522029/picture',
        gender: 'male',
        facebook: '1377776862522029',
        locale: 'en_US'
    },   
    {
        email: 'clearwindjos@gmail.com',
        familyName: 'Tung',
        givenName: 'Jos',
        avatar: 'https://graph.facebook.com/333479400166173/picture',
        gender: 'male',
        facebook: '333479400166173',
        locale: 'zh_TW'
    },
    {
        email: 'normanywei@gmail.com',
        familyName: 'Huang',
        givenName: 'Norman',
        avatar: 'https://graph.facebook.com/Normanywei/picture',
        gender: 'male',
        facebook: 'Normanywei',
        locale: 'en_US'
    },
    {
        email: 'biaomin@gmail.com',
        familyName: 'Lin',
        givenName: 'Biao',
        avatar: 'https://graph.facebook.com/biaomin/picture',
        gender: 'male',
        facebook: 'biaomin',
        locale: 'en_US'
    },
    {
        email: 'Malachi1005@gmail.com',
        familyName: 'Chen',
        givenName: 'Andrew',
        avatar: 'https://graph.facebook.com/Malachi1005/picture',
        gender: 'male',
        facebook: 'Malachi1005',
        locale: 'en_US'
    },
    {
        email: 'yajun.yang@gmail.com',
        familyName: 'Yang',
        givenName: 'Jun',
        avatar: 'https://graph.facebook.com/yajun.yang/picture',
        gender: 'male',
        facebook: 'yajunyang',
        locale: 'en_US'
    },
    {
        email: 'eric.hung.779@gmail.com',
        familyName: 'Hung',
        givenName: 'Eric',
        avatar: 'https://graph.facebook.com/eric.hung.779/picture',
        gender: 'male',
        facebook: 'erichung779',
        locale: 'en_US'
    },
    {
        email: 'chuangaching@gmail.com',
        familyName: 'Chuang',
        givenName: 'Aching',
        avatar: 'https://graph.facebook.com/chuangaching/picture',
        gender: 'male',
        facebook: 'chuangaching',
        locale: 'en_US'
    },
    {
        email: 'seasonny@gmail.com',
        familyName: 'Huang',
        givenName: 'WeiTang',
        avatar: 'https://graph.facebook.com/seasonny/picture',
        gender: 'male',
        facebook: 'seasonny',
        locale: 'en_US'
    }
];

return Users.map(function(userInfo){
    UserDao.isEmailUsedAsync(userInfo.email)
        .then(function(exist){
            if (!exist) {
                return UserDao.addNewUserAsync(userInfo);
            }
        });
});
