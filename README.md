# sally [![Build Status](https://travis-ci.org/richardschneider/sally.svg?branch=master)](https://travis-ci.org/richardschneider/sally)

Secure audit logging records the user’s actions on content and enables detection of some forms of tampering with the logs. Sally provides strong cryptographic assurances that data stored before a system compromise cannot be modified after the compromise without detection. 

## Getting started [![npm version](https://badge.fury.io/js/sally-js.svg)](https://badge.fury.io/js/sally-js)

Install with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install sally-js

### with express

```` javascript
var express = require('express');
var sally = require('sally-js');

var app = express();
app.use(sally.express({ secret: 'a not secure secret' }));
````

Produces an audit trail of each request that modifies a resource or returns an error status code (4xx or 5xx).

```` javascript
{ audit: 
   { who: 'anonymous',
     when: '2015-11-12T05:38:22.159Z',
     where: 
      { client: '::ffff:127.0.0.1',
        host: '127.0.0.1:33578',
        server: 'richardschneider-sally-2123745' },
     why: 'POST',
     what: '/something/2',
     status: 201 },
  digest: 'DVSJZKM0xASOu76y3X/VNjZ4FuTb/P3OXW9MiS5vV/w=' }
  
{ audit: 
   { who: 'anonymous',
     when: '2015-11-07T11:00:06.005Z',
     where: { server: 'RoadWarrior' },
     why: 'GET',
     what: '/something/unknown',
     status: 404 },
  digest: 'xUTQHAbg8W+mZkRy4zsUs8bVw2NK/e0JZd/vNbkujRg=' }
````
`sally.express()` takes th following options object

property | description
-------- | -----------
methods | An `array` of HTTP method that will trigger an audit.  Any status above 399 will also trigger an audit.  The default is `['POST', 'PUT', 'DELETE', 'PATCH']`.
user | a `function(req)` that should return the user name or ID or both.  Defaults to `req => 'anonymous'`.
hostname | The name of the server.  Defaults to `os.hostname()`.
prefix | A prefix for each audit log file.  Defaults to `'express-'`.


### with javascript

```` javascript
var sally = require('sally');
new sally.AuditTrail({ secret: 'a not secure secret' });

sally.log('hello world');
sally.log({ user: 'x', operation: 'login'})
````

### with command line

````
sally --help

  Usage: sally-cli <cmd>

  Commands:

    verify <file>  verify the audit trail file, glob wildcards allowed
    list <file>    petty print the audit trail file

  Secure audit log manager

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -s, --secret [text]  the secret for the audit trail, defaults to the environment variable "sallySecret"
    -v, --verbose        verbose
````

## Secret

Sally uses the `secret` to generate the HMAC digest which provides the strong cryptographic assurances.  It can be set with `sally.configure({ secret: ...})` or with `sally.express({ ... })`.  However, this means that the `secret` is in your code and possible also in the repo.  

To avoid the above issue, Sally will use the value of the environment variable `SallySecret`, if present, as the secret value.
