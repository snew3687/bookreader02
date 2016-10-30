var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var bookServer = require('./bookServer.js');
bookServer.initialiseServer(
  {
    booksDocRoot: path.join(__dirname, 'public', 'content', 'books')
	//__dirname + '\\public\\content\\books'
  }
);




app.use(express.static(path.join(__dirname, 'public')));

/**** Commented out express default routes to pick up bookreader routes

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

******/

app.set('view engine', 'jade');

// bookserver routing handling
app.get('/', function(request, response) {
  response.redirect('/default.html');
});

app.get('/bookReader/:bookUri', function(request, response) {
  response.redirect('/bookReader.html?bookUri=' + request.params.bookUri);
});

// Get all book descriptors
app.get('/books/all', function(request, response) {
  var bookUri = request.params.bookUri;
  var allBookDescriptors = bookServer.getAllBookDescriptors();

  response.type('json');
  response
    .status(200)
    .send(allBookDescriptors);
});

// Get book descriptor
app.get('/books/:bookUri', function(request, response) {
  var bookUri = request.params.bookUri;
  var isFetchChapterTitles = request.query.chapterTitles;
  
  var bookDescriptor = bookServer.getBookDescriptor(bookUri, isFetchChapterTitles);

  response.type('json');
  response
    .status(200)
    .send(bookDescriptor);
});

// Get book chapter content as HTML
app.get('/books/:bookUri/chapter/:chapterNumber', function(request, response) {
  var chapterNumber = request.params.chapterNumber;
  var bookUri = request.params.bookUri;
  var chapterContent = bookServer.getBookChapter(bookUri, chapterNumber);

  response.type('html');
  response
    .status(200)
    .send(chapterContent);
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
