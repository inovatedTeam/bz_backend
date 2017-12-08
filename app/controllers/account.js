/**
 * Created by OliveTech on 10/26/2017.
 */
var common = require("../config/common")
var config = require('../config/config')
var db = require('../config/database')
var Password = require("node-php-password")
var jwt = require("jsonwebtoken")
var _ = require("underscore")
var path = require("path")
var randomString = require('random-string')

var bad_result = {}

// function checkAudentication(req, res, callback) {
//     var bad_result = {
//
//     };
//     if(!req.headers['token']){
//         var message = 'There is no authenticate token.';
//         return common.sendFullResponse(res, 300,{}, message);
//     }
//     var token = req.headers['token']
//     if (token) {
//         jwt.verify(token, config.securty_key, function(err, decoded) {
//             if (err) {
//                 var message = 'There is invalid authenticate token.';
//                 common.sendFullResponse(res, 300,{}, message);
//             } else {
//                 db.query('SELECT * FROM users WHERE mobileToken = ?', token, function(err, userdata) {
//                     if (err){
//                         var message = "Your token expired, Please login again.";
//                         console.log(message);
//                         common.sendFullResponse(res, 300,bad_result, message);
//                     }
//                     if(userdata.length == 0){
//                         var message = "Your token expired, Please login again.";
//                         console.log(message);
//                         common.sendFullResponse(res, 300, bad_result, message);
//                     }else{
//                         // return user_id
//                         return callback(userdata[0])
//                     }
//                 });
//
//             }
//         });
//
//     } else {
//         var message = 'No token provided.';
//         common.sendFullResponse(res, 300,{}, message);
//     }
// }
function checkPassword(password, userData) {
    if(Password.verify(password, userData.password)){
        console.log("password matched");
        return true;
    }else{
        return false;
    }
}
function sendSMSVerification(req, res, userData){
    // get phone number from userData

    var country = req.body.country;
    var mobile = req.body.mobile;
    var shortMessage = getRandomInt(100000, 999999)
    // save database
    db.query('SELECT * FROM bz_short_codes WHERE user_id = ?', userData.id , function(err, chk_data) {
        if (err){
            return 0;
        }
        if(chk_data.length == 0){
            db.query('INSERT INTO bz_short_codes SET ?', {user_id: userData.id, country: country, mobile : mobile, short_code : shortMessage} , function(err, result) {
                if (err){
                    return 1;
                }
                return shortMessage;
            })
        }else{
            db.query('UPDATE bz_short_codes SET ? WHERE user_id = '+userData.id, { country: country, mobile : mobile, short_code : shortMessage}, function(err, result) {
                if (err){
                    throw err;
                    // return 2;
                }
                return shortMessage;
            })
        }

    })
    // send verification message to twillio .com
    return shortMessage;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
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

exports.checkToken = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        var good_result = {
            user_id: user.id,
            is_validToken : 1
        };
        var message = "Valid Token";
        common.sendFullResponse(res, 200, good_result, message);
    })
}

