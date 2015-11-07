'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var sally = require('../src/sally');

var app = express();
app.use(sally.express({ }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('json spaces', 2);

var repo = {};
var nextId = 1;

app.post('/:type', function(req, res, next) {
    var now = new Date();
    
	var url = '/' + req.params.type + '/' + nextId++;
	repo[url] = req.body;
	
	res
		.status(201)
		.location(url)
		.send({ status: 'ok', self: url})
		.end();
});

app.get('/:type/:id', function(req, res, next) {
	var entity = repo['/' + req.params.type + '/' + req.params.id];
	if (!entity)
		return res.status(404).end();
            
	res
		.send(entity)
		.end();
});

module.exports = app;
