// Bill Desk lite: DC → invoice → head check → Finance, with no database. Seed DCs from Naveen's Diet & Kitchen build + the browser.
module.exports = {
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  // open the dev server from a tablet on the same Wi-Fi (Sourav, 25 Oct)
  allowedDevOrigins: ['192.168.29.238', '*.local'],
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  compiler: { emotion: true },
  async redirects() { return [{ source: '/', destination: '/bill-desk/', permanent: false }] }
}
