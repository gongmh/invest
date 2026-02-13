<template>
  <div class="app-wrapper">
    <!-- 移动端侧边栏遮罩 -->
    <div 
      v-if="sidebarOpen" 
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>
    
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <h2 class="sidebar-title">⭐ 自选股</h2>
        <button class="sidebar-close" @click="sidebarOpen = false">×</button>
      </div>
      
      <div class="stock-list">
        <div 
          v-for="(stock, index) in favoriteStocks" 
          :key="stock.code"
          :class="['stock-item', { 
            active: stockCode === stock.code,
            dragging: dragIndex === index
          }]"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent="handleDragOver($event, index)"
          @dragend="handleDragEnd"
          @drop="handleDrop($event, index)"
        >
          <button 
            class="stock-btn"
            @click="quickSearch(stock.code)"
          >
            <div class="stock-info-row">
              <span class="stock-name">{{ stock.name }}</span>
              <span class="stock-code">{{ stock.code }}</span>
            </div>
            <div class="stock-price-row" v-if="stockPrices[stock.code]">
              <span class="stock-price" :class="{
                'price-up': stockPrices[stock.code].changePercent > 0,
                'price-down': stockPrices[stock.code].changePercent < 0
              }">
                {{ stockPrices[stock.code].price.toFixed(2) }}
              </span>
              <span class="stock-change" :class="{
                'price-up': stockPrices[stock.code].changePercent > 0,
                'price-down': stockPrices[stock.code].changePercent < 0
              }">
                {{ stockPrices[stock.code].changePercent > 0 ? '+' : '' }}{{ stockPrices[stock.code].changePercent.toFixed(2) }}%
              </span>
            </div>
          </button>
          <button 
            class="delete-btn"
            @click="removeFavoriteStock(stock.code)"
            title="删除"
          >
            ×
          </button>
        </div>
      </div>
      
      <div v-if="favoriteStocks.length === 0" class="empty-tip">
        暂无自选股，请添加
      </div>
    </aside>
    
    <!-- 右侧主内容区 -->
    <main class="main-content">
      <!-- Banner -->
      <div class="banner">
        <div class="banner-content">
          <div class="banner-left">
            <div class="banner-top-row">
              <button class="menu-btn" @click="sidebarOpen = true">☰</button>
              <h1 class="banner-title">📈 A股股票分析工具</h1>
            </div>
            <div class="market-info">
              <span class="datetime">{{ currentDateTime }}</span>
              <span class="market-status" :class="marketOpen ? 'open' : 'closed'">
                {{ marketOpen ? '🟢 交易中' : '🔴 已休市' }}
              </span>
            </div>
          </div>
          <div class="banner-right">
            <div class="index-item" v-for="idx in indexData" :key="idx.code">
              <span class="index-name">{{ idx.name }}</span>
              <span class="index-value" :class="idx.change > 0 ? 'up' : idx.change < 0 ? 'down' : ''">
                {{ idx.value.toFixed(2) }}
              </span>
              <span class="index-change" :class="idx.change > 0 ? 'up' : idx.change < 0 ? 'down' : ''">
                {{ idx.change > 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内容区 -->
      <div class="container">
        <!-- 输入区 -->
        <div class="form-group">
          <div class="input-group">
            <input 
              type="text" 
              v-model="stockCode" 
              placeholder="输入股票代码（A股/港股，如：600000、03690）"
              @keyup.enter="fetchStockData"
            />
            <button @click="fetchStockData" class="fetch-btn">
              <span class="btn-icon">🔍</span>
              获取数据
            </button>
            <button 
              v-if="stockInfo && !isInFavorites" 
              @click="addToFavorites" 
              class="add-favorite-btn"
            >
              <span class="btn-icon">⭐</span>
              添加自选
            </button>
            <button 
              v-if="stockInfo && isInFavorites" 
              @click="removeFromFavorites" 
              class="remove-favorite-btn"
            >
              <span class="btn-icon">✓</span>
              已添加
            </button>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>正在获取数据...</p>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="error" class="error">
          {{ error }}
        </div>
        
        <!-- 股票信息 -->
        <div v-if="stockInfo && !loading" class="stock-info">
          <!-- 股票头部 -->
          <div class="stock-header">
            <div class="stock-title-area">
              <h2 class="stock-name-main">{{ stockInfo.name }}</h2>
              <span class="stock-code-main">{{ stockInfo.code }}</span>
            </div>
            <div class="stock-price-main">
              <div class="price-value" :class="{
                'positive': stockInfo.changePercent > 0,
                'negative': stockInfo.changePercent < 0
              }">
                {{ stockInfo.price.toFixed(2) }}
              </div>
              <div class="price-change" :class="{
                'positive': stockInfo.changePercent > 0,
                'negative': stockInfo.changePercent < 0
              }">
                <span>{{ stockInfo.change > 0 ? '+' : '' }}{{ stockInfo.change.toFixed(2) }}</span>
                <span class="change-percent">{{ stockInfo.changePercent > 0 ? '+' : '' }}{{ stockInfo.changePercent.toFixed(2) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- 综合信号和建议 -->
          <div v-if="analysisLoading" class="signal-section signal-loading">
            <div class="loading-spinner"></div>
            <span class="loading-text">AI分析中...</span>
          </div>
          <div v-else-if="analysisResult" class="signal-section">
            <div class="signal-badge" :class="{
              'signal-buy': analysisResult.signal === '买入',
              'signal-sell': analysisResult.signal === '卖出',
              'signal-hold': analysisResult.signal === '持有'
            }">
              <span class="signal-label">综合信号</span>
              <span class="signal-value">{{ analysisResult.signal }}</span>
              <span class="confidence">{{ analysisResult.confidence }}%</span>
            </div>
            <div class="suggestion-area">
              <div class="suggestion-text">{{ analysisResult.suggestion }}</div>
              <div class="model-source" v-if="analysisResult.model">
                <span class="model-label">分析模型：</span>
                <span class="model-value" :class="{
                  'model-ai': analysisResult.model === 'DeepSeek AI',
                  'model-local': analysisResult.model === '本地算法'
                }">
                  {{ analysisResult.model === 'DeepSeek AI' ? '🤖 DeepSeek AI 大模型' : '📊 本地算法' }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 信息卡片 -->
          <div class="info-grid">
            <div class="info-card">
              <div class="info-card-label">今开</div>
              <div class="info-card-value">{{ stockInfo.open.toFixed(2) }}</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">昨收</div>
              <div class="info-card-value">{{ stockInfo.close.toFixed(2) }}</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">最高</div>
              <div class="info-card-value high">{{ stockInfo.high.toFixed(2) }}</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">最低</div>
              <div class="info-card-value low">{{ stockInfo.low.toFixed(2) }}</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">成交量</div>
              <div class="info-card-value">{{ (stockInfo.volume / 10000).toFixed(0) }}万手</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">成交额</div>
              <div class="info-card-value">{{ (stockInfo.amount / 100000000).toFixed(2) }}亿</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">市盈率</div>
              <div class="info-card-value">{{ stockInfo.pe.toFixed(2) }}</div>
            </div>
            <div class="info-card">
              <div class="info-card-label">市净率</div>
              <div class="info-card-value">{{ stockInfo.pb.toFixed(2) }}</div>
            </div>
          </div>
          
          <!-- 图表区域 -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>📈 价格走势</h3>
              <div class="period-selector">
                <button 
                  v-for="period in periods" 
                  :key="period.value"
                  :class="['period-btn', { active: selectedPeriod === period.value }]"
                  @click="changePeriod(period.value)"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
            <div ref="chartRef" style="width: 100%; height: 400px;"></div>
          </div>
          
          <!-- 技术指标 -->
          <div v-if="analysisResult" class="analysis-result">
            <h3>📊 技术指标</h3>
            <div class="indicators-grid">
              <div class="indicator-item">
                <span class="indicator-label">MA5</span>
                <span class="indicator-value">{{ analysisResult.indicators.ma5 }} 元</span>
                <span class="indicator-desc">5日均线，短期趋势</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">MA10</span>
                <span class="indicator-value">{{ analysisResult.indicators.ma10 }} 元</span>
                <span class="indicator-desc">10日均线，中短期趋势</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">MA20</span>
                <span class="indicator-value">{{ analysisResult.indicators.ma20 }} 元</span>
                <span class="indicator-desc">20日均线，中期趋势</span>
              </div>
              <div class="indicator-item">
                <span class="indicator-label">RSI(14)</span>
                <span class="indicator-value" :class="{
                  'positive': analysisResult.indicators.rsi < 30,
                  'negative': analysisResult.indicators.rsi > 70
                }">
                  {{ analysisResult.indicators.rsi }}
                </span>
                <span class="indicator-desc" :class="{
                  'positive': analysisResult.indicators.rsi < 30,
                  'negative': analysisResult.indicators.rsi > 70
                }">
                  {{ analysisResult.indicators.rsi < 30 ? '超卖区域' : analysisResult.indicators.rsi > 70 ? '超买区域' : '正常区域' }}
                </span>
              </div>
            </div>
            
            <div class="indicators-legend">
              <div class="legend-item">
                <span class="legend-color buy"></span>
                <span>买入信号</span>
              </div>
              <div class="legend-item">
                <span class="legend-color sell"></span>
                <span>卖出信号</span>
              </div>
              <div class="legend-item">
                <span class="legend-color hold"></span>
                <span>持有信号</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 确认弹窗 -->
    <ConfirmDialog 
      :visible="showConfirm"
      :message="confirmMessage"
      @confirm="handleConfirmDelete"
      @cancel="showConfirm = false"
    />
    
    <!-- Toast提示 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { stockService } from './services/stockService.js'
