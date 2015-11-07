# sally

Secure audit logging records the user’s actions on content and enables detection of some forms of tampering with the logs. Sally provides strong cryptographic assurances that data stored before a system compromise cannot be modified after the compromise without detection. 

## Getting started

Install with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install sally

### with express

```` javascript
var express = require('express');
var sally = require('sally');

var app = express();
app.use(sally.express({ secret: 'a not secure secret' }));
````

Produces an audit trail of each request that modifies a resource or returns an error status code (4xx or 5xx).

```` javascript
{ audit: 
   { who: 'anonymous',
     when: '2015-11-07T11:00:05.144Z',
     where: { client: '127.0.0.1', server: 'RoadWarrior' },
     why: 'POST',
     what: '/something/1',
     status: 201 },
  digest: 'Cw/SVbIILwW2jHcNVaIrlJE2OevrfBc9vdRtfkEkOAQ=' }

{ audit: 
   { who: 'anonymous',
     when: '2015-11-07T11:00:06.005Z',
     where: { server: 'RoadWarrior' },
     why: 'GET',
     what: '/something/unknown',
     status: 404 },
  digest: 'xUTQHAbg8W+mZkRy4zsUs8bVw2NK/e0JZd/vNbkujRg=' }
````
