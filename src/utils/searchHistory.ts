// 搜索记录管理工具
export interface SearchHistoryItem {
  id: string;
  keyword: string;
  timestamp: number;
  searchCount: number;
}

export class SearchHistoryManager {
  private static instance: SearchHistoryManager;
  private readonly STORAGE_KEY = 'music_search_history';
  private readonly MAX_HISTORY_COUNT = 20; // 最多保存20条记录

  private constructor() {}

  public static getInstance(): SearchHistoryManager {
    if (!SearchHistoryManager.instance) {
      SearchHistoryManager.instance = new SearchHistoryManager();
    }
    return SearchHistoryManager.instance;
  }

  // 获取所有搜索记录
  public getSearchHistory(): SearchHistoryItem[] {
    try {
      const historyStr = localStorage.getItem(this.STORAGE_KEY);
      if (!historyStr) return [];
      
      const history: SearchHistoryItem[] = JSON.parse(historyStr);
      // 按时间戳降序排列（最新的在前）
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('获取搜索记录失败:', error);
      return [];
    }
  }

  // 添加搜索记录
  public addSearchHistory(keyword: string): void {
    if (!keyword.trim()) return;

    try {
      const history = this.getSearchHistory();
      const existingIndex = history.findIndex(item => item.keyword === keyword.trim());
      
      if (existingIndex !== -1) {
        // 如果关键词已存在，更新时间戳和搜索次数
        history[existingIndex].timestamp = Date.now();
        history[existingIndex].searchCount += 1;
      } else {
        // 如果关键词不存在，添加新记录
        const newItem: SearchHistoryItem = {
          id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          keyword: keyword.trim(),
          timestamp: Date.now(),
          searchCount: 1
        };
        history.unshift(newItem);
      }

      // 限制记录数量
      if (history.length > this.MAX_HISTORY_COUNT) {
        history.splice(this.MAX_HISTORY_COUNT);
      }

      // 保存到本地存储
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索记录失败:', error);
    }
  }

  // 删除指定搜索记录
  public removeSearchHistory(id: string): void {
    try {
      const history = this.getSearchHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('删除搜索记录失败:', error);
    }
  }

  // 清空所有搜索记录
  public clearSearchHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清空搜索记录失败:', error);
    }
  }

  // 获取热门搜索词（按搜索次数排序）
  public getPopularSearches(limit: number = 10): SearchHistoryItem[] {
    const history = this.getSearchHistory();
    return history
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit);
  }

  // 搜索历史记录（模糊匹配）
  public searchInHistory(query: string): SearchHistoryItem[] {
    if (!query.trim()) return this.getSearchHistory();
    
    const history = this.getSearchHistory();
    const lowerQuery = query.toLowerCase().trim();
    
    return history.filter(item => 
      item.keyword.toLowerCase().includes(lowerQuery)
    );
  }
} 