import { favoriteApi } from './services/favoriteApi.js'
import { analysisApi } from './services/analysisApi.js'
import ConfirmDialog from './components/ConfirmDialog.vue'
import Toast from './components/Toast.vue'

export default {
  name: 'App',
  components: {
    ConfirmDialog,
    Toast
  },
  setup() {
    const stockCode = ref('600000')
    const loading = ref(false)
    const error = ref('')
    const stockInfo = ref(null)
    const chartData = ref(null)
    const chartRef = ref(null)
    const chartInstance = ref(null)
    const stockPrices = ref({})
    const analysisResult = ref(null)
    const selectedPeriod = ref(30)
    const favoriteStocks = ref([])
    const dragIndex = ref(null)
    const showConfirm = ref(false)
    const confirmMessage = ref('')
    const pendingDeleteCode = ref(null)
    const toastRef = ref(null)
    const sidebarOpen = ref(false)
    const currentDateTime = ref('')
    const marketOpen = ref(false)
    const indexData = ref([
      { code: 'sh000001', name: '上证指数', value: 3250.00, change: 0.5 },
      { code: 'sz399001', name: '深证成指', value: 10500.00, change: -0.3 },
      { code: 'sz399006', name: '创业板指', value: 2100.00, change: 0.8 }
    ])
    let priceRefreshTimer = null
    let datetimeTimer = null
    let indexRefreshTimer = null
    let lastMarketOpenState = false
    
    const updateDateTime = () => {
      const now = new Date()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const month = now.getMonth() + 1
      const day = now.getDate()
      const weekDay = weekDays[now.getDay()]
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      currentDateTime.value = `${month}月${day}日 ${weekDay} ${hours}:${minutes}:${seconds}`
      
      const hour = now.getHours()
      const minute = now.getMinutes()
      const dayOfWeek = now.getDay()
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
      const isMorningSession = (hour === 9 && minute >= 30) || (hour === 10) || (hour === 11 && minute <= 30)
      const isAfternoonSession = hour === 13 || (hour === 14) || (hour === 15 && minute === 0)
      marketOpen.value = isWeekday && (isMorningSession || isAfternoonSession)
      
      if (marketOpen.value !== lastMarketOpenState) {
        lastMarketOpenState = marketOpen.value
        if (marketOpen.value) {
          fetchIndexData()
          indexRefreshTimer = setInterval(fetchIndexData, 5000)
        } else {
          if (indexRefreshTimer) {
            clearInterval(indexRefreshTimer)
            indexRefreshTimer = null
          }
        }
      }
    }
    
    const fetchIndexData = async () => {
      try {
        const indices = [
          { code: '000001', market: 'sh', name: '上证指数' },
          { code: '399001', market: 'sz', name: '深证成指' },
          { code: '399006', market: 'sz', name: '创业板指' }
        ]
        const results = await Promise.all(
          indices.map(item => stockService.getStockInfo(item.code))
        )
        indexData.value = results.map((data, i) => ({
          code: `${indices[i].market}${indices[i].code}`,
          name: indices[i].name,
          value: data.price,
          change: data.changePercent
        }))
      } catch (err) {
        console.error('获取指数数据失败:', err)
      }
    }
    
    const isInFavorites = computed(() => {
      if (!stockInfo.value) return false
      return favoriteStocks.value.some(s => s.code === stockInfo.value.code)
    })
    
    const loadFavoriteStocks = async () => {
      try {
        favoriteStocks.value = await favoriteApi.getFavorites()
        fetchAllStockPrices()
      } catch (err) {
        console.error('加载自选股失败:', err)
        favoriteStocks.value = []
      }
    }
    
    const fetchAllStockPrices = async () => {
      for (const stock of favoriteStocks.value) {
        try {
          const data = await stockService.getStockInfo(stock.code)
          if (data) {
            stockPrices.value[stock.code] = {
              price: data.price,
              changePercent: data.changePercent
            }
          }
        } catch (err) {
          console.error(`获取${stock.code}价格失败:`, err)
        }
      }
    }
    
    const addToFavorites = async () => {
      if (!stockInfo.value) return
      
      try {
        favoriteStocks.value = await favoriteApi.addFavorite(
          stockInfo.value.code,
          stockInfo.value.name
        )
        toastRef.value?.show('添加自选成功', 2000, 'success')
        fetchAllStockPrices()
      } catch (err) {
        console.error('添加自选股失败:', err)
        toastRef.value?.show('添加失败，请稍后重试', 3000, 'error')
      }
    }
    
    const removeFromFavorites = () => {
      if (!stockInfo.value) return
      
      const stock = favoriteStocks.value.find(s => s.code === stockInfo.value.code)
      confirmMessage.value = `确定要将「${stock?.name || stockInfo.value.code}」从自选列表中删除吗？`
      pendingDeleteCode.value = stockInfo.value.code
      showConfirm.value = true
    }
    
    const removeFavoriteStock = (code) => {
      const stock = favoriteStocks.value.find(s => s.code === code)
      confirmMessage.value = `确定要将「${stock?.name || code}」从自选列表中删除吗？`
      pendingDeleteCode.value = code
      showConfirm.value = true
    }
    
    const handleConfirmDelete = async () => {
      if (!pendingDeleteCode.value) return
      
      try {
        favoriteStocks.value = await favoriteApi.removeFavorite(pendingDeleteCode.value)
        showConfirm.value = false
        pendingDeleteCode.value = null
        toastRef.value?.show('删除成功', 2000, 'success')
      } catch (err) {
        console.error('删除自选股失败:', err)
        toastRef.value?.show('删除失败，请稍后重试', 3000, 'error')
        showConfirm.value = false
      }
    }
    
    const handleDragStart = (e, index) => {
      dragIndex.value = index
      e.dataTransfer.effectAllowed = 'move'
    }
    
    const handleDragOver = (e, index) => {
      if (dragIndex.value === null || dragIndex.value === index) return
    }
    
    const handleDrop = async (e, dropIndex) => {
      if (dragIndex.value === null || dragIndex.value === dropIndex) return
      
      const startIndex = dragIndex.value
      const stocks = [...favoriteStocks.value]
      const [removed] = stocks.splice(startIndex, 1)
      stocks.splice(dropIndex, 0, removed)
      
      try {
        const codes = stocks.map(s => s.code)
        favoriteStocks.value = await favoriteApi.reorderFavorites(codes)
        toastRef.value?.show('排序成功', 2000, 'success')
      } catch (err) {
        console.error('排序失败:', err)
        toastRef.value?.show('排序失败，请稍后重试', 3000, 'error')
      }
      
      dragIndex.value = null
    }
    
    const handleDragEnd = () => {
      dragIndex.value = null
    }
    
    const periods = [
      { label: '近1周', value: 7 },
      { label: '近1月', value: 30 },
      { label: '近3月', value: 90 },
      { label: '近6月', value: 180 }
    ]
    
    const quickSearch = (code) => {
      stockCode.value = code
      fetchStockData()
    }
    
    const changePeriod = async (days) => {
      selectedPeriod.value = days
      if (stockInfo.value) {
        try {
          const historyData = await stockService.getHistoryKline(stockInfo.value.code, days)
          chartData.value = historyData
          setTimeout(() => {
            renderChart()
          }, 100)
        } catch (err) {
          console.error('获取K线数据失败:', err)
        }
      }
    }
    
    const fetchStockData = async () => {
      if (!stockCode.value.trim()) {
        error.value = '请输入股票代码'
        return
      }
      
      loading.value = true
      error.value = ''
      analysisResult.value = null
      
      try {
        const stockInfoData = await stockService.getStockInfo(stockCode.value)
        stockInfo.value = stockInfoData
        
        const historyData = await stockService.getHistoryKline(stockCode.value, selectedPeriod.value)
        chartData.value = historyData
        
        setTimeout(() => {
          renderChart()
        }, 100)
        
        fetchAnalysis(stockInfoData, historyData)
        
      } catch (err) {
        error.value = err.message || '获取数据失败，请稍后重试'
        stockInfo.value = null
        chartData.value = null
        analysisResult.value = null
      } finally {
        loading.value = false
      }
    }
    
    const analysisLoading = ref(false)
    
    const fetchAnalysis = async (stockInfoData, historyData) => {
      analysisLoading.value = true
      try {
        analysisResult.value = await analysisApi.getAnalysis(stockInfoData, historyData)
      } catch (aiError) {
        console.error('AI分析失败，使用本地分析:', aiError)
        analysisResult.value = analyzeStockLocal(stockInfoData, historyData)
      } finally {
        analysisLoading.value = false
      }
    }
    
    const analyzeStockLocal = (info, history) => {
      const prices = history.map(h => parseFloat(h.close))
      const ma5 = calculateMA(prices, 5)
      const ma10 = calculateMA(prices, 10)
      const ma20 = calculateMA(prices, 20)
      const rsi = calculateRSI(prices, 14)
      const ema12 = calculateEMA(prices, 12)
      const ema26 = calculateEMA(prices, 26)
      
      const currentPrice = info.price
      let signal = '持有'
      let confidence = 50
      let suggestion = ''
      
      const ma5Above = currentPrice > ma5
      const ma10Above = currentPrice > ma10
      const ma20Above = currentPrice > ma20
      const maTrend = ma5 > ma10 && ma10 > ma20
      
      if (ma5Above && ma10Above && ma20Above && maTrend) {
        signal = '买入'
        confidence = 75
        suggestion = '多条均线呈多头排列，股价位于均线上方，短期趋势向好。建议关注成交量变化，适量建仓。'
      } else if (!ma5Above && !ma10Above && !ma20Above) {
        signal = '卖出'
        confidence = 70
        suggestion = '股价跌破多条均线，短期趋势转弱。建议谨慎操作，考虑减仓或观望。'
      } else {
        signal = '持有'
        confidence = 55
        suggestion = '股价在均线间震荡，趋势不明朗。建议保持观望，等待更明确的信号。'
      }
      
      if (rsi < 30) {
        confidence = Math.min(confidence + 10, 90)
        suggestion += ` RSI指标显示超卖，可能存在反弹机会。`
      } else if (rsi > 70) {
        confidence = Math.min(confidence + 10, 90)
        suggestion += ` RSI指标显示超买，注意回调风险。`
      }
      
      return {
        signal,
        confidence,
        suggestion,
        model: '本地算法',
        indicators: {
          ma5: ma5.toFixed(2),
          ma10: ma10.toFixed(2),
          ma20: ma20.toFixed(2),
          rsi: rsi.toFixed(2)
        }
      }
    }
    
    const calculateMA = (data, period) => {
      if (data.length < period) return data[data.length - 1]
      const slice = data.slice(-period)
      return slice.reduce((a, b) => a + b) / period
    }
    
    const calculateRSI = (data, period) => {
      if (data.length < period + 1) return 50
      
      let gains = 0
      let losses = 0
      
      for (let i = data.length - period; i < data.length; i++) {
        const change = data[i] - data[i - 1]
        if (change > 0) {
          gains += change
        } else {
          losses -= change
        }
      }
      
      const avgGain = gains / period
      const avgLoss = losses / period
      
      if (avgLoss === 0) return 100
      const rs = avgGain / avgLoss
      return 100 - (100 / (1 + rs))
    }
    
    const calculateEMA = (data, period) => {
      if (data.length < period) return data[data.length - 1]
      
      const multiplier = 2 / (period + 1)
      let ema = data.slice(0, period).reduce((a, b) => a + b) / period
      
      for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema
      }
      
      return ema
    }
    
    const formatNumber = (value, decimals = 2) => {
      if (value === null || value === undefined || isNaN(value)) {
        return '0.00'
      }
      return Number(value).toFixed(decimals)
    }
    
    const renderChart = () => {
      if (!chartRef.value || !chartData.value) return
      
      if (chartInstance.value) {
        chartInstance.value.dispose()
      }
      
      chartInstance.value = echarts.init(chartRef.value)
      
      const dates = chartData.value.map(d => d.date)
      const prices = chartData.value.map(d => parseFloat(d.close))
      const volumes = chartData.value.map(d => d.volume)
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          formatter: function(params) {
            const priceParam = params.find(p => p.seriesName === '价格')
            const volumeParam = params.find(p => p.seriesName === '成交量')
            const item = chartData.value.find(d => d.date === params[0].axisValue)
            if (!item) return ''
            
            const change = (parseFloat(item.close) - parseFloat(item.open)).toFixed(2)
            const changePercent = ((change / parseFloat(item.open)) * 100).toFixed(2)
            const changeColor = change >= 0 ? '#f87171' : '#34d399'
            
            return `<div style="padding: 5px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${item.date}</div>
              <div style="margin: 4px 0;">收盘: <span style="color: #3b82f6; font-weight: bold;">${item.close} 元</span></div>
              <div style="margin: 4px 0;">开盘: ${item.open} 元</div>
              <div style="margin: 4px 0;">最高: ${item.high} 元</div>
              <div style="margin: 4px 0;">最低: ${item.low} 元</div>
              <div style="margin: 4px 0;">涨跌: <span style="color: ${changeColor}; font-weight: bold;">${change >= 0 ? '+' : ''}${change} (${change >= 0 ? '+' : ''}${changePercent}%)</span></div>
              <div style="margin: 4px 0;">成交量: <span style="color: #8b5cf6; font-weight: bold;">${(item.volume / 10000).toFixed(2)} 万手</span></div>
            </div>`
          }
        },
        grid: [
          {
            left: '10%',
            right: '8%',
            top: '8%',
            height: '55%'
          },
          {
            left: '10%',
            right: '8%',
            top: '70%',
            height: '20%'
          }
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisLabel: { color: '#666' }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisLabel: { show: false }
          }
        ],
        yAxis: [
          {
            type: 'value',
            scale: true,
            splitLine: { lineStyle: { color: '#f0f0f0' } },
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisLabel: { color: '#666' }
          },
          {
            type: 'value',
            gridIndex: 1,
            splitLine: { show: false },
            axisLine: { lineStyle: { color: '#e0e0e0' } },
            axisLabel: { show: false }
          }
        ],
        series: [
          {
            name: '价格',
            data: prices,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
              color: '#3b82f6',
              width: 2
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ])
            },
            xAxisIndex: 0,
            yAxisIndex: 0
          },
          {
            name: '成交量',
            data: volumes,
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            itemStyle: {
              color: function(params) {
                const idx = params.dataIndex
                if (idx === 0) return '#3b82f6'
                return prices[idx] >= prices[idx - 1] ? '#f87171' : '#34d399'
              }
            }
          }
        ]
      }
      
      chartInstance.value.setOption(option)
      
      window.addEventListener('resize', () => {
        chartInstance.value?.resize()
      })
    }
    
    onMounted(async () => {
      updateDateTime()
      datetimeTimer = setInterval(updateDateTime, 1000)
      
      await loadFavoriteStocks()
      fetchIndexData()
      if (favoriteStocks.value.length > 0) {
        stockCode.value = favoriteStocks.value[0].code
        fetchStockData()
      }
    })
    
    watch(sidebarOpen, (isOpen) => {
      if (isOpen) {
        fetchAllStockPrices()
        priceRefreshTimer = setInterval(() => {
          fetchAllStockPrices()
        }, 1000)
      } else {
        if (priceRefreshTimer) {
          clearInterval(priceRefreshTimer)
          priceRefreshTimer = null
        }
      }
    })
    
    onUnmounted(() => {
      if (priceRefreshTimer) {
        clearInterval(priceRefreshTimer)
      }
      if (datetimeTimer) {
        clearInterval(datetimeTimer)
      }
      if (indexRefreshTimer) {
        clearInterval(indexRefreshTimer)
      }
      if (chartInstance.value) {
        chartInstance.value.dispose()
      }
    })
    
    return {
      stockCode,
      loading,
      error,
      stockInfo,
      chartData,
      chartRef,
      analysisResult,
      analysisLoading,
      stockPrices,
      fetchStockData,
      formatNumber,
      selectedPeriod,
      periods,
      changePeriod,
      favoriteStocks,
      dragIndex,
      quickSearch,
      isInFavorites,
      addToFavorites,
      removeFromFavorites,
      removeFavoriteStock,
      handleDragStart,
      handleDragOver,
      handleDrop,
      handleDragEnd,
      showConfirm,
      confirmMessage,
      handleConfirmDelete,
      toastRef,
      sidebarOpen,
      currentDateTime,
      marketOpen,
      indexData
    }
  }
}
</script>

