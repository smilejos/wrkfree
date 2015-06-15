var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

var UserSchema = new Schema({
    _id:            {type : String, default : '', trim : true, index: true},
    email:          {type : String, default : '', trim : true, index: true},
    givenName:      {type : String, default : '', trim : true},
    familyName:     {type : String, default : '', trim : true},
    nickName:       {type : String, default : '', trim : true},
    gender:         {type : String, default : '', trim : true},
    avatar:         {type : String, default : '', trim : true},
    password:       {type : String, default : '', trim : true},
    facebook:       {type : String, default : '', trim : true},
    google:         {type : String, default : '', trim : true},
    accessToken:    {type : String, default : '', trim : true},
    expiryDate:     {type : Date,   default : '' },
    locale:         {type : String, default : 'en_US', trim : true},
    createdTime:    {type : Date  , default : Date.now },
    updatedTime:    {type : Date  , default : Date.now }
});

UserSchema.set('autoIndex', false);

Mongoose.model('User', UserSchema);
