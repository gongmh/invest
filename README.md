# A股股票分析工具

一款基于 Vue 3 + Express 的股票分析工具，支持 AI 智能分析、技术指标计算、自选股管理等功能。

## 功能特性

- **股票数据查询** - 支持 A 股和港股实时行情查询
- **AI 智能分析** - 集成 DeepSeek AI 大模型，提供专业的股票分析建议
- **技术指标计算** - 自动计算 MA5/MA10/MA20、RSI 等技术指标
- **K 线图表展示** - 使用 ECharts 绘制专业的 K 线走势图
- **自选股管理** - 支持添加、删除、拖拽排序自选股列表
- **响应式设计** - 完美适配桌面端和移动端

## 技术栈

### 前端
- Vue 3 - 渐进式 JavaScript 框架
- Vite - 下一代前端构建工具
- ECharts - 专业数据可视化图表库
- Axios - HTTP 请求库

### 后端
- Express - Node.js Web 框架
- DeepSeek AI - 大语言模型 API

## 项目结构

```
invest/
├── src/                    # 前端源码
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 应用入口
│   ├── style.css          # 全局样式
│   └── services/          # 服务层
│       ├── stockService.js    # 股票数据服务
│       ├── analysisApi.js     # AI 分析 API
│       └── favoriteApi.js     # 自选股 API
├── server/                 # 后端源码
│   ├── index.js           # 服务入口
│   ├── routes/            # 路由
│   │   ├── analysis.js    # AI 分析接口
│   │   ├── favorites.js   # 自选股接口
│   │   └── stock.js       # 股票数据接口
│   ├── services/          # 服务层
│   │   ├── aiAnalysisService.js  # AI 分析服务
│   │   └── favoritesService.js   # 自选股服务
│   └── data/              # 数据存储
│       └── favorites.json # 自选股数据
├── package.json           # 前端依赖
└── README.md              # 项目文档
```

## 快速开始

### 环境要求

- Docker（推荐）
- 或 Node.js >= 16.0.0（开发模式）

### Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/gongmh/invest.git
cd invest

# 2. 创建环境变量文件（可选）
cat > .env << EOF
DEEPSEEK_API_KEY=your_api_key_here
EOF

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

访问 http://localhost:3001 即可使用。

### 开发模式

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填入 DEEPSEEK_API_KEY

# 启动后端
cd server && npm start

# 新终端启动前端
npm run dev
```

访问 http://localhost:5173 即可使用。

## API 接口

### 股票数据

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/stock/kline` | GET | 获取 K 线数据 |

### AI 分析

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/analysis/analyze` | POST | AI 智能分析股票 |

### 自选股

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/favorites` | GET | 获取自选股列表 |
| `/api/favorites` | POST | 添加自选股 |
| `/api/favorites/:code` | DELETE | 删除自选股 |
| `/api/favorites/reorder` | PUT | 重排序自选股 |

## 支持的市场

| 市场 | 代码格式 | 示例 |
|------|----------|------|
| 上海A股 | 6位数字（6开头） | 600000（浦发银行） |
| 深圳A股 | 6位数字（0/3开头） | 000001（平安银行） |
| 科创板 | 6位数字（68开头） | 688981（中芯国际） |
| 港股 | 5位数字 | 03690（美团） |

## 技术指标说明

### 移动平均线（MA）

- **MA5** - 5日均线，反映短期趋势
- **MA10** - 10日均线，反映中短期趋势
- **MA20** - 20日均线，反映中期趋势

### 相对强弱指标（RSI）

- RSI < 30：超卖区域，可能存在反弹机会
- RSI > 70：超买区域，注意回调风险
- 30 ≤ RSI ≤ 70：正常区域

## 分析模式

### DeepSeek AI 分析模式（优先）

当配置 `DEEPSEEK_API_KEY` 时启用，使用大语言模型进行智能分析：
- 综合考虑价格、成交量、技术指标等多维度数据
- 提供专业的买入/卖出/持有信号
- 给出简明扼要的分析建议

### 本地算法分析模式（降级）

当 DeepSeek API 不可用时自动降级使用：
- 基于均线多头/空头排列判断趋势
- 结合 RSI 指标辅助判断超买超卖
- 提供基础的交易信号

## 部署说明

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)

## 许可证

MIT License

## 免责声明

本工具仅供学习和研究使用，不构成任何投资建议。股市有风险，投资需谨慎。
