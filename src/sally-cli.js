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
  .description('verify the audit trail file')
  .action(verify)

program.parse(process.argv);

function verify(file, options) {
    var secret = program.secret || process.env.sallySecret;
	if (!secret) {
		console.error('Need the audit trail\'s secret; use --secret [text]');
		return 1;
	}
	new reader({path: file, secret: secret})
		.createReadStream()
		.on('data', function (entry) {
			if (program.verbose)
				console.log(entry);
		})
		.on('error', function (e) {
			console.error(e.message)
			process.exit(2)
		})
		.on('end', function () {
			process.exit(0);
		});
}
