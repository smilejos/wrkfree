'use strict';
require('../storageService/StorageManager')(require('../storageService/configs'));
var FriendDao = require('../storageService/daos/FriendDao');

/**
 * your login uid
 */
var User = 'bamoo456@gmail.com';

/**
 * test datas for friends
 */
var Friends = [
    {
        uid: 'bamoo789@gmail.com',
        name: 'ChiaChuChen',
        avatar: 'https://graph.facebook.com/chiachu.chen.18/picture'
    },
    {
        uid: 'normanwei@gmail.com',
        name: 'Normanywei',
        avatar: 'https://graph.facebook.com/Normanywei/picture'
    },
    {
        uid: 'smilejos@gmail.com',
        name: 'JosTung',
        avatar: 'https://graph.facebook.com/JosTung/picture'
    }
];

return Friends.map(function(item){
    FriendDao.isFriendExistAsync(item.uid, User)
        .then(function(exist){
            if (!exist) {
                return FriendDao.addNewFriendAsync(User, item.uid, item.name, item.avatar);
            }
        });
});