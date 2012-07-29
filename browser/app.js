
/**
 * Module dependencies.
 */
var randomstring = require('randomstring');
var QRCode = require('qrcode');
var express = require('express')
  , routes = require('./routes')
  , mongodb = require('mongodb')
  , repl = require('repl')
  , https = require('https');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var servers = {};


var DBSERVER = process.env.DBSERVER;
var DBPASS = process.env.PASS;
var DBUSER = process.env.DBUSER;
var DBNAME = process.env.DB;
// Configuration
var server = new mongodb.Server(DBSERVER,35907, {});
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
var idset = db.collection('accounts');
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/phone2home/browser/', routes.browser);
app.get('/phone2home/browsersetup/', routes.browsersetup);
app.get('/phone2home/mobilesetup/:id/:code/:name/', routes.mobilesetup);
app.get('/phone2home/mobile/:url', routes.mobile);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var brower = io
  .of('/browser')
  .on('connection',function(socket){
    socket.on('verify', function(event){
      browserid_verify(event.assertion, event.name, socket);
    });
    socket.on('link', function(event){
        console.log(event);
        
        idset.findOne({"id":event.id},function (err,data){
        if(!data){
          console.log("no data");
          return;
        }
        for(code in data.codeset){
          console.log(data.codeset[code].code);
          if(event.code==data.codeset[code].code){
            if(!servers[data.id]){
              servers[data.id]=[];
            }
            servers[data.id].push(socket);
            console.log(data.id);
            socket.set('id', data.id);
            break;
          }
        }
        console.log('check done');
        
      });
    });
    socket.on('qrcode', function(event){
      var name = event.name;
      var id = event.id;
      var code = randomstring.generate();
      console.log(id);
      var url='http://local.projectmakeit.com:3000/phone2home/mobilesetup/'+id+'/'+code+'/'+name+'/';
      QRCode.toDataURL(url, function(err,uri){
        socket.emit('qrcode', uri);
      });
      idset.findOne({"id":id},function (err,data){
        console.log(data);
        data.codeset.push({code:code,name:name});
        socket.emit('included');
        idset.update({"id":id},data,{upsert:true},function(err,data){});
      });
    });
  });
var phone = io
  .of('/phone')
  .on('connection', function(socket){
    socket.on('setup', function(event){
      idset.findOne({"id":event.id},function (err,data){
        for(code in data.codeset){
          console.log(data.codeset[code].code);
          if(event.code==data.codeset[code].code){
            if(!servers[event.id]){
              servers[event.id]=[];
            }
            console.log("set up");
            
            socket.set('id', event.id);
            console.log(servers[event.id]);
            for(linkage in servers[event.id]){        
              servers[event.id][linkage].emit('switch',event.url);
            }
            break;
          }
        }
      });
    });
    socket.on('switch', function(event){
      console.log(servers[event.id]);
      
      for(linkage in servers[event.id]){        
        linkage.emit('switch',event.url);
      }
    });
  });
function browserid_verify(assertion, name, socket){
  var post = {
  assertion: assertion,
  audience: "local.projectmakeit.com:3000"
  };
  var data = JSON.stringify(post);
  var options = {
     host: 'browserid.org',
     port: 443,
     path: '/verify',
     method: 'POST',
     headers:{
       "Content-Type": "application/json",
       "Content-Length": data.length
     }
  }; 
  console.log(data);

  var req = https.request(options, function(res) {
    
    
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log(chunk);
      var user = JSON.parse(chunk);
      var email = user.email;
      if(user.status=="okay"){
        console.log('client verified, email '+email);
        idset.findOne({"email":user.email},function (err,data){
          var code=randomstring.generate();
          if(!data){
            var id = randomstring.generate();
            data={"email":email, "id":id, codeset:[{code:code, name:name}]};
            idset.update({"email":email},data,{upsert:true},function(err,data){});
            socket.emit('verified',{id:id,code:code,email:email});
          }else{
            data.codeset.push({code:code,name:name});
            console.log(data.id);
            
            socket.emit('added',{id:data.id,code:code,email:email});
            idset.update({"email":email},data,{upsert:true},function(err,data){});
          }
          socket.set('id',data.id);
        });
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
  

