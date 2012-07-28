
/**
 * Module dependencies.
 */
var randomstring = require('randomstring');
var QRCode = require('qrcode');
var express = require('express')
  , routes = require('./routes')
  , repl = require('repl');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var servers = {};
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/code/:code', routes.code);
app.get('/mobile', routes.control);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var server = io
  .of('/browser')
  .on('connection',function(socket){
    socket.on('register',function(event){
      if(servers[event.id].code==event.code){
        servers[event.id].browser=socket;      
      }
    });
    socket.on('setup', function(event){
      var code = randomstring.generate();
      servers[event.id]={code:code,browser:socket};
      QRCode.toDataURL(url, function(err,uri){
        socket.emit('qrcode', uri);
      });
    });
  });
var client = io
  .of('/phone')
  .on('connection', function(socket){
    socket.on('register', function(event){
      if(servers[event.id].code==event.code){
        servers[event.id].phone=socket
      }
    });
  });
       
