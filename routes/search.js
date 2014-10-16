var express = require('express');
var router = express.Router();
var http = require('http');
var cheerio = require('cheerio');

var fs = require('fs');
var SEARCH_HTML = fs.readFileSync('./views/search.html');
var COURSES_HTML = fs.readFileSync('./views/courses.html');

/* GET search page. */
router.get('/', function(req, res) {

	var socOptions = {
		host: 'websoc.reg.uci.edu',
		path: '/perl/WebSoc'
	};

	var socRequest = http.get(socOptions, function(socResponse) {
		// Buffer the body entirely for processing as a whole
		var bodyChunks = [];
		socResponse.on('data', function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
		}).on('end', function() {
			var htmlBody = Buffer.concat(bodyChunks);
			
			var $ = cheerio.load(htmlBody);

			// Add class to table rows for styling
			$('tr').each(function(i, elem) {
				$(this).addClass('search_tr');
				$(this).children().first().remove();
			});

			// Remove broken URL links
			$('a').each(function(i, elem) {
				var contents = $(this).text();
				$(this).replaceWith(contents);
			});

			// Remove *s that denoted required fields
			// and replace other font elements with contents
			$('font').each(function(i, elem) {
				var contents = $(this).text();
				if(contents == '*') {
					$(this).remove();
				} else {
					$(this).replaceWith(contents);
				}
			});

			var socTable = $.html('form table');

			$ = cheerio.load(SEARCH_HTML);
			$('#submit1').append(socTable);

			res.send($.html());
		});
	});

	socRequest.on('error', function(e) {
		console.log('ERROR: ' + e.message);
	});
});

/* POST search request. */
router.post('/', function(req, res) {
    
    var socOptions = {
		host: 'websoc.reg.uci.edu',
		path: '/perl/WebSoc',
		method: 'POST'
	};

	var socRequest = http.request(socOptions, function(socResponse) {
		// Buffer the body entirely for processing as a whole
		var bodyChunks = [];
		socResponse.on('data', function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
		}).on('end', function() {
			var htmlBody = Buffer.concat(bodyChunks);
			
			var $ = cheerio.load(htmlBody);
			var courses = $.html('.course-list');
			$ = cheerio.load(COURSES_HTML);
			$('#submit1').after(courses);

			// If there is no .course-list, no courses were found
			if(courses == '') {
				$('#submit1').after('No courses found');
			}

			res.send($.html());
		});
	});

	socRequest.on('error', function(e) {
		console.log('ERROR: ' + e.message);
	});

	// Write data to request body
	socRequest.write(serialize(req.body));
	socRequest.end();
});

var serialize = function(obj) {
	var str = [];
	for(var p in obj)
		if (obj.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
	return str.join("&");
}

module.exports = router;