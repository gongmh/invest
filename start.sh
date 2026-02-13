#!/bin/bash

cd "$(dirname "$0")"

if [ ! -d "dist" ]; then
  echo "❌ 请先运行 ./build.sh 构建项目"
  exit 1
fi

echo "🚀 启动服务器..."
cd server
npm start
