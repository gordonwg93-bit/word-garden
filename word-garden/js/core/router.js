/* =========================================================
   router.js
   Tiny hash-router. Each screen module registers a render
   function; adding a new screen = one new file + one line
   here, nothing else to touch.
   ========================================================= */
const Router = (() => {
  const routes = {};
  const root = document.getElementById('app');

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function navigate(name, params = {}) {
    window.location.hash = `${name}${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`;
  }

  async function _renderFromHash() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const [name, query] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    const renderFn = routes[name] || routes['home'];
    root.innerHTML = '';
    window.scrollTo(0, 0);
    await renderFn(root, params);
  }

  function start() {
    window.addEventListener('hashchange', _renderFromHash);
    _renderFromHash();
  }

  return { register, navigate, start };
})();
