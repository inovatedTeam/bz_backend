/**
 * Created by OliveTech on 10/27/2017.
 */
// var FCM = require('fcm-node');
var common = require("../config/common")
var config = require('../config/config')
var db = require('../config/database')
var path = require("path")

var randomString = require('random-string')

function timeSince(date) {
    return Date.now() - date
    /*
     var seconds = Math.floor((new Date() - date) / 1000);

     var interval = Math.floor(seconds / 31536000);

     if (interval > 1) {
     return interval + " years";
     }
     interval = Math.floor(seconds / 2592000);
     if (interval > 1) {
     return interval + " months";
     }
     interval = Math.floor(seconds / 86400);
     if (interval > 1) {
     return interval + " days";
     }
     interval = Math.floor(seconds / 3600);
     if (interval > 1) {
     return interval + " hours";
     }
     interval = Math.floor(seconds / 60);
     if (interval > 1) {
     return interval + " minutes";
     }
     return Math.floor(seconds) + " seconds";
     */
}

function sendHistory(req, res, room_id, last_message_id, callback){
    var sql = 'SELECT * FROM bz_messages WHERE room_id = ? and id > ? ORDER BY created ASC';
    var filter = [room_id, last_message_id];
    db.query(sql, filter, function(err, result) {
        if (err){
            var message = "Sorry! Error occurred in Database.";
            common.sendFullResponse(res, 300, bad_result, message);
        }

        var result_arr = [];
        for (var i=0; i < result.length; i ++ ){
            var temp = {
                id : result[i].id,
                room_id : result[i].room_id,
                user_id : result[i].user_id,
                message : result[i].message,
                group_id : result[i].group_id,
                media : result[i].media,
                media_type : result[i].media_type,
                state : result[i].state,
                quote : result[i].quote_id,
                created : timeSince(parseInt(result[i].created)),
                duration : result[i].duration,
            }
            result_arr.push(temp)
        }
        var good_result = {
            room_id : room_id,
            history : result_arr
        };
        var message = "get user profile successfully.";
        common.sendFullResponse(res, 200, good_result, message);
    });
}

function getFileName( filename){
    var ext = path.extname(filename)
    var newFileName = randomString({
        length: 8,
        numeric: true,
        letters: true,
        special: false
    });
    newFileName += ext
    return newFileName;
}

