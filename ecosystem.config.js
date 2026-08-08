module.exports = {
  apps: [{
    name: "exha-wave",
    script: "node_modules/.bin/next",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    max_memory_restart: "500M",
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: "https://exhawave.com",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
      UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
      UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
      MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
      MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    },
  }]
}
