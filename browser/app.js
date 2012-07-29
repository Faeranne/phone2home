
/**
 * Module dependencies.
 */
var randomstring = require('randomstring');
var QRCode = require('qrcode');
var express = require('express')
  , routes = require('./routes')
  , mongodb = require('mongodb')
  , repl = require('repl');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var servers = {};


var DBSERVER = process.env.DBSERVER;
var DBPASS = process.env.PASS;
var DBUSER = process.env.DBUSER;
var DBNAME = process.env.DB;
// Configuration
var server = new mongodb.Server(DBSERVER,31617, {});
var db = new mongodb.Db(DBNAME, server, {});
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});
db.open(function(err,res){  
  db.authenticate(DBUSER,DBPASS,function(err,res){
  });
});
var idset = extra.db.collection('accounts');
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/phone2home/browser/', routes.browser);
app.get('/phone2home/mobilesetup/:id/:code/', routes.mobilesetup);
app.get('/phone2home/mobile/:url', routes.mobile);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var server = io
  .of('/browser')
  .on('connection',function(socket){
    socket.on('setup', function(event){
      browserid_verify(event.assertion, socket);
      //var url='http://local.projectmakeit.com:3000/phone2home/mobilesetup/'+id+'/'+code;
      //socket.emit('finish',{id:id,code:code});
      //QRCode.toDataURL(url, function(err,uri){
      //  socket.emit('qrcode', uri);
      //});
    });
    socket.on('qrcode', function(event){
      var code = randomstring.generate();
      var id = event.id;
      var url='http://local.projectmakeit.com:3000/phone2home/mobilesetup/'+id+'/'+code;
      QRCode.toDataURL(url, function(err,uri){
        socket.emit('qrcode', uri);
      });
      server[id].
  });
var client = io
  .of('/phone')
  .on('connection', function(socket){
    var id=null;
    socket.on('register', function(event){
      
    });
    socket.on('switch', function(url){
      servers[id].browser.emit('switch',url);
    });
  });
function browserid_verify(assertion, socket){
  var options = {
     host: 'browserid.org',
     port: 80,
     path: '/verify',
     method: 'POST'
  };
  var clientCode = 
  var post = {
  assertion: assertion,
  audience: "local.projectmakeit.com:3000"
  };
  var data = JSON.stringify(post);
  console.log(data);

  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var user = JSON.parse(responseText);
      var email = user.email;
      if(user.status=="okay"){
        console.log('client verified, email '+email);
        idset.findOne({"email":user.email},function (err,data){
          var code=randomstring.generate();
          if(!data){
            var id = randomstring.generate();
            data={"email":email, "id":id, codeset:[code]};
            idset.update({"email":email},data,{upsert:true},function(err,data){});
          }else{
            data.codeset
      }
      console.log('BODY: ' + chunk);
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // write data to request body
  req.write(data);
  req.end();
}
