'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * friendOwner, the uid of owner who has this friend
 * uid, the friend uid
 * nickName, the friend's nickName
 * avatar, the avatar of this friend
 * group, the group that this friend belong to
 */

var FriendSchmea = new Schema({
    friendOwner:    {type : Schema.Types.ObjectId, index: true},
    uid:            {type : Schema.Types.ObjectId},
    nickName:       {type : String, default : '', trim : true},
    avatar:         {type : String, default : '', trim : true},
    group:          {type : String, default : '', trim : true}
});

FriendSchmea.set('autoIndex', false);

Mongoose.model('Friend', FriendSchmea);
