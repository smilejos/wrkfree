'use strict';
var StorageManager = require('../storageService/StorageManager');
StorageManager.connectDb();
var FriendStorage = StorageManager.getService('Friend');
var UserDao = require('../storageService/daos/UserDao');
var Promise = require('../sharedUtils/node_modules/bluebird');

var Mongoose = require('../storageService/node_modules/mongoose');
var UserModel = Mongoose.model('User');

/**
 * for developer, please change to your oauth login 'email'
 */
var Developer = 'bamoo456@gmail.com';

/**
 * use current user collection as friends to create friendlist
 */
return Promise.props({
    ownerInfo: UserDao.findByEmailAsync(Developer),
    users: UserModel.find({}).lean().execAsync()
}).then(function(data){
    return Promise.map(data.users, function(userInfo){
        if (data.ownerInfo.uid !== userInfo._id) {
            return FriendStorage.addFriendshipAsync(data.ownerInfo.uid, userInfo._id);
        }
    });
});
