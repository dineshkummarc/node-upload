/**
 * Module dependencies.
 */

var express = require('express');
var formidable = require('formidable');

var fs = require('fs');

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
			fs.rename(files.video.path,"./public/" + files.video.filename);
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
