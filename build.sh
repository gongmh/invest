#!/bin/bash

echo "🚀 开始构建前端..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 前端构建失败"
  exit 1
fi

echo "✅ 前端构建完成"
echo "🎉 部署准备完成！"
echo ""
echo "启动方式："
echo "  开发环境: npm run dev"
echo "  生产环境: cd server && npm start"
echo "  PM2部署:  pm2 start ecosystem.config.js"
