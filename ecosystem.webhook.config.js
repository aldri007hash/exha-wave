module.exports = {
  apps: [{
    name: "webhook",
    script: "webhook",
    args: "-hooks /etc/webhook/hooks.json -port 9000 -verbose",
    autorestart: true,
  }]
}
