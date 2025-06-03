import React from 'react';
import { Dropdown, List, Button, Typography, Space, Popconfirm, MenuProps } from 'antd';
import { ClockCircleOutlined, DeleteOutlined, ClearOutlined, FireOutlined } from '@ant-design/icons';
import { SearchHistoryItem } from '@/utils/searchHistory';
import './SearchHistoryDropdown.scss';

const { Text } = Typography;

interface SearchHistoryDropdownProps {
  children: React.ReactElement;
  searchHistory: SearchHistoryItem[];
  onSelectHistory: (keyword: string) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
  children,
  searchHistory,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory,
  visible,
  onVisibleChange,
}) => {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString();
  };

  const dropdownContent = (
    <div className="search-history-dropdown">
      <div className="dropdown-header">
        <Space>
          <ClockCircleOutlined />
          <Text strong style={{ color: '#fff' }}>搜索历史</Text>
        </Space>
        {searchHistory.length > 0 && (
          <Popconfirm
            title="确定要清空所有搜索记录吗？"
            onConfirm={onClearHistory}
            okText="确定"
            cancelText="取消"
            placement="topRight"
          >
            <Button 
              type="text" 
              size="small" 
              icon={<ClearOutlined />}
              style={{ color: '#fff' }}
            >
              清空
            </Button>
          </Popconfirm>
        )}
      </div>

      {searchHistory.length === 0 ? (
        <div className="no-history">
          <Text type="secondary">暂无搜索记录</Text>
        </div>
      ) : (
        <List
          className="history-list"
          dataSource={searchHistory.slice(0, 10)} // 最多显示10条
          renderItem={(item) => (
            <List.Item className="history-item">
              <div 
                className="history-content"
                onClick={() => {
                  onSelectHistory(item.keyword);
                  onVisibleChange(false);
                }}
              >
                <div className="keyword-info">
                  <Text className="keyword">{item.keyword}</Text>
                  {item.searchCount > 1 && (
                    <div className="search-count">
                      <FireOutlined />
                      <span>{item.searchCount}</span>
                    </div>
                  )}
                </div>
                <Text type="secondary" className="time">
                  {formatTime(item.timestamp)}
                </Text>
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistory(item.id);
                }}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={visible}
      onOpenChange={onVisibleChange}
      placement="bottomLeft"
      overlayClassName="search-history-overlay"
    >
      {children}
    </Dropdown>
  );
};

export default SearchHistoryDropdown; 