exports.sendMessage = function(req, res){
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.room_id == undefined) {
            var message = "Sorry! Error occurred in send message.";
            common.sendFullResponse(res, 300,bad_result, message);
        }
        console.log(user.username)
        // insert message to database
        var room_id = req.body.room_id
        var receiver_id = req.body.receiver_id
        var chat_message = req.body.message
        var media_type = req.body.media_type
        var group_id = req.body.group_id
        var duration = config.message_duration_time
        if(parseInt(req.body.duration) > 0 ){
            duration = parseInt(req.body.duration)
        }

        var created = Date.now();
        if(media_type != 1){
            // file upload
            if (!req.files){
                var message = 'No files were uploaded.';
                return common.sendFullResponse(res, 300,{}, message);
            }
            var media = req.files.media;

            var newFileName = getFileName(req.files.media.name);
            media.mv('./public/media/'+newFileName, function(err) {
                if (err){
                    var message = 'File Upload Error.';
                    return common.sendFullResponse(res, 300,{}, message);
                }
                // file uploaded
                var sql = 'INSERT INTO bz_messages(room_id, group_id, user_id, message, media_type, media, state, quote, duration, created) VALUES ( ? ) ';
                var values = [ room_id, group_id, user.id, '', media_type, newFileName, 0, 0, duration, created];
                db.query( sql, [values], function(err, result){
                    if (err){
                        var message = "Sorry! Error occurred in Database.";
                        common.sendFullResponse(res, 300, bad_result, err);
                    }
                    var message_id = result.insertId
                    // get push token
                    var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                        '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                    var filter = [receiver_id, receiver_id, user.id];

                    db.query(sql, filter, function(err, tokens) {
                        if (err){
                            var message = "Sorry! Error occurred in Database.";
                            common.sendFullResponse(res, 300, bad_result, message);
                        }
                        var arrayMessageData = {
                            actionType: 'socket_new_message_server',
                            sender_id: user.id,
                            receiver_id: receiver_id,
                            message_id: message_id,
                            chat_message: "",
                            senderName: tokens[0].username,
                            created: created.toString(),
                            group_id: group_id,
                            media_type : media_type,
                            media : config.server_media_path + newFileName,
                            state : 0,
                            duration: duration.toString(),
                            senderImage: config.server_image_path + tokens[0].picture
                        }

                        if(tokens[0].receiver_state == "6"){
                            var message = "Sorry! Receiver account blocked."
                            console.log(message)
                            common.sendFullResponse(res, 300, bad_result, message)
                        }else{
                            common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                                // var message = "Message send successfully."
                                common.sendFullResponse(res, 200, arrayMessageData, response)
                            })
                        }

                    });
                })
            });
        }else{

            var sql = 'INSERT INTO bz_messages(room_id, group_id, user_id, message, media_type, media, state, quote, duration, created) VALUES ( ? ) ';
            var values = [ room_id, group_id, user.id, chat_message, media_type, '', 0, 0, duration, created];
            db.query( sql, [values], function(err, result){
                if (err){
                    var message = "Sorry! Error occurred in Database.";
                    common.sendFullResponse(res, 300, bad_result, err);
                }
                var message_id = result.insertId
                // get push token
                var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                    '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                var filter = [receiver_id, receiver_id, user.id];

                db.query(sql, filter, function(err, tokens) {
                    if (err){
                        var message = "Sorry! Error occurred in Database.";
                        common.sendFullResponse(res, 300, bad_result, message);
                    }
                    var arrayMessageData = {
                        actionType: 'socket_new_message_server',
                        sender_id: user.id,
                        receiver_id: receiver_id,
                        message_id: message_id,
                        chat_message: chat_message,
                        senderName: tokens[0].username,
                        created: created.toString(),
                        group_id: group_id,
                        media_type : media_type,
                        media : "",
                        state : 0,
                        duration: duration,
                        senderImage: config.server_image_path + tokens[0].picture
                    }

                    if(tokens[0].receiver_state == 6){
                        var message = "Sorry! Receiver account blocked."
                        console.log(message)
                        common.sendFullResponse(res, 300, bad_result, message)
                    }else{
                        common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                            // var message = "Message send successfully."
                            common.sendFullResponse(res, 200, arrayMessageData, response)
                        })
                    }

                });
            })
        }

    })
}

exports.deleteMessage = function(req, res){
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.message_id == undefined) {
            var message = "Sorry! Error occurred in delete message.";
            common.sendFullResponse(res, 300,bad_result, message);
        }
        // insert message to database
        var receiver_id = req.body.receiver_id;
        var message_id = req.body.message_id;

        var created = Date.now();
        var sql = "UPDATE bz_messages SET message='This message has been removed.', state = 5 WHERE id = ?";
        db.query( sql, message_id, function(err, result){
            if (err){
                var message = "Sorry! Error occurred in Database.";
                common.sendFullResponse(res, 300, bad_result, err);
            }
            // get push token
            var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
            var filter = [receiver_id, receiver_id, user.id];

            db.query(sql, filter, function(err, tokens) {
                if (err){
                    var message = "Sorry! Error occurred in Database.";
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                var arrayMessageData = {
                    actionType: 'delete message',
                    message:'This message has been removed.',
                    sender_id: user.id,
                    receiver_id: receiver_id,
                    message_id: message_id,
                    senderName: tokens[0].username,
                    created: created,
                    state: 5,
                    group_id: 0
                }
                if(tokens[0].receiver_state == 6){
                    var message = "Sorry! Receiver account blocked."
                    console.log(message)
                    common.sendFullResponse(res, 300, bad_result, message)
                }else{
                    common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                        // var message = "Message send successfully."
                        common.sendFullResponse(res, 200, arrayMessageData, response)
                    })
                }
            });
        })

    })
}

