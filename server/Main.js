/* Recommendation server */
process.env.DEBUG = 'dist-recommendations:*';
const debug = require('debug')('dist-recommendations:mirrorHttp');
// const fs = require('fs');
const express = require('express'); // http://expressjs.com/
const morgan = require('morgan'); // https://www.npmjs.com/package/morgan
// { key, inertia, label, data: {} }
const sampleDataSet = require('./sampleDataSet.json');
// const async = require('async');

const config = {
  morgan: ':method :url :req[range] :status :res[content-length] :response-time ms',
  // Below here must matches in Main.js; simulator.js
  port: 4260,
}
const optionsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Needs: GET, OPTIONS, probably HEAD, dont believe can do POST, PUT, DELETE yet but could be wrong about that.
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  // Needs: Range; Not: Authorization; Others are suggested in some online posts
  'Access-Control-Allow-Headers': 'Content-Type, Content-Length, Range, X-Requested-With',
};
const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  server: 'express/sqlite',
  Connection: 'keep-alive',
  'Keep-Alive': 'timeout=5, max=1000', // Up to 5 seconds idle, 1000 requests max
};

// TODO split this to various files
// TODO move these TODO's to git issues
// TODO add sqlite option (for persistance)
// TODO-optimization - will need fast way to figure out which objects are close - see app.get
// -- if you are n away from anchor point y and y is m from x then n is at least m-n away from x
// TODO go thru mitrabiz/server/Main.js - some standard stuff to use there

let items = []

function initialize() {
  // Initialize a data set at start up
  items = sampleDataSet;
}
function save() {
  // Save changes to data - opposite of initialize()
}
function count1s(n) { return n.toString(2).replace(/0/g,"").length; }

function distance(a, b) {
  // TODO-OPT the local "b" should be preconverted to int rather than hex string during initialize
  return count1s(parseInt(a,16) ^ parseInt(b,16));
}

initialize();

const app = express();

app.options('/*', (req, res) => {
  //for (k in corsHeaders) { res.header(k, corsHeaders[k]) }
  res.set(optionsHeaders);
  res.status(200);
});
// Seems to be writing to syslog which is being cycled.
app.use(morgan(config.morgan)); // see https://www.npmjs.com/package/morgan )
app.use(express.json());
app.use((req, res, next) => {
  res.set(responseHeaders);
  if (req.url.length > 1 && req.url.endsWith('/')) {
    req.url = req.url.slice(0, req.url.length - 1);
    console.log(`Rewriting url to ${req.url}`);
  }
  next(); });

app.get('/echo', (req, res) => {
  res.status(200);
  res.json(req.headers);
});

// Expect { key, maxresults }
// TODO can optimize through anchor points see note above
/*
  {
    key: Starting object (if not posted, it will return random results)
    maxresults: How many results to return
  }
*/
app.get('/find', (req, res) => {
    // This is seriously inefficient but optimize later
    const key = req.query.key;
    const maxresults = req.query.maxresults;
    if (key) {
      const results = items
        .map((i) => ({distance: distance(key, i.key), i}))
        .sort((di) => di.distance)
        .filter((di, n) => n < maxresults)
        .map((di) => di.i);
      res.status(200);
      res.json(results);
    } else { // No key.
      const l = items.length;
      results = []
      for (let i=0; i < maxresults; i++) {
        results.push(items[Math.floor(Math.random()*l)]);
      }
      res.status(200);
      res.json(results);
    }
  }
);


// === Fire up the server
const server = app.listen(config.port); // Intentionally same port as Python gateway defaults to, api should converge
debug('Server starting on port %s', config.port);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    debug('A server, probably another copy of this, is already listening on port %s', config.apps.http.port);
  } else {
    debug('Server hit error %o', err);
    throw (err); // Will be uncaught exception
  }
});

