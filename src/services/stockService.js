import axios from 'axios'

const STOCK_API_BASE = 'https://web.sqt.gtimg.cn/q='
const API_BASE = import.meta.env.BASE_URL + 'api'

export const stockService = {
  async getStockInfo(code) {
    try {
      const marketCode = this.getMarketCode(code)
      const response = await axios.get(`${STOCK_API_BASE}${marketCode}`, {
        responseType: 'arraybuffer'
      })
      
      const data = this.parseStockData(response.data, code)
      return data
    } catch (error) {
      console.error('获取股票数据失败:', error)
      throw new Error('获取股票数据失败，请检查股票代码是否正确')
    }
  },

  async getHistoryKline(code, days = 30) {
    try {
      const marketCode = this.getMarketCode(code)
      
      const response = await axios.get(`${API_BASE}/stock/kline`, {
        params: {
          symbol: marketCode,
          days: days
        }
      })
      
      if (response.data.success && Array.isArray(response.data.data)) {
        const history = response.data.data.map(item => ({
          date: item.day,
          open: parseFloat(item.open),
          close: parseFloat(item.close),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          volume: parseInt(item.volume) || 0
        }))
        return history
      }
      
      throw new Error('获取K线数据失败')
    } catch (error) {
      console.error('获取历史K线失败:', error)
      throw new Error('获取历史K线数据失败，请稍后重试')
    }
  },

  getMarketCode(code) {
    const codeStr = code.toString()
    const paddedCode = codeStr.padStart(5, '0')
    
    if (paddedCode.length === 5) {
      return `hk${paddedCode}`
    }
    
    const fullCode = codeStr.padStart(6, '0')
    if (fullCode === '000001' || fullCode === '000016' || fullCode === '000300') {
      return `sh${fullCode}`
    }
    if (fullCode.startsWith('399')) {
      return `sz${fullCode}`
    }
    if (fullCode.startsWith('6')) {
      return `sh${fullCode}`
    } else if (fullCode.startsWith('0') || fullCode.startsWith('3')) {
      return `sz${fullCode}`
    } else if (fullCode.startsWith('68')) {
      return `sh${fullCode}`
    }
    return `sz${fullCode}`
  },

  parseStockData(buffer, code) {
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)
    
    if (!text || text.includes('pv_none_match')) {
      throw new Error('未找到该股票信息')
    }

    const match = text.match(/v_(?:sh|sz|hk)(\d+)="([^"]+)"/)
    if (!match) {
      throw new Error('数据解析失败')
    }

    const dataStr = match[2]
    const fields = dataStr.split('~')
    
    if (fields.length < 35) {
      throw new Error('数据格式错误')
    }

    const isHK = code.toString().padStart(5, '0').length === 5
    
    const stockInfo = {
      code: code,
      name: fields[1] || '未知',
      price: parseFloat(fields[isHK ? 3 : 3]) || 0,
      change: parseFloat(fields[isHK ? 31 : 31]) || 0,
      changePercent: parseFloat(fields[isHK ? 32 : 32]) || 0,
      open: parseFloat(fields[isHK ? 5 : 5]) || 0,
      close: parseFloat(fields[isHK ? 4 : 4]) || 0,
      high: parseFloat(fields[isHK ? 33 : 33]) || 0,
      low: parseFloat(fields[isHK ? 34 : 34]) || 0,
      volume: parseInt(fields[isHK ? 6 : 6]) || 0,
      amount: parseFloat(fields[isHK ? 37 : 37]) || 0,
      pe: parseFloat(fields[isHK ? 39 : 39]) || 0,
      pb: parseFloat(fields[isHK ? 46 : 46]) || 0,
      totalValue: parseFloat(fields[isHK ? 45 : 45]) || 0,
      circulationValue: parseFloat(fields[isHK ? 44 : 44]) || 0
    }

    return stockInfo
  }
}
