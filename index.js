    /**
 * Created by OliveTech on 10/26/2017.
 */
    var debug = require('debug')('BuzzeeApp')
    var config = require('./app/config/config')
    var express = require('express')
    var https = require('http')
    var path = require('path')
    var fs = require("fs")
    var logger = require('morgan')
    var cookieParser = require('cookie-parser')
    var bodyParser = require('body-parser')
    var favicon = require('serve-favicon')
    var fileUpload = require('express-fileupload')

    /*
    Create socket
     */
/*
	 var socket_users = require('./socket/socket_users')
    var Socket = require('socket.io')
    var io = Socket(server, {'pingInterval': config.pongInterval, 'pingTimeout': 60000});
*/
    var app = express();
    app.use(fileUpload({limits: { fileSize: 50 * 1024 * 1024, preserveExtension: true }}));

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
    app.use(favicon(__dirname + '/public/images/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());

    // app.use(express.static(path.join(__dirname, 'public')));
    app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));

    var routes = require('./app/routes/index');
    var api = require('./app/routes/api');

    app.use('/', routes);
    app.use('/api', api);

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
    /// catch 404 and forwarding to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }


    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        // res.render('error', {
        //     message: err.message,
        //     error: {}
        // });
        var result = {
            code: 300,
            data: {},
            message: "something error"
        };
        res.send(result);
    });

    app.set('port', process.env.PORT || config.serverPort);

    // var server = app.listen(app.get('port'), function() {
    //     debug('Express server listening on port ' + server.address().port);
    //     console.log('Express server listening on port ' + server.address().port);
    // });

    var server = https.createServer(app).listen(config.serverPort, function () {
            debug('Express server listening on port ' + server.address().port);
            console.log('Express server listening on port ' + server.address().port);
    });

    // io.use(function (socket, next) {
    //         var token = socket.handshake.query.token;
    //         if (token === config.securty_key) {
    //             if (config.debugging_mode) {
    //                 console.log("token valid  authorized", token);
    //             }
    //             next();
    //         } else {
    //             if (config.debugging_mode) {
    //                 console.log("not a valid token Unauthorized to access ");
    //             }
    //             next(new Error("not valid token"));
    //         }
    //     }
    // );

    /**
     * Socket.io event handling
     */
    //require('./socket/socketHandler.js')(io, socket_users, config.debugging_mode, config.pingInterval);