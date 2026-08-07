/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://exhawave.com',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin/*', '/api/*', '/dashboard/*'],
}
