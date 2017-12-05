/**
 * Created by OliveTech on 10/26/2017.
 */
var express = require('express')
var router = express.Router()
var common = require('../config/common')
var fs = require("fs")


/* GET home page. */
router.get('/', function(req, res) {
    var result = {
        code: 200,
        data: 'express'
    };
    console.log(result);
    res.send(result);
});

router.get('/user/:file', function (req, res) {
    var file = req.params.file;
    var dirname = "./public/images/profile/";
    var img = fs.readFileSync(dirname + file);
    res.writeHead(200);//, {'Content-Type': 'image/*'}
    res.end(img, 'binary');
})

router.get('/media/:file', function (req, res) {
    var file = req.params.file;
    var dirname = "./public/media/";
    var media = fs.readFileSync(dirname + file);
    res.writeHead(200);//, {'Content-Type': 'image/*'}
    res.end(media, 'binary');
})

module.exports = router;