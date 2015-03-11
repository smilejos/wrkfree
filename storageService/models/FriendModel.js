var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var FriendSchmea = new Schema({
    friendOwner:    {type : String, default : '', trim : true, index: true},  // specify the owner of this friend schema
    uid:            {type : String, default : '', trim : true},
    nickName:       {type : String, default : '', trim : true},
    avatar:         {type : String, default : '', trim : true},
    group:          {type : String, default : '', trim : true}
});

FriendSchmea.set('autoIndex', false);

Mongoose.model('Friend', FriendSchmea);