exports.login = function(req, res) {
    var bad_result = {

    };
    if (req.body.username == undefined) {
        var message = "Sorry! Error occurred in login1.";
        console.log(message);
        common.sendFullResponse(res, 300,bad_result, message);
    }
    if (req.body.password == undefined) {
        var message = "Sorry! Error occurred in login1.";
        console.log(message);
        common.sendFullResponse(res, 300,bad_result, message);
    }
    var param = req.body;
    db.query('SELECT * FROM users WHERE username = ?', param.username, function(err, userdata) {
        if (err){
            var message = "Sorry! Error occurred in login2.";
            console.log(message);
            common.sendFullResponse(res, 300,bad_result, message);
        }
        if(userdata.length == 0){
            var message = "Sorry! Error occurred in login3.";
            console.log(message);
            common.sendFullResponse(res, 300, bad_result, message);
        }else{
            if (checkPassword(param.password, userdata[0])) {
                // get token
                const payload = {
                    user_id: userdata[0].id
                };
                var token = jwt.sign(payload, config.securty_key, {
                    expiresIn: 60*24*365 // expires in a year
                });
                // save token to database
                db.query("UPDATE users SET mobileToken = '"+ token+"' WHERE id = ?", userdata[0].id, function(err) {
                    if (err){
                        var message = "Sorry! Error occurred in update mobileToken.";
                        common.sendFullResponse(res, 300, bad_result, message);
                    }
                    var photo_url = config.server_image_path;
                    if(userdata[0].picture == undefined){
                        photo_url += "avatar.png";
                    }else{
                        photo_url += userdata[0].picture;
                    }
                    var phone = "";
                    if(!userdata[0].phone){
                        phone = "";
                    }else{
                        phone = userdata[0].phone;
                    }

                    var good_result = {
                        username : userdata[0].username,
                        user_id: userdata[0].id,
                        token : token,
                        photo : photo_url,
                        phone : phone
                    };
                    var message = "User login successfully.";
                    common.sendFullResponse(res, 200, good_result, message);

                });


            } else {
                var message = "Security info is incorrect.";
                console.log(message);
                common.sendFullResponse(res, 300,bad_result, message);
            }
        }
    });

};

exports.findByUsername = function(req, res) {
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.search_username == undefined) {
            var message = "Sorry! Error occurred in search user1.";
            console.log(message);
            common.sendFullResponse(res, 300,bad_result, message);
        }
        var param = req.body;
        db.query('SELECT * FROM users WHERE username = ?', param.search_username, function(err, userdata) {
            if (err){
                var message = "Sorry! Error occurred in search user2.";
                common.sendFullResponse(res, 300,bad_result, message);
            }
            if(userdata.length == 0){
                var message = "Sorry! Error occurred in search user3.";
                common.sendFullResponse(res, 300,bad_result, message);
            }else{
                var photo_url = config.server_image_path;
                if(userdata[0].picture == undefined){
                    photo_url += "avatar.png";
                }else{
                    photo_url += userdata[0].picture;
                }
                var good_result = {
                    username : userdata[0].username,
                    user_id: userdata[0].id,
                    state: userdata[0].state,
                    user_status : userdata[0].user_status,
                    about_me : userdata[0].about_me,
                    photo: photo_url
                };
                var message = "User finded successfully.";
                common.sendFullResponse(res, 200, good_result, message);
            }
        })
    })
}

exports.getProfile = function(req, res) {
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        if (req.body.user_id == undefined) {
            var message = "Sorry! Error occurred in profile1.";
            console.log(message);
            common.sendFullResponse(res, 300, bad_result, message);
        }
        db.query('SELECT * FROM users WHERE id = ?', req.body.user_id, function(err, userdata) {
            if (err){
                var message = "Sorry! Error occurred in getProfile2.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            if(userdata.length == 0){
                var message = "Sorry! Error occurred in getProfile3.";
                common.sendFullResponse(res, 300,bad_result, message);
            }else{
                var photo_url = config.server_image_path;
                if(userdata[0].picture == undefined){
                    photo_url += "avatar.png";
                }else{
                    photo_url += userdata[0].picture;
                }
                var phone = "";
                if(!userdata[0].phone){
                    phone = "";
                }else{
                    phone = userdata[0].phone;
                }
                var good_result = {
                    username : userdata[0].username,
                    phone : phone,
                    user_id: userdata[0].id,
                    state: userdata[0].state,
                    user_status : userdata[0].user_status,
                    about_me : userdata[0].about_me,
                    photo: photo_url
                };
                var message = "get user profile successfully.";
                common.sendFullResponse(res, 200, good_result, message);
            }
        });
    })
}

