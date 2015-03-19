'use strict';
require('../storageService/StorageManager')(require('../storageService/configs'));
var UserDao = require('../storageService/daos/UserDao');

var Users = [
    {
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
];

return Users.map(function(userInfo){
    UserDao.isUserExistAsync(userInfo.email)
        .then(function(exist){
            if (!exist) {
                return UserDao.addNewUserAsync(userInfo);
            }
        });
});
