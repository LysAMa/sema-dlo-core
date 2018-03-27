var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var seama_user = require('./routes/seama_user');
var seama_kiosks = require('./routes/seama_kiosks');
var seama_water_quality = require('./routes/seama_water_quality');
var session = require('express-session');
var dbService = require('./seama_services/db_service').dbService;

var app = express();
app.use(session({ secret: 'seama-secret-token', cookie: { maxAge: 60000 }}));

app.use(function (req, res, next) {
//    console.log("dbService");
    dbService( req, res, next);

});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/seama_user', seama_user);
app.use('/seama_kiosks', seama_kiosks);
app.use('/seama_water_quality', seama_water_quality);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// ------------Seam development ---------------
// For development, return mock data rather than DB access
    app.set('mockIt', false);

module.exports = app;