exports.updateProfileAvatar = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (!req.files){
            var message = 'No files were uploaded.';
            return common.sendFullResponse(res, 300,{}, message);
        }
        var photo = req.files.photo;
        var newFileName = getFileName(req.files.photo.name);
        photo.mv('./public/images/profile/'+newFileName, function(err) {
            if (err){
                var message = 'File Upload Error.';
                return common.sendFullResponse(res, 300,{}, message);
            }
            // file uploaded
            db.query("UPDATE users SET picture = '"+ newFileName+"' WHERE id = ?", user.id, function(err) {
                if (err){
                    var message = "Sorry! Error occurred in update profile.";
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                var photo_url = config.server_image_path + newFileName;
                var good_result = {
                    photo: photo_url
                };
                var message = "update user profile successfully.";
                common.sendFullResponse(res, 200, good_result, message);
            });
        });


    })
}

exports.updateProfileAbout = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (!req.body.about_me){
            var message = "Sorry! Error empty pushToken.";
            console.log(message);
            common.sendFullResponse(res, 300,bad_result, message);
        }
        var about_me = req.body.about_me
        db.query("UPDATE users SET about_me = '"+ about_me +"' WHERE id = ?", user.id, function(err) {
            if (err){
                var message = "Sorry! Error occurred in update profile."
                common.sendFullResponse(res, 300, bad_result, message)
            }
            var good_result = {
                about_me : about_me
            }
            var message = "update user profile successfully.";
            common.sendFullResponse(res, 200, good_result, message);
        });
    })
}

exports.updateProfileStatus = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (!req.body.user_status){
            var message = "Sorry! Error empty pushToken."
            console.log(message)
            common.sendFullResponse(res, 300,bad_result, message)
        }
        var user_status = req.body.user_status
        db.query("UPDATE users SET user_status = "+ user_status +" WHERE id = ?", user.id, function(err) {
            if (err){
                var message = "Sorry! Error occurred in update profile."
                common.sendFullResponse(res, 300, bad_result, message)
            }
            var good_result = {
                user_status : user_status
            }
            var message = "update user profile successfully.";
            common.sendFullResponse(res, 200, good_result, message);
        })
    })
}

exports.updateTokenFCM = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (req.body.pushToken == undefined) {
            var message = "Sorry! Error empty pushToken.";
            console.log(message);
            common.sendFullResponse(res, 300,bad_result, message);
        }
        db.query("UPDATE users SET pushToken = '"+ req.body.pushToken+"' WHERE id = ?", user.id, function(err) {
            if (err){
                var message = "Sorry! Error occurred in update pushToken.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            var good_result = {
                pushToken: req.body.pushToken
            };
            var message = "updated user pushToken successfully.";
            common.sendFullResponse(res, 200, good_result, message);
        });


    })
}

