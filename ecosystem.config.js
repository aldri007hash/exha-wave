module.exports = {
  apps: [{
    name: "exha-wave",
    script: "node_modules/.bin/next",
    args: "start",
    max_memory_restart: "500M",
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}
