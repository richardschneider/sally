# sally

Secure audit logging records the user’s actions on content and enables detection of some forms of tampering with the logs. Sally provides strong cryptographic assurances that data stored before a system compromise cannot be modified after the compromise without detection. 

## Getting started

Install with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install sally

### with express

````
var express = require('express');
var sally = require('sally');

var app = express();
app.use(sally.express({ secret: 'a not secure secret' }));
````

Produces an audit trail of each request that modifies a resource.
