'use strict';
var Env = process.env.NODE_ENV || 'development';
var Pg = require('pg');
var Fs = require('fs');
var Promise = require('bluebird');
var Mongoose = require('mongoose');
var DbConfigs = require('../configs/db.json')[Env];
var PgEnv = DbConfigs.pgEnv;
var PgModel = require('./pgModels/PgModels');
var PgClient = new Pg.Client(PgEnv);
PgClient.connect();

Promise.promisifyAll(Mongoose);
Promise.promisifyAll(Pg);
Promise.promisifyAll(Fs);

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating drawRecords collection to postgresSQL table 
 */
exports.drawRecordsMigration = function() {
    function _getDrawRecordQuery(doc) {
        return {
            text: 'INSERT INTO drawRecords("channelId", "boardId",  "isUndo", "isArchived", record, "drawOptions", "drawTime") ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7)',
            values: [doc.channelId, doc.boardId, doc.isUndo, doc.isArchived, JSON.stringify(doc.record), doc.drawOptions, doc.drawTime]
        };
    }
    return _MongoConnect().then(function() {
        require('./models/DrawRecordModel');
        var model = Mongoose.model('DrawRecord');
        return _tableMigration(model, _getDrawRecordQuery);
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to binding new board uuid to related draw records
 */
exports.bidOnDrawRecord = function() {
    return PgClient.queryAsync('SELECT * FROM drawBoards')
        .then(function(result) {
            return result.rows;
        }).map(function(board) {
            var sqlQuery = {
                text: 'UPDATE drawRecords SET "_bid"=$3' +
                    'WHERE "channelId"=$1 AND "boardId"=$2',
                values: [board.channelId, board.boardId, board.id]
            };
            return PgClient.queryAsync(sqlQuery);
        }).then(function(){
            // remove legacy board cloumn
            return PgClient.queryAsync('ALTER TABLE drawBoards DROP COLUMN "boardId"')
                .then(function(){
                    return PgClient.queryAsync('ALTER TABLE drawRecords DROP COLUMN "boardId"')
                });
        }).catch(function(err) {
            console.log('[ERROR] fail to bind _bid on draw record ', err);
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating drawboards and drawpreviews collection to postgresSQL table 
 */
exports.drawBoardsMigration = function() {
    var channelPath;
    require('./models/DrawBoardModel');
    require('./models/DrawPreviewModel');
    var boardModel = Mongoose.model('DrawBoard');
    var previewModel = Mongoose.model('DrawPreview');
    return PgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'drawboards']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createDrawBoardsAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            return boardModel.findAsync();
        }).each(function(doc) {
            channelPath = '/data/files/' + doc.channelId + '/';
            return Promise.try(function() {
                if (!Fs.existsSync(channelPath)) {
                    return Fs.mkdirAsync(channelPath);
                }
            }).then(function() {
                var sqlQuery = {
                    text: 'INSERT INTO drawBoards("channelId", "boardId",  "createdTime", "updatedTime") ' +
                        'VALUES($1, $2, $3, $4)',
                    values: [doc.channelId, doc.boardId, doc._id.getTimestamp(), doc.updatedTime]
                };
                return PgClient.queryAsync(sqlQuery).then(function() {
                    return PgClient.queryAsync({
                        text: 'SELECT id FROM drawBoards ' +
                            'WHERE "channelId"=$1 AND "boardId"=$2',
                        values: [doc.channelId, doc.boardId]
                    });
                }).then(function(result) {
                    var bid = result.rows[0].id;
                    var basePath = channelPath + bid + '_base.png';
                    var previewPath = channelPath + bid + '_preview.png';
                    return previewModel.findOneAsync({
                        channelId: doc.channelId,
                        boardId: doc.boardId
                    }).then(function(previewDoc) {
                        return Promise.join(
                            Fs.writeFileAsync(basePath, doc.baseImg.chunks),
                            Fs.writeFileAsync(previewPath, previewDoc.chunks),
                            function() {
                                return PgClient.queryAsync({
                                    text: 'UPDATE drawBoards set base=$1, preview=$2 WHERE id=$3',
                                    values: [basePath, previewPath, bid]
                                });
                            });
                    });
                });
            }).catch(function(err) {
                console.log('[ERROR] fail to dump image ', doc, err);
                throw err;
            });
        });
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating friends collection to postgresSQL table 
 */
exports.friendsMigration = function() {
    function _getFriendQuery(doc) {
        return {
            text: 'INSERT INTO friends(owner, uid) VALUES($1, $2)',
            values: [doc.friendOwner, doc.uid]
        };
    }
    return PgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'friends']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createFriendsAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            require('./models/FriendModel');
            var model = Mongoose.model('Friend');
            return _tableMigration(model, _getFriendQuery);
        });
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating channel collection to postgresSQL table 
 * 
 * NOTE: we set the default channel "isPublic" flag to false
 */
exports.channelMigration = function() {
    function _getChannelQuery(doc) {
        if (!doc.is1on1) {
            doc.isPublic = false;
        }
        return {
            text: 'INSERT INTO channels(id, host, name, "is1on1", "isPublic", "isAnonymousLogin", "anonymousPassword") ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7)',
            values: [doc._id, doc.host, doc.name, doc.is1on1, doc.isPublic, doc.isAnonymousLogin, doc.anonymousPassword]                        
        };
    }
    return PgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'channels']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createChannelsAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            require('./models/ChannelModel');
            var model = Mongoose.model('Channel');
            return _tableMigration(model, _getChannelQuery);
        });
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating channelMember collection to postgresSQL table 
 */
