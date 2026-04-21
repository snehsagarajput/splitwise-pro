(function() {
  function modifyResponse(responseJSON) {
    function deepIterate(obj, parentKey = null) {
      if (obj !== null && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (parentKey === 'add_expense' && key === 'enabled') {
            obj[key] = true;
          }
          if (typeof value === 'object' && value !== null) {
            deepIterate(value, key);
          }
        });
      }
    }
    if (responseJSON) deepIterate(responseJSON);
    return responseJSON;
  }

  // We are already injected only on splitwise.com due to manifest, 
  // but we verify the hostname just to be completely safe.
  const isSplitwise = window.location.hostname.includes("splitwise.com");

  if (!isSplitwise) return;

  const { fetch: originalFetch } = window;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // Clone and intercept all requests on this domain, 
    // because Splitwise uses relative paths like '/api/v3/...'
    const clone = response.clone();
    try {
      let json = await clone.json();
      json = modifyResponse(json);
      return new Response(JSON.stringify(json), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (err) {
      // Not JSON or parsing failed, return original
      return response;
    }
  };

  const XHR = XMLHttpRequest.prototype;
  const send = XHR.send;
  const open = XHR.open;

  XHR.open = function(method, url) {
    this._url = url;
    return open.apply(this, arguments);
  };

  XHR.send = function() {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4) {
        try {
          let data = JSON.parse(this.responseText);
          data = modifyResponse(data);
          Object.defineProperty(this, 'responseText', { value: JSON.stringify(data) });
          Object.defineProperty(this, 'response', { value: data });
        } catch (e) {}
      }
    });
    return send.apply(this, arguments);
  };
})();