<style>
.chart-container {
  margin: 20px 0 40px 0;
  padding-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  color: #1a1f36;
  font-size: 18px;
}

.period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 6px 14px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.period-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.period-btn.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.stock-info {
  margin: 0 0 30px 0;
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #1a1f36 0%, #2d3555 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.stock-title-area {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.stock-name-main {
  margin: 0;
  font-size: 24px;
  color: white;
  font-weight: 600;
}

.stock-code-main {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.stock-price-main {
  text-align: right;
}

.price-value {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.price-value.positive {
  color: #f87171;
}

.price-value.negative {
  color: #34d399;
}

.price-change {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 5px;
}

.price-change.positive {
  color: #f87171;
}

.price-change.negative {
  color: #34d399;
}

.change-percent {
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.info-card {
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.info-card-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.info-card-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.info-card-value.high {
  color: #f87171;
}

.info-card-value.low {
  color: #34d399;
}

.signal-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.signal-loading {
  justify-content: center;
  gap: 12px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

.signal-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 100px;
}

.signal-badge.signal-buy {
  border: 2px solid #34d399;
}

.signal-badge.signal-sell {
  border: 2px solid #f87171;
}

.signal-badge.signal-hold {
  border: 2px solid #fbbf24;
}

.signal-label {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}

.signal-value {
  font-size: 20px;
  font-weight: 700;
}

.signal-buy .signal-value {
  color: #34d399;
}

.signal-sell .signal-value {
  color: #f87171;
}

.signal-hold .signal-value {
  color: #fbbf24;
}

.confidence {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
}

.suggestion-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-source {
  display: flex !important;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 11px;
  margin-top: 8px;
  opacity: 0.7;
}

.model-label {
  color: #999;
  font-weight: 400;
}

.model-value {
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 400;
}

.model-value.model-ai {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}

.model-value.model-local {
  background: rgba(0, 0, 0, 0.05);
  color: #888;
}

.analysis-result {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.analysis-result h3 {
  margin: 0 0 20px 0;
  color: #1a1f36;
  font-size: 18px;
}

.result-card-group {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
}

.result-card {
  flex: 1;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
}

.signal-card {
  text-align: center;
}

.card-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 10px;
}

.signal-text {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.signal-buy {
  color: #34d399;
}

.signal-sell {
  color: #f87171;
}

.signal-hold {
  color: #fbbf24;
}

.confidence-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.analysis-text {
  margin: 0;
  color: #555;
  line-height: 1.8;
  font-size: 14px;
}

.indicators-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.indicators-section h4 {
  margin: 0 0 15px 0;
  color: #1a1f36;
  font-size: 16px;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.indicator-item {
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f1f3 100%);
  padding: 14px 12px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.indicator-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
  font-weight: 500;
}

.indicator-value {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #1a1f36;
  margin-bottom: 4px;
}

.indicator-value.positive {
  color: #34d399;
}

.indicator-value.negative {
  color: #f87171;
}

.indicator-desc {
  display: block;
  font-size: 10px;
  color: #aaa;
}

.indicator-desc.positive {
  color: #34d399;
}

.indicator-desc.negative {
  color: #f87171;
}

.indicators-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.buy {
  background-color: #34d399;
}

.legend-color.sell {
  background-color: #f87171;
}

.legend-color.hold {
  background-color: #fbbf24;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  text-align: center;
  padding: 20px;
  color: #f87171;
  background-color: #fef2f2;
  border-radius: 4px;
  margin: 10px 0;
}
</style>