exports.showPhoneReq = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (req.body.target_id == undefined) {
            var message = "Sorry! Error empty selected user."
            console.log(message)
            common.sendFullResponse(res, 300,bad_result, message)
        }

        var receiver_id = req.body.target_id
        db.query("SELECT * FROM bz_show_phone WHERE sender_id = ? and receiver_id = ?", [user.id, receiver_id], function(err, data){

            if (err){
                var message = "Sorry! Error occurred in Show phone number request.";
                common.sendFullResponse(res, 300, bad_result, message);
            }

            var created = Date.now()
            if(data.length == 0){
                // insert request

                var values = [user.id, receiver_id, 0, created]
                db.query('INSERT INTO bz_show_phone(sender_id, receiver_id, state, created) VALUES ( ? ) ', [values], function(err, result) {
                    if (err){
                        var message = "Sorry! Error occurred in Show phone number request.";
                        common.sendFullResponse(res, 300, bad_result, message);
                    }
                    var new_id = result.insertId
                    // get push token
                    var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, (SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                    var filter = [receiver_id, receiver_id, user.id];
                    db.query(sql, filter, function(err, tokens) {
                        if (err){
                            var message = "Sorry! Error occurred in Database.";
                            common.sendFullResponse(res, 300, bad_result, err);
                        }
                        var noti_message = tokens[0].username + " asked you to show your phone number"
                        var arrayNotiData = {
                            show_id : new_id,
                            actionType: 'phone_request',
                            sender_id: user.id,
                            receiver_id: receiver_id,
                            noti_message: noti_message,
                            senderName: tokens[0].username,
                            created: created.toString(),
                            senderImage: config.server_image_path + tokens[0].picture
                        }

                        // save notification
                        var values = ['phone_request', user.id, receiver_id, new_id, noti_message, 0, created];
                        db.query("INSERT INTO bz_noti(noti_type, sender_id, receiver_id, reference_id, noti_message, state, created) VALUES ( ? )",[values], function(err, result_noti){
                            if (err){
                                var message = "Sorry! Error occurred in Show phone number request.";
                                common.sendFullResponse(res, 300, bad_result, message);
                            }
                            if(tokens[0].receiver_state == 6){
                                var message = "Sorry! Receiver account blocked."
                                common.sendFullResponse(res, 300, bad_result, message)
                            }else{
                                common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayNotiData, function(response){
                                    // var message = "Message send successfully."
                                    common.sendFullResponse(res, 200, arrayNotiData, response)
                                })
                            }


                        })
                    })

                })
            }else{
                if(data[0].state == 0){
                    var good_result = {}
                    var message = "you sent already phone number shower request."
                    common.sendFullResponse(res, 200, good_result, message)
                }else{
                    var request_id = data[0].id
                    // update state = 1
                    db.query("UPDATE bz_show_phone SET state = 0 WHERE sender_id = ? and receiver_id = ?", [user.id, receiver_id], function(err) {
                        if (err){
                            var message = "Sorry! Error occurred in Show phone number request.";
                            common.sendFullResponse(res, 300, bad_result, message);
                        }

                        // get push token
                        var sql = 'SELECT pushToken as sender_token, username, picture, (SELECT pushToken FROM users WHERE id = ?) as receiver_token, (SELECT state FROM users WHERE id = ?) as receiver_state FROM users WHERE id = ?';
                        var filter = [receiver_id, receiver_id, user.id];
                        db.query(sql, filter, function(err, tokens) {
                            if (err){
                                var message = "Sorry! Error occurred in Database.";
                                common.sendFullResponse(res, 300, bad_result, message);
                            }
                            var noti_message = tokens[0].username + " asked you to show your phone number"
                            var arrayNotiData = {
                                show_id : request_id,
                                actionType: 'phone_request',
                                sender_id: user.id,
                                receiver_id: receiver_id,
                                noti_message: noti_message,
                                senderName: tokens[0].username,
                                created: created.toString(),
                                senderImage: config.server_image_path + tokens[0].picture
                            }

                            // save notification
                            var values = ['phone_request', user.id, receiver_id, request_id, noti_message, 0, created];
                            db.query("INSERT INTO bz_noti(noti_type, sender_id, receiver_id, reference_id, noti_message, state, created)",[], function(err, result_noti){
                                if (err){
                                    var message = "Sorry! Error occurred in Show phone number request.";
                                    common.sendFullResponse(res, 300, bad_result, message);
                                }

                                if(tokens[0].receiver_state == 6){
                                    var message = "Sorry! Receiver account blocked."
                                    common.sendFullResponse(res, 300, bad_result, message)
                                }else{
                                    common.sendMessageThroughFCM(res, tokens[0].sender_token, tokens[0].receiver_token, arrayNotiData, function(response){
                                        common.sendFullResponse(res, 200, arrayNotiData, response)
                                    })
                                }
                            })
                        })
                    })
                }
            }
        })



    })
}

