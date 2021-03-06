/**
 * Module dependencies.
 */

var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var knox = require('knox');
var querystring = require('querystring');
var http = require('http'),
    io = require('socket.io') // for npm, otherwise use require('./path/to/socket.io')


var client = knox.createClient({
  key: 'AKIAJBLFFICH3KAG7HJQ',
  secret: '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',
  bucket: 'node-test'

});
var ws_client;

var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.set('view options', {
  layout: false
});
app.get('/', function(req, res) {
  res.redirect('/demo-form');
});

app.get("/what", function(req, res){
  res.redirect('/tjena.html');
});


app.get('/success/:file', function(req, res) {
    console.dir(req.params)
    res.send("<p>File uploaded to " + req.params.file + "</p>");
});

app.get('/demo-form', function(req, res) {
	res.render('form.html');
});

app.post('/video', function(req, res, next) {

  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
      var path_to_s3 = "init";
    if (err) {
      next(err);
    } else {
      console.log('\nuploaded %s to %s', files.video.filename, files.video.path);
      // send file to amazon
      fs.readFile(files.video.path, function(err, buf) {
        console.log("Send file to amazon");
          path_to_s3 =  querystring.escape(files.video.filename);
          console.log("path_to_s3 %s", path_to_s3);
        var amazon_req = client.put(path_to_s3, {
          'Content-Length': buf.length,
          'Content-Type': 'text/plain'
        });

        // res.redirect('/success/'+ querystring.escape(path_to_s3));


        amazon_req.on('response', function(amazon_res) {
          amazon_res.on('data', function(chunk) {
            console.log('amazon chunk: %s', chunk);
          });

          if (200 == amazon_res.statusCode) {
            console.log('saved to amazon on: %s', amazon_req.url);
		}
        });

        amazon_req.on('data', function(chunk) {
          console.log('amazon on data: %s', chunk);
        });

        amazon_req.on('error', function(err) {
          console.log('amazon error: %s', err);
        });
        amazon_req.end(buf);
      });
    }
  });

  // We can add listeners for several form
  // events such as "progress"
  form.on('progress', function(bytesReceived, bytesExpected) {
	console.log("bytesReceived: ", bytesReceived);
    var percent = (bytesReceived / bytesExpected * 100) | 0;
	ws_client.send("bytesReceived: " + percent); ;
  });

});

// socket.io
var socket = io.listen(app);
socket.on('connection', function(client){
	ws_client = client;
	// new client is here!
	console.log('new connection!');
	client.on('message', function(msg){
		console.log('sent message: %s', msg)
		client.send("wheeeeee") ;
	});
	client.on('disconnect', function(){ console.log('disconnect') });
});

app.listen(process.env.PORT || 3000);
console.log('Express app started on port 3000');
