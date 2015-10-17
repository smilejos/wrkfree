'use strict';
var StorageManager = require('../../../../storageService/storageManager');
var DrawStorage = StorageManager.getService('Draw');

/**
 * Public API
 * @Author: George_Chen
 * @Description: middleware for getting workspace preview image
 */
exports.getPreview = function(req, res, next) {
    var uid = req.user.uid;
    var cid = req.params.channelId;
    var idx = req.query.board;
    return DrawStorage.getPreviewImgAsync(uid, cid, idx)
        .then(function(rawData) {
            req.img = rawData.content;
            next();
        });
};
