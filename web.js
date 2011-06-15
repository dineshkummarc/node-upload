/**
 * Module dependencies.
 */

var express = require('express');
var formidable = require('formidable');
var fs = require('fs');
var knox = require('knox');

var client = knox.createClient({
    key: '1YFPB3MTZ5K1GMZ1FJ02', 
    secret: 'je7VPPY0cupCQPdtuG1b8tsD0c7wkACxfaakzoQj', 
    bucket: 'node-test',
    port: 443
   
});

var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.redirect('/demo-form');
})

app.get('/demo-form', function(req, res) {
	res.send('<form action="/video" method="post" enctype="multipart/form-data">' + '<p>Image: <input type="file" name="video" /></p>' + '<p><input type="submit" value="Upload" /></p>' + '</form>');
});

app.post('/video', function(req, res, next) {

	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) {
			next(err);
		} else {
			console.log('\nuploaded %s to %s', files.video.filename, files.video.path);
			
			// send file to amazon
            fs.readFile(files.video.path, function(err, buf){
              if(err){
                  console.log("error:");
                  console.dir(err)
                  next();
              }
             console.log("Send file to amazon");
              var amazon_req = client.put(files.video.path, {
                  'Content-Length': buf.length
                , 'Content-Type': 'text/plain'
              });
              amazon_req.on('response', function(amazon_res){
                  console.log("amazone §xxxxxxxxxxxxxxxxxx");
                  console.log(amazon_res.statusCode);
                  console.log(amazon_res.headers);
                  console.log(amazon_res.body);
                  
                if (200 == amazon_res.statusCode) {
                  console.log('saved to amazon on: %s', amazon_req.url);
                }
              });

              amazon_req.on('error', function(err){
                  console.log('amazon error: %s', err);
                  next();
              });
              console.log("amazon request");
              console.dir(amazon_req);
              amazon_req.end(buf);
            });
            fs.rename(files.video.path, "./public/" + files.video.filename);    
			res.redirect(files.video.filename);
		}
	});

	// We can add listeners for several form
	// events such as "progress"
	form.on('progress', function(bytesReceived, bytesExpected) {
		var percent = (bytesReceived / bytesExpected * 100) | 0;
		console.log("Got %s of %s bytes", bytesReceived, bytesExpected);
	});

});

app.listen(process.env.PORT || 3000);
console.log('Express app started on port 3000');
