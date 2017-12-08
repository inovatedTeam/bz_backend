/**
 * Created by OliveTech on 10/27/2017.
 */
// var FCM = require('fcm-node');
var common = require("../config/common")
var config = require('../config/config')
var db = require('../config/database')
var jwt = require("jsonwebtoken")
var path = require("path")


function sendNotification(res, result){
    var result_arr = [];
    for (var i=0; i < result.length; i ++ ){
        var temp = {
            noti_id : result[i].id,
            noti_type : result[i].noti_type,
            sender_id : result[i].sender_id,
            receiver_id : result[i].receiver_id,
            reference_id : result[i].reference_id,
            noti_message : result[i].noti_message,
            state : result[i].state,
            created : result[i].created,
            sender_name : result[i].username,
            sender_picture : config.server_image_path + result[i].picture,
        }
        result_arr.push(temp)
    }
    var good_result = {
        notifications : result_arr
    };
    var message = "get notification successfully.";
    common.sendFullResponse(res, 200, good_result, message);
}

exports.getNotification = function(req, res) {
    common.checkAudentication(req, res, function(user) {
        var bad_result = {};

        var sql = "SELECT a.*, b.username, b.picture FROM bz_noti a LEFT JOIN users b ON a.sender_id = b.id"
            + " AND a.receiver_id = ? AND a.state = 0 ";
        var filter = [user.id];
        db.query(sql, filter, function(err, result) {
            if (err){
                var message = "Sorry! Error occurred in Database.";
                common.sendFullResponse(res, 300, bad_result, message);
            }
            sendNotification(res, result)
        });
    })
}


/* changed by dongjin */
