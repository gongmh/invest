# A股分析工具 - 部署指南

## 环境要求

- Docker
- Docker Compose（可选）

## Docker 部署（推荐）

### 方式一：使用 Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/gongmh/invest.git
cd invest

# 2. 创建环境变量文件（可选）
cat > .env << EOF
DEEPSEEK_API_KEY=your_api_key_here
EOF

# 3. 构建并启动
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 方式二：使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t invest-app .

# 2. 运行容器
docker run -d \
  --name invest-app \
  -p 3001:3001 \
  -e DEEPSEEK_API_KEY=your_api_key_here \
  -v $(pwd)/server/data:/app/server/data \
  invest-app

# 3. 查看日志
docker logs -f invest-app

# 4. 停止容器
docker stop invest-app

# 5. 删除容器
docker rm invest-app
```

### 端口说明

默认端口为 3001，如需修改：

```bash
# Docker Compose 方式：修改 docker-compose.yml 中的 ports
ports:
  - "8080:3001"  # 改为 8080 端口

# Docker 命令方式：修改 -p 参数
docker run -d -p 8080:3001 ...
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3001 |
| DEEPSEEK_API_KEY | DeepSeek API 密钥 | 无 |

### 获取 DeepSeek API Key

1. 访问 https://platform.deepseek.com/
2. 注册并登录账号
3. 在 API Keys 页面创建新的 API Key

## 数据持久化

自选股数据存储在 `server/data/favorites.json`，使用 Docker 卷挂载保证数据持久化：

```bash
# Docker Compose 已自动配置
volumes:
  - ./server/data:/app/server/data

# Docker 命令方式
-v $(pwd)/server/data:/app/server/data
```

## Nginx 反向代理配置

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

## 常用命令

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs -f invest-app

# 进入容器
docker exec -it invest-app sh

# 重启容器
docker restart invest-app

# 更新部署
git pull
docker-compose down
docker-compose up -d --build
```

## 常见问题

### 1. 端口被占用
```bash
# 查找占用进程
lsof -i:3001
# 或修改端口
docker-compose.yml 中修改 ports 配置
```

### 2. AI 分析不生效
检查是否配置了 `DEEPSEEK_API_KEY` 环境变量

### 3. 数据丢失
确保使用了数据卷挂载：`-v ./server/data:/app/server/data`

### 4. 构建失败
```bash
# 清理 Docker 缓存重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 安全建议

1. 不要将 `.env` 文件提交到版本控制
2. 配置 HTTPS
3. 使用防火墙限制端口访问
4. 定期更新 Docker 镜像
