/**
 * Created by OliveTech on 10/26/2017.
 */

var config;
var DB_HOST, DB_USER, DB_PASS, DB_NAME
    DB_HOST = "localhost"
    DB_USER = "root"
    DB_PASS = ""
    DB_NAME = "goomood_happydemy"

var app_secret_key = "7d3d3b6c2d3683bf25bbb51533ec6dab"

var port = 8442
var duration_time = 86400 //60 * 60 * 24
    DB_HOST = "localhost"
    DB_USER = "goomood_dongjin"
    DB_PASS = "Chengge111!"
    DB_NAME = "goomood_dev"
    port = 8443

config = {
    db_host : DB_HOST,
    db_user : DB_USER,
    db_pass : DB_PASS,
    db_name : DB_NAME,
    securty_key : "goomoodchatappbuzzee",
    FCMserverKey : "AAAAAgoYTNI:APA91bG81FXZ6a1QcKEj-rSbKl0wC1-41rlvSP-SvkKecJ9x_dAuUVt_DN5RjomNHyKUAKhriEOAYUMrTyV68vHR1meFLQKk6jOHuvDXlKdtVvVpUFrawnpLEJMQ0bXJ8eTHffw6V6l-",
    server_url : "http://development.happydemy.com:8443/",
    server_image_path : "http://development.happydemy.com:8443/user/",
    server_media_path : "http://development.happydemy.com:8443/media/",
    pongInterval : 25000,
    message_duration_time : duration_time,
    serverPort : port,
    debugging_mode : true,


};

module.exports = config;