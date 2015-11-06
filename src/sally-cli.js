#! /usr/bin/env node
/*
 * sally-cli
 * https://github.com/richardschneider/sally
 *
 * Copyright (c) 2015 Richard Schneider
 * Licensed under the MIT license.
 */

'use strict';

var program = require('commander');
var process = require('process');
var Glob = require("glob").Glob
var fs = require('fs');
var reader = require('./reader');

program
  .version(require('../package.json').version)
  .usage('<cmd>')
  .description('Secure audit log manager')
  .option('-s, --secret [text]', 'the secret for the audit trail, defaults to the environment variable "sallySecret"')
  .option('-v, --verbose', 'verbose')
  
program
  .command('verify <file>')
  .description('verify the audit trail file, glob wildcards allowed')
  .action(verify)

program.parse(process.argv);
if (!program.args.length) program.help();

function verify(pattern, options) {
	var didSomething = false;
	var glob = new Glob(pattern, { strict: true })
	glob
		.on('match', function(path) {
			didSomething = true;
			verifyFile(path, options);
		})
		.on('error', function (e) {
			console.error(e.message)
			process.exitCode = 1;
		})
		.on('end', function () {
			if (!didSomething) {
				console.error('No files were processed')
				process.exitCode = 1;
			}
		});
}

function verifyFile(path, options) {
    var secret = program.secret || process.env.sallySecret;
	if (!secret) {
		console.error('Need the audit trail\'s secret; use --secret [text]');
		process.exitCode = 1;
		return;
	}
	if (program.verbose)
		console.log("Verifying", path);
	
	new reader({path: path, secret: secret})
		.createReadStream()
		.on('data', function (entry) {
		})
		.on('error', function (e) {
			console.error(e.message)
			process.exitCode = 1;
		})
		.on('end', function () {
			if (program.verbose)
				console.log("Passed", path);
		});
}