exports.editMessage = function(req, res){
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.message_id == undefined) {
            var message = "Sorry! Error occurred in edit message.";
            common.sendFullResponse(res, 300,bad_result, message);
        }
        // insert message to database
        var receiver_id = req.body.receiver_id;
        var message_id = req.body.message_id;
        var chat_message = req.body.message;

        var created = Date.now();
        var sql = 'UPDATE bz_messages SET message = ?, state = 4 WHERE id = ?';
        db.query( sql, [chat_message, message_id], function(err, result){
            if (err){
                var message = "Sorry! Error occurred in Database.";
                common.sendFullResponse(res, 300, bad_result, err);
            }
            // get push token
            var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
            var filter = [receiver_id, receiver_id, user.id];

            db.query(sql, filter, function(err, tokens) {
                if (err){
                    var message = "Sorry! Error occurred in Database.";
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                var arrayMessageData = {
                    actionType: 'edit message',
                    sender_id: user.id,
                    receiver_id: receiver_id,
                    message_id: message_id,
                    senderName: tokens[0].username,
                    message: chat_message,
                    state: 4,
                    created: created.toString(),
                    group_id: 0
                }
                if(tokens[0].receiver_state == 6){
                    var message = "Sorry! Receiver account blocked."
                    console.log(message)
                    common.sendFullResponse(res, 300, bad_result, message)
                }else{
                    common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                        // var message = "Message send successfully."
                        common.sendFullResponse(res, 200, arrayMessageData, response)
                    })
                }
            });
        })

    })
}

exports.getHistory = function(req, res) {
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        var last_message_id = req.body.last_message_id;
        var receiver_id = req.body.receiver_id;

        var sql = 'SELECT * FROM bz_rooms WHERE (sender_id = ? and receiver_id = ?) or (sender_id = ? and receiver_id = ?) ';
        var filter = [user.id, receiver_id, receiver_id, user.id]
        db.query(sql, filter, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in Database.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            if(result.length == 0){
                // create new room
                var values = [user.id, receiver_id, Date.now().toString()];
                db.query('INSERT INTO bz_rooms(sender_id, receiver_id, created) VALUES ( ? ) ', [values], function(err, result){
                    if (err){
                        var message = "Sorry! Error occurred in Database1.";
                        common.sendFullResponse(res, 300, bad_result, err);
                    }
                    var good_result = {
                        room_id : result.insertId,
                        history : {}
                    };
                    var message = "get chat history successfully."
                    common.sendFullResponse(res, 200, good_result, message)
                })
            }else{
                sendHistory(req, res, result[0].id, last_message_id)
                // var message = "Sorry! Error occurred in create new room.";
                // common.sendFullResponse(res, 300, bad_result, message);
            }
        });
    })
}

exports.createConversation = function(req, res) {
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        var receiver_id = req.body.receiver_id;

        var sql = 'SELECT * FROM bz_rooms WHERE (sender_id = ? and receiver_id = ?) or (sender_id = ? and receiver_id = ?) ';
        var filter = [user.id, receiver_id, receiver_id, user.id]
        db.query(sql, filter, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in Database.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            if(result.length == 0){
                // create new room
                var values = [user.id, receiver_id, Date.now().toString()];
                db.query('INSERT INTO bz_rooms(sender_id, receiver_id, created) VALUES ( ? ) ', [values], function(err, result){
                    if (err){
                        var message = "Sorry! Error occurred in Database1.";
                        common.sendFullResponse(res, 300, bad_result, err);
                    }
                    var good_result = {
                        room_id : result.insertId
                    };
                    var message = "create room successfully."
                    common.sendFullResponse(res, 200, good_result, message)
                })
            }else{
                var good_result = {
                    room_id : result[0].id
                };
                var message = "room already created."
                common.sendFullResponse(res, 200, good_result, message);
            }
        });
    })
}

exports.chatUserList = function(req, res) {
    var bad_result = {
        userList : []
    };
    if(!req.headers['token']){
        var message = 'There is no authenticate token.';
        console.log(token);
        common.sendFullResponse(res, 300,bad_result, message);
    }
    var token = req.headers['token']
    if (token) {
        jwt.verify(token, config.securty_key, function(err, decoded) {
            if (err) {
                var message = 'Failed to authenticate token.';
                console.log(message);
                common.sendFullResponse(res, 300,bad_result, message);
            } else {
                // get user list
                console.log(decoded)
                var good_result = {
                    username : decoded.username,
                    userList : []
                };
                var message = "";
                common.sendFullResponse(res, 200, good_result, message);
            }
        });

    } else {
        var message = 'No token provided.';
        console.log(token);
        common.sendFullResponse(res, 300,bad_result, message);
    }

};

