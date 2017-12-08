/**
 * Created by OliveTech on 10/26/2017.
 */
var config = require('../config/config')
var db = require('../config/database')
var Password = require("node-php-password")
var jwt = require("jsonwebtoken")
var _ = require("underscore")
var path = require("path")
var randomString = require('random-string')

var FCM = require('fcm-node');
var fcm = new FCM(config.FCMserverKey);


function sendFullResponse(res, code, data, message){
    var result = {
        code: code,
        data: data,
        message: message
    };
    res.send(result);
}

exports.sendMessageThroughFCM = function(res, senderToken, receiverTokens, data, callback){
    var message = {
        to: receiverTokens,
        priority : "high",
        registrations_ids: receiverTokens,
        data: data
    };
    console.log("*** FCM notification *** ")
    console.log(message)
    fcm.send(message, function(err, response){
        if (err) {
            var message = 'There is an error on sending message To FCM : '+err;
            sendFullResponse1(res, 300,{}, message);
        } else {
            return callback(response)
        }
    });
}

exports.getFileName = function( filename){
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

exports.timeSince = function(date) {
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

exports.validateEmail = function(value) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(value);
}
exports.validatePhone = function(value) {
    var phoneno = /^\+?([0-9]{2})\)?[- ]?([0-9]{3})[- ]?([0-9]{4})[- ]?([0-9]{4})$/;
    return value.match(phoneno);
}
exports.sendData = function(res, data){
    var result = {
        code: 200,
        data: data
    };
    console.log(result);
    res.send(result);
}
exports.sendMessage = function(res, code, message){
    var result = {
        code: code,
        message: message
    };
    console.log(result);
    res.send(result);
}
exports.sendFullResponse = function(res, code, data, message){
    var result = {
        code: code,
        data: data,
        message: message
    };
    res.send(result);

}
function sendFullResponse1(res, code, data, message){
    var result = {
        code: code,
        data: data,
        message: message
    };
    res.send(result);
}
exports.checkAudentication = function(req, res, callback) {
    var bad_result = {

    };
    if(!req.headers['token']){
        var message = 'There is no authenticate token.';
        sendFullResponse1(res, 300,{}, message);
    }
    var token = req.headers['token']
    if (token) {
        jwt.verify(token, config.securty_key, function(err, decoded) {
            if (err) {
                var message = 'There is invalid authenticate token.';
                sendFullResponse1(res, 300,{}, message);
            } else {
                db.query('SELECT * FROM users WHERE mobileToken = ?', token, function(err, userdata) {
                    if (err){
                        var message = "Your token expired, Please login again.";
                        console.log(message);
                        sendFullResponse1(res, 300,bad_result, message);
                    }
                    if(userdata.length == 0){
                        var message = "Your token expired, Please login again.";
                        console.log(message);
                        sendFullResponse1(res, 300, bad_result, message);
                    }else{
                        // return user_id
                        return callback(userdata[0])
                    }
                });

            }
        });

    } else {
        var message = 'No token provided.';
        sendFullResponse1(res, 300,{}, message);
    }
}