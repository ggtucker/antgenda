var express = require('express');
var router = express.Router();
var http = require('http');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'ANTgenda' });
});

module.exports = router;