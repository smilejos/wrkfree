var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var UserSchema = new Schema({
    email:          {type : String, default : '', trim : true, index: true},
    firstName:      {type : String, default : '', trim : true},
    lastName:       {type : String, default : '', trim : true},
    nickName:       {type : String, default : '', trim : true},
    gender:         {type : String, default : '', trim : true},
    avatarProvider: {type : String, default : '', trim : true},
    password:       {type : String, default : '', trim : true},
    facebook:       {type : String, default : '', trim : true},
    google:         {type : String, default : '', trim : true},
    accessToken:    {type : String, default : '', trim : true},
    expiryDate:     {type : Date,   default : '' },
    locale:         {type : String, default : '', trim : true},
    createdTime:    {type : Date  , default : Date.now },
    updatedTime:    {type : Date  , default : Date.now }
});

UserSchema.set('autoIndex', false);

Mongoose.model('User', UserSchema);
