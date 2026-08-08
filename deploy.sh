#!/bin/bash
cd /root/exha-wave
git pull origin main
rm -rf .next node_modules/.cache
npm run build
pm2 restart exha-wave
systemctl reload nginx
echo "Deploy selesai pada $(date)" >> /var/log/exha-deploy.log
