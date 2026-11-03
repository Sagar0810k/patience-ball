/** @type {import('next').NextConfig} */
const config = {
  env: { NEXT_PUBLIC_BUILD_ID: String(Date.now()) },
  reactStrictMode: false, // physics world is created once; strict-mode double mount would double-init
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }];
  },
};

export default config;
