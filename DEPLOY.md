# A股分析工具 - 部署指南

## 环境要求

- Node.js >= 16.0
- npm >= 8.0
- PM2 (推荐用于生产环境)

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 启动后端
cd server && npm start

# 新终端启动前端
npm run dev
```

访问 http://localhost:5173

### 生产环境部署

#### 方式一：直接启动

```bash
# 1. 构建前端
npm run build

# 2. 启动后端服务
cd server && npm start
```

访问 http://localhost:3001

#### 方式二：PM2部署（推荐）

```bash
# 1. 安装PM2
npm install -g pm2

# 2. 构建前端
npm run build

# 3. 创建PM2配置文件 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'invest-app',
    cwd: './server',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}

# 4. 启动服务
pm2 start ecosystem.config.js

# 5. 查看状态
pm2 status

# 6. 查看日志
pm2 logs invest-app

# 7. 停止服务
pm2 stop invest-app

# 8. 重启服务
pm2 restart invest-app

# 9. 开机自启
pm2 startup
pm2 save
```

## 环境变量配置

在 `server/.env` 文件中配置：

```env
# 服务端口（默认3001）
PORT=3001

# DeepSeek API密钥（用于AI分析，可选）
# 如不配置，系统将使用本地算法进行分析
DEEPSEEK_API_KEY=your_api_key_here
```

### 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key
4. 将 API Key 填入 `.env` 文件

## Nginx反向代理配置

### 基础配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS 配置（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Docker 部署（可选）

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制前端依赖和源码
COPY package*.json ./
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./

# 安装前端依赖并构建
RUN npm install && npm run build

# 复制后端
COPY server ./server

# 安装后端依赖
WORKDIR /app/server
RUN npm install

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "index.js"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t invest-app .

# 运行容器
docker run -d -p 3001:3001 --name invest-app \
  -e DEEPSEEK_API_KEY=your_api_key \
  invest-app
```

## 目录结构

```
invest/
├── dist/                  # 前端构建产物
├── server/               # 后端服务
│   ├── routes/          # API路由
│   │   ├── analysis.js  # AI分析接口
│   │   ├── favorites.js # 自选股接口
│   │   └── stock.js     # 股票数据接口
│   ├── services/        # 业务逻辑
│   │   ├── aiAnalysisService.js  # AI分析服务
│   │   └── favoritesService.js   # 自选股服务
│   ├── data/            # 数据存储
│   │   └── favorites.json
│   ├── .env             # 环境变量
│   └── index.js         # 入口文件
├── src/                  # 前端源码
│   ├── App.vue          # 主组件
│   ├── main.js          # 入口
│   ├── style.css        # 样式
│   └── services/        # 前端服务
├── package.json          # 前端依赖
└── README.md             # 项目文档
```

## 常见问题

### 1. 端口被占用
```bash
# 查找占用进程
lsof -i:3001
# 杀掉进程
kill -9 <PID>
```

### 2. AI分析不生效
检查 `server/.env` 文件中是否正确配置了 `DEEPSEEK_API_KEY`

### 3. 前端页面空白
确保已执行 `npm run build` 构建前端

### 4. 自选股数据丢失
检查 `server/data/favorites.json` 文件是否存在且有写入权限

### 5. K线数据获取失败
检查网络连接，确保能访问新浪财经API

### 6. 跨域问题
生产环境下后端已配置CORS，如仍有问题请检查Nginx配置

## 性能优化建议

1. **启用 Gzip 压缩** - 在 Nginx 中配置 gzip
2. **静态资源缓存** - 配置浏览器缓存策略
3. **CDN 加速** - 将静态资源部署到 CDN
4. **负载均衡** - 高并发场景可使用 PM2 集群模式

## 安全建议

1. 不要将 `.env` 文件提交到版本控制
2. 定期更新依赖包
3. 配置 HTTPS
4. 限制 API 请求频率