exports.memberMigration = function() {
    function _getChannelQuery(doc) {
        return {
            text: 'INSERT INTO members(member, "channelId", "is1on1", "isStarred", "isHost", "msgSeenTime", "lastVisitTime") ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7)',
            values: [doc.member, doc.channelId, doc.is1on1, doc.isStarred, doc.isHost, doc.msgSeenTime, doc.lastVisitTime]
        };
    }
    return PgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'members']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createMembersAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            require('./models/ChannelMemberModel');
            var model = Mongoose.model('ChannelMember');
            return _tableMigration(model, _getChannelQuery);
        });
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: migrating user collection to postgresSQL table 
 */
exports.userMigration = function() {
    function _getUserQuery(doc) {
        return {
            text: 'INSERT INTO users(uid, email, "givenName", "familyName", gender, avatar, facebook, ' +
                'google, locale, "isDefaultTourHidden", "isDashboardGrid", "unreadNoticeCounts", "createdTime", "updatedTime") ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)',
            values: [doc._id, doc.email, doc.givenName, doc.familyName, doc.gender, doc.avatar, doc.facebook, 
                doc.google, doc.locale, doc.isDefaultTourHidden, doc.isDashboardGrid, doc.unreadNoticeCounts, doc.createdTime]
        };
    }
    return PgClient.queryAsync({
        text: 'SELECT EXISTS (' +
            'SELECT 1 ' +
            'FROM   information_schema.tables ' +
            'WHERE  table_schema = $1' +
            'AND    table_name = $2 )',
        values: ['public', 'users']
    }).then(function(tableResult) {
        var tableExist = tableResult.rows[0].exists;
        if (!tableExist) {
            return PgModel.createUsersAsync();
        }
    }).then(function() {
        return _MongoConnect().then(function() {
            require('./models/UserModel');
            var model = Mongoose.model('User');
            return _tableMigration(model, _getUserQuery);
        });
    });
};

/**
 * @Author: George_Chen
 * @Description: migrdate mongodb collection to postgresSQL table
 *
 * @param {Object}      mongoModel, the mongoose model
 * @param {Function}    sqlQueryHandler, handler for generating table dependent sql query
 */
function _tableMigration(mongoModel, sqlQueryHandler) {
    return mongoModel.findAsync({}).then(function(results) {
        console.log('[INFO] migration documents counts: ', results.length);
        return Promise.map(results, function(doc) {
            var sqlQuery = sqlQueryHandler(doc);
            return PgClient.queryAsync(sqlQuery);
        });
    }).then(function(migratedResults) {
        console.log('[INFO] migration documents result counts: ', migratedResults.length);
        PgClient.end();
    }).catch(function(err) {
        console.log('[ERROR] migration documents fail', err);
    });
}

/**
 * @Author: George_Chen
 * @Description: used to connect mongoDB
 */
function _MongoConnect() {
    var targetDb = DbConfigs.dbEnv.host + DbConfigs.dbEnv.dbName;
    // connect to mongodb
    return Mongoose.connectAsync(targetDb, {
        server: {
            socketOptions: {
                keepAlive: 1
            }
        }
    });
}