exports.quoteMessage = function(req, res){
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.room_id == undefined) {
            var message = "Sorry! Error occurred in quote message.";
            common.sendFullResponse(res, 300,bad_result, message);
        }
        // insert message to database
        var room_id = req.body.room_id
        var receiver_id = req.body.receiver_id
        var chat_message = req.body.message
        var media_type = req.body.media_type
        var group_id = req.body.group_id
        var duration = config.message_duration_time
        var quote_id = req.body.quote_id
        if(parseInt(req.body.duration) > 0 ){
            duration = parseInt(req.body.duration)
        }

        var created = Date.now();
        if(media_type != "chat"){
            // file upload
            if (!req.files){
                var message = 'No files were uploaded.';
                return common.sendFullResponse(res, 300,{}, message);
            }
            var media = req.files.media;

            var newFileName = getFileName(req.files.media.name);
            media.mv('./public/media/'+newFileName, function(err) {
                if (err){
                    var message = 'File Upload Error.';
                    return common.sendFullResponse(res, 300,{}, message);
                }
                // file uploaded
                var sql = 'INSERT INTO bz_messages(room_id, group_id, user_id, message, media_type, media, state, quote, duration, created) VALUES ( ? ) ';
                var values = [ room_id, group_id, user.id, '', media_type, newFileName, 0, quote_id, duration, created];
                db.query( sql, [values], function(err, result){
                    if (err){
                        var message = "Sorry! Error occurred in Database.";
                        common.sendFullResponse(res, 300, bad_result, err);
                    }
                    var message_id = result.insertId
                    // get push token
                    var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                        '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                    var filter = [receiver_id, receiver_id, user.id];

                    db.query(sql, filter, function(err, tokens) {
                        if (err){
                            var message = "Sorry! Error occurred in Database.";
                            common.sendFullResponse(res, 300, bad_result, message);
                        }
                        var arrayMessageData = {
                            actionType: 'socket_new_message_server',
                            sender_id: user.id,
                            receiver_id: receiver_id,
                            message_id: message_id,
                            chat_message: "",
                            senderName: tokens[0].username,
                            created: created.toString(),
                            group_id: group_id,
                            media_type : media_type,
                            media : config.server_media_path + newFileName,
                            state : 0,
                            duration: duration,
                            senderImage: config.server_image_path + tokens[0].picture
                        }

                        if(tokens[0].receiver_state == "6"){
                            var message = "Sorry! Receiver account blocked."
                            console.log(message)
                            common.sendFullResponse(res, 300, bad_result, message)
                        }else{
                            common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                                common.sendFullResponse(res, 200, arrayMessageData, response)
                            })
                        }

                    });
                })
            });
        }else{

            var sql = 'INSERT INTO bz_messages(room_id, group_id, user_id, message, media_type, media, state, quote, duration, created) VALUES ( ? ) ';
            var values = [ room_id, group_id, user.id, chat_message, media_type, '', 0, quote_id, duration, created];
            db.query( sql, [values], function(err, result){
                if (err){
                    var message = "Sorry! Error occurred in Database.";
                    common.sendFullResponse(res, 300, bad_result, err);
                }
                var message_id = result.insertId
                // get push token
                var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, ' +
                    '(SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                var filter = [receiver_id, receiver_id, user.id];

                db.query(sql, filter, function(err, tokens) {
                    if (err){
                        var message = "Sorry! Error occurred in Database.";
                        common.sendFullResponse(res, 300, bad_result, message);
                    }
                    var arrayMessageData = {
                        actionType: 'socket_new_message_server',
                        sender_id: user.id,
                        receiver_id: receiver_id,
                        message_id: message_id,
                        chat_message: chat_message,
                        senderName: tokens[0].username,
                        created: created.toString(),
                        group_id: group_id,
                        media_type : media_type,
                        media : "",
                        state : 0,
                        duration: duration,
                        senderImage: config.server_image_path + tokens[0].picture
                    }

                    if(tokens[0].receiver_state == 6){
                        var message = "Sorry! Receiver account blocked."
                        console.log(message)
                        common.sendFullResponse(res, 300, bad_result, message)
                    }else{
                        common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayMessageData, function(response){
                            common.sendFullResponse(res, 200, arrayMessageData, response)
                        })
                    }

                });
            })
        }

    })
}

/* changed by dongjin */
