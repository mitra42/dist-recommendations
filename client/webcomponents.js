// ===== STANDARD PART IN ON mitrabiz/webcomponents.js and dist-recommendations/webcomponents.js, and promise-oriented in simulator.js}

function GET(httpurl, opts, cb ) {
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
  fetch(req)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`${httpurl} ${response.status}: ${response.statusText}`);
      } else if (!response.headers.get('Content-Type').startsWith('application/json')) {
        throw new Error(`Query for ${httpurl} Did not return JSON`);
      } else {
        return response.json(); // Promise resolving to json
      }
    })
    .then((json) => cb(null, json))
    .catch(err => {
      cb(err); // Tell queue done with an error
    });
}

// Standardish routing to allow nesting Elements inside JS
function EL(tag, attributes = {}, children) {
  const el = document.createElement(tag);
  Object.entries(attributes)
    .forEach((kv) => {
      if (['textContent', 'onsubmit', 'onclick', 'innerHTML', 'style'].includes(kv[0])) {
        el[kv[0]] = kv[1];
      } else if (typeof(kv[1]) === 'object') { // e.g. tagcloud, data
        el.state[kv[0]] = kv[1];
      } else {
        el.setAttribute(kv[0], kv[1]);
      }
    });
  if (children) {
    if (Array.isArray(children)) {
      el.append(...children.flat(3).filter(n => !!n));
    } else {
      el.append(children);
    }
  }
  return el;
}
// Get a suitable URL for a query passed as an object
function getUrl(domain, q) {
  const query = Object.entries(q).map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&');
  return query.length ? `${domain}?${query}` : domain;
}
// Wrapped around element tree to replace it with Error message or loading warning
const ErrorLoadingWrapper = ({url, qdata, err}, children) => (
  err
    ? EL("div", {class: "error"},[`Error on ${url}`, EL("br"), err.message])
    : !qdata
    ? EL("span", { textContent: "Loading..."})
    : children
);

// Parent class for extending HTMLElement for a new element
class HTMLElementExtended extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.state = {}; // Equivalent of React .state
  }
  loadSetRenderAndReplace(url, q, cb) {
    GET(getUrl(url, q), {}, (err, data) => {
      this.setState({url, err, data});
      this.renderAndReplace();
      if (cb) cb(err); // Usually there is no extra CB
    });
  }
  changeAttribute(name, newValue) {
    if ((name === "visible") && (newValue === "false")) newValue = false;
    this.state[name] = newValue;
  }
  setState(obj) {
    Object.keys(obj).forEach(k => this.changeAttribute(k, obj[k]));
    // Never calling loadContent() from here as setState is called from loadContent!
  }
  shouldLoadWhenConnected() { return false; } // Overridden with condition to initiate load
  connectedCallback() {
    this.constructor.observedAttributes
      .forEach(name => this.changeAttribute(name, this.getAttribute(name)));
    if (this.shouldLoadWhenConnected()) this.loadContent();
    this.renderAndReplace();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.changeAttribute(name, newValue);
    if (this.isConnected && this.constructor.observedAttributes.includes(name) && this.shouldLoadWhenConnected()) {
      this.loadContent(); }
    this.renderAndReplace(); // note this happens before the loadContent completes
  }

  renderAndReplace(styleNodes=1) {
    const rendered = [ this.render() ];
    while (this.shadowRoot.childNodes.length > styleNodes) this.shadowRoot.childNodes[styleNodes].remove()
    this.shadowRoot.append(...rendered.flat(3).filter(n=>!!n));
  }
}
// ===== END OF STANDARD PART IN webcomponents.js ON mitrabiz and dist-recommendations
