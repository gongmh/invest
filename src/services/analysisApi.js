import axios from 'axios';

const API_BASE_URL = import.meta.env.BASE_URL + 'api';

export const analysisApi = {
  async getAnalysis(stockInfo, historyData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/analyze`, {
        stockInfo,
        historyData
      });
      return response.data.data;
    } catch (error) {
      console.error('获取AI分析失败:', error);
      throw error;
    }
  }
};