exports.blockRequest = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (req.body.target_id == undefined) {
            var message = "Sorry! Error empty selected user."
            console.log(message)
            common.sendFullResponse(res, 300,bad_result, message)
        }

        var receiver_id = req.body.target_id
        db.query("SELECT * FROM bz_block WHERE sender_id = ? and receiver_id = ?", [user.id, receiver_id], function(err, data){

            if (err){
                var message = "Sorry! Error occurred in block user.";
                common.sendFullResponse(res, 300, bad_result, message);
            }

            var created = Date.now()
            if(data.length == 0){
                // insert request
                var values = [user.id, receiver_id, created]
                db.query("INSERT INTO bz_block(sender_id, receiver_id, created) VALUES(?)", [values], function(err, result) {
                    if (err){
                        var message = "Sorry! Error occurred in block user request.";
                        common.sendFullResponse(res, 300, bad_result, message);
                    }
                    var good_result = {}
                    var message = "Block user request sent successfully."
                    common.sendFullResponse(res, 200, good_result, message)
                })
            }else{
                var good_result = {}
                var message = "you sent already block user request."
                common.sendFullResponse(res, 200, good_result, message)
            }
        })

    })
}

exports.myPhoneViewers = function(req, res) {
    common.checkAudentication(req, res, function(user) {

        var bad_result = {};
        var sql = "SELECT a.id, b.username, b.picture, a.state FROM bz_show_phone a LEFT JOIN users b ON a.receiver_id = ? and a.sender_id = b.id ORDER BY a.created DESC "
        db.query(sql, user.id, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in show my phone number to .";
                common.sendFullResponse(res, 300,bad_result, message);
            }
            if(result.length == 0){
                var message = "Sorry! Error occurred in show my phone number to .";
                common.sendFullResponse(res, 300,bad_result, message);
            }else{
                var photo_url = config.server_image_path;

                var result_arr = [];
                for (var i=0; i < result.length; i ++ ){
                    var temp = {
                        show_id : result[i].id,
                        username : result[i].username,
                        photo : config.server_image_path + result[i].picture,
                        state : result[i].state
                    }
                    result_arr.push(temp)
                }
                var good_result = {
                    users : result_arr
                };
                var message = "get user phone numver shower successfully.";
                common.sendFullResponse(res, 200, good_result, message);
            }
        })
    })
}

exports.acceptPhoneRequest = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (req.body.show_id == undefined) {
            var message = "Sorry! Error empty id."
            console.log(message)
            common.sendFullResponse(res, 300,bad_result, message)
        }

        var show_id = req.body.show_id
        db.query("UPDATE bz_show_phone SET state = 1 WHERE id = ?", show_id, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in accept phone request.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            // remove from notification

            db.query("DELETE FROM bz_noti WHERE noti_type = 'phone_request' and  receiver_id = ? and reference_id = ?", [ user.id, show_id], function(err, result_d) {
                if (err){
                    var message = "Sorry! Error occurred in accept phone request.";
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                // remove from notification

                var good_result = {}
                var message = "Show phone number request accepted successfully."
                common.sendFullResponse(res, 200, good_result, message)
            })
        })

    })
}

exports.rejectPhoneRequest = function (req, res) {
    common.checkAudentication(req, res, function(user) {
        if (req.body.show_id == undefined) {
            var message = "Sorry! Error empty id."
            console.log(message)
            common.sendFullResponse(res, 300,bad_result, message)
        }

        var show_id = req.body.show_id
        db.query("UPDATE bz_show_phone SET state = 2 WHERE id = ?", show_id, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in block user request.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            // remove from notification

            db.query("DELETE FROM bz_noti WHERE noti_type = 'phone_request' and receiver_id = ? and reference_id = ?", [ user.id, show_id], function(err, result_d) {
                if (err){
                    var message = "Sorry! Error occurred in reject phone request.";
                    common.sendFullResponse(res, 300, bad_result, message);
                }
                // remove from notification

                var good_result = {}
                var message = "Show phone number request rejected."
                common.sendFullResponse(res, 200, good_result, message)
            })

        })

    })
}

/* changed by dongjin */
