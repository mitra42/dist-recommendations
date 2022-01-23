const waterfall = require("async/waterfall");
const fetch = require('node-fetch');
const Request = fetch.Request;
const Headers = fetch.Headers;
const config = {
  initialRandom: 10,
  server: 'http://localhost',
  // Below here must matches in Main.js; simulator.js
  port: 4260
}

// ===== STANDARD PART IN ON mitrabiz/webcomponents.js and dist-recommendations/webcomponents.js, and promise-oriented in simulator.js}

async function GET(httpurl, opts) {
  if (typeof httpurl !== 'string') httpurl = httpurl.href;    // Assume its a URL as no way to use "instanceof" on URL across node/browser
  const headers = new Headers();
  if (opts.start || opts.end) headers.append('range', `bytes=${opts.start || 0}-${(opts.end < Infinity) ? opts.end : ''}`);
  // if (opts.noCache) headers.append("Cache-Control", "no-cache"); It complains about preflight with no-cache
  //UNSUPPORTED const retries = typeof opts.retries === 'undefined' ? 12 : opts.retries;
  const init = {    // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
    method: 'GET',
    headers,
    mode: 'cors',
    cache: opts.noCache ? 'no-cache' : 'default', // In Chrome, This will set Cache-Control: max-age=0
    redirect: 'follow',  // Chrome defaults to manual
    keepalive: true    // Keep alive - mostly we'll be going back to same places a lot
  };
  const req = new Request(httpurl, init);
  response = await fetch(req);
  if (!response.ok) {
    throw new Error(`${httpurl} ${response.status}: ${response.statusText}`);
  } else if (!response.headers.get('Content-Type').startsWith('application/json')) {
    throw new Error(`Query for ${httpurl} Did not return JSON`);
  } else {
    return response.json(); // Promise resolving to json
  }
}
// Get a suitable URL for a query passed as an object
function getUrl(domain, q) {
  const query = Object.entries(q).map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&');
  return query.length ? `${domain}?${query}` : domain;
}


// Client fetch random items
// TODO debug this, it returns 6 results
async function main() {
  const domain = `${config.server}:${config.port}/find`;
  try {
    const json = await GET(getUrl(domain, {maxresults: 10}), {});
    console.log('SUCCESS:', json)
  } catch (err) {
    console.log("FAILED:", err);
  }
  console.log("DONE");
}

main();
