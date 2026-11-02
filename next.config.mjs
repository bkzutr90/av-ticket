/** @type {import('next').NextConfig} */
const nextConfig = {
  // Driver MongoDB memakai modul native; biarkan Node yang me-load, jangan di-bundle
  serverExternalPackages: ['mongodb'],
};
export default nextConfig;
