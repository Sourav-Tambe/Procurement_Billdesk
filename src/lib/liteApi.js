// procure-web-lite: there is no server. Every /api/ call is answered here, in the browser:
// - loads and normal saves → "offline" (503): V3's store keeps working on its browser copy (it was built for that),
//   budget moves apply locally, "Needs attention" runs the same rules on the browser copy
// - saves a screen waits on (quote-only vendor, vendor KYC link) → echoed back as saved
// - photo uploads → kept in the browser as an object URL
if (typeof window !== 'undefined' && !window.__procureLite) {
  window.__procureLite = true
  const real = window.fetch.bind(window)
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url
    if (!/^\/api\//.test(url)) return real(input, init)
    const method = (init.method || 'GET').toUpperCase(), path = url.replace(/^\/api\/v2\/procure\//, '').replace(/\?.*$/, '')
    if (path.startsWith('uploads')) return json({ url: URL.createObjectURL(init.body) })
    if (method === 'POST' && path === 'vendor-links/') return json({ token: `lite-${Date.now().toString(36)}`, url: `${location.origin}/procure/vendor-register/lite/` })
    if (method === 'POST' && path === 'vendors/') { const row = Object.fromEntries(Object.entries(JSON.parse(init.body || '{}')).filter(([k]) => !k.startsWith('_'))); return json(row) }
    return json({ message: 'Lite mode · saved in this browser only' }, 503)
  }
}
export {}
