"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Switch, 
  Button, 
  Modal, 
  List, 
  Avatar, 
  Tag, 
  Slider, 
  Space, 
  message, 
  Tooltip,
  Divider,
  Typography,
  Alert,
  Input
} from 'antd';
import { 
  SettingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { MusicSourceManager } from '@/services/MusicSourceManager';
import { MusicSourceInfo } from '@/types/music';
import { motion, AnimatePresence } from 'framer-motion';
import './index.scss';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface MusicSourceManagerProps {
  visible: boolean;
  onClose: () => void;
}

const MusicSourceManagerComponent: React.FC<MusicSourceManagerProps> = ({ visible, onClose }) => {
  const [sources, setSources] = useState<MusicSourceInfo[]>([]);
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configText, setConfigText] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  const manager = MusicSourceManager.getInstance();

  // 加载音乐源列表
  const loadSources = React.useCallback(async () => {
    setLoading(true);
    try {
      const allSources = manager.getAllSources();
      setSources(allSources);
      
      // 检查可用性
      const availabilityMap = await manager.checkAvailability();
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Failed to load sources:', error);
      message.error('加载音乐源失败');
    } finally {
      setLoading(false);
    }
  }, [manager]);

  useEffect(() => {
    if (visible) {
      loadSources();
    }
  }, [visible, loadSources]);

  // 切换音乐源启用状态
  const handleToggleSource = (sourceId: string, enabled: boolean) => {
    manager.setSourceEnabled(sourceId, enabled);
    setSources(prev => prev.map(source => 
      source.id === sourceId ? { ...source, enabled } : source
    ));
    message.success(`${enabled ? '启用' : '禁用'}音乐源成功`);
  };

  // 设置默认音乐源
  const handleSetDefault = (sourceId: string) => {
    manager.setDefaultSource(sourceId);
    message.success('设置默认音乐源成功');
  };

  // 调整优先级
  const handlePriorityChange = (sourceId: string, priority: number) => {
    manager.setSourcePriority(sourceId, priority);
    setSources(prev => prev.map(source => 
      source.id === sourceId ? { ...source, priority } : source
    ));
  };

  // 刷新可用性
  const handleRefreshAvailability = async () => {
    setLoading(true);
    try {
      const availabilityMap = await manager.checkAvailability();
      setAvailability(availabilityMap);
      message.success('刷新完成');
    } catch {
      message.error('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出配置
  const handleExportConfig = () => {
    const config = manager.exportConfig();
    setConfigText(config);
    setConfigModalVisible(true);
  };

  // 导入配置
  const handleImportConfig = () => {
    if (!importText.trim()) {
      message.error('请输入配置内容');
      return;
    }

    const success = manager.importConfig(importText);
    if (success) {
      message.success('导入配置成功');
      setImportModalVisible(false);
      setImportText('');
      loadSources();
    } else {
      message.error('导入配置失败，请检查格式');
    }
  };

  // 重置配置
  const handleResetConfig = () => {
    Modal.confirm({
      title: '确认重置',
      content: '这将重置所有音乐源配置为默认值，是否继续？',
      onOk: () => {
        manager.resetConfig();
        message.success('重置配置成功');
        loadSources();
      }
    });
  };

  // 获取状态标签
  const getStatusTag = (source: MusicSourceInfo) => {
    const isAvailable = availability.get(source.id);
    
    if (!source.enabled) {
      return <Tag color="default">已禁用</Tag>;
    }
    
    if (isAvailable === undefined) {
      return <Tag color="processing">检查中</Tag>;
    }
    
    return isAvailable ? 
      <Tag color="success" icon={<CheckCircleOutlined />}>可用</Tag> :
      <Tag color="error" icon={<ExclamationCircleOutlined />}>不可用</Tag>;
  };

  // 获取功能标签
  const getFeatureTags = (source: MusicSourceInfo) => {
    const features = source.supportedFeatures;
    const featureList = [
      { key: 'search', label: '搜索', enabled: features.search },
      { key: 'getTrackUrl', label: '播放', enabled: features.getTrackUrl },
      { key: 'getLyrics', label: '歌词', enabled: features.getLyrics },
      { key: 'getPlaylist', label: '歌单', enabled: features.getPlaylist },
    ];

    return featureList
      .filter(f => f.enabled)
      .map(f => <Tag key={f.key} style={{ fontSize: '12px', padding: '2px 6px' }}>{f.label}</Tag>);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          音乐源管理
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={handleRefreshAvailability} loading={loading}>
          刷新状态
        </Button>,
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExportConfig}>
          导出配置
        </Button>,
        <Button key="import" icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
          导入配置
        </Button>,
        <Button key="reset" onClick={handleResetConfig}>
          重置配置
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
      className="music-source-manager-modal"
    >
      <div className="music-source-manager">
        <Alert
          message="音乐源管理"
          description="在这里可以管理所有音乐源的启用状态、优先级和配置。启用多个音乐源可以享受聚合搜索功能。"
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <List
              loading={loading}
              dataSource={sources.sort((a, b) => a.priority - b.priority)}
              renderItem={(source) => (
                <motion.div key={source.id} variants={itemVariants}>
                  <List.Item className="source-item">
                    <Card 
                      size="small" 
                      className={`source-card ${source.enabled ? 'enabled' : 'disabled'}`}
                      style={{ width: '100%' }}
                    >
                      <div className="source-header">
                        <div className="source-info">
                          <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                            {source.icon || source.name.charAt(0)}
                          </Avatar>
                          <div className="source-details">
                            <Title level={5} style={{ margin: 0 }}>
                              {source.name}
                              {manager.getConfig().defaultSource === source.id && (
                                <Tag color="gold" style={{ marginLeft: 8 }}>默认</Tag>
                              )}
                            </Title>
                            <Text type="secondary">{source.description}</Text>
                            <div style={{ marginTop: 4 }}>
                              {getStatusTag(source)}
                              {getFeatureTags(source)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="source-controls">
                          <Space direction="vertical" align="end">
                            <Switch
                              checked={source.enabled}
                              onChange={(checked) => handleToggleSource(source.id, checked)}
                              checkedChildren="启用"
                              unCheckedChildren="禁用"
                            />
                            
                            {source.enabled && (
                              <Button 
                                size="small" 
                                type={manager.getConfig().defaultSource === source.id ? "primary" : "default"}
                                onClick={() => handleSetDefault(source.id)}
                                disabled={manager.getConfig().defaultSource === source.id}
                              >
                                设为默认
                              </Button>
                            )}
                          </Space>
                        </div>
                      </div>

                      {source.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="source-settings"
                        >
                          <Divider style={{ margin: '12px 0' }} />
                          <div className="priority-setting">
                            <Text strong>优先级: </Text>
                            <Tooltip title="数字越小优先级越高">
                              <Slider
                                min={1}
                                max={10}
                                value={source.priority}
                                onChange={(value) => handlePriorityChange(source.id, value)}
                                style={{ width: 200, marginLeft: 8 }}
                                marks={{
                                  1: '最高',
                                  5: '中等',
                                  10: '最低'
                                }}
                              />
                            </Tooltip>
                          </div>

                          {source.rateLimit && (
                            <div className="rate-limit-info">
                              <Text type="secondary">
                                速率限制: {source.rateLimit.requestsPerSecond}/秒, {source.rateLimit.requestsPerMinute}/分钟
                              </Text>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </Card>
                  </List.Item>
                </motion.div>
              )}
            />
          </motion.div>
        </AnimatePresence>

        {/* 导出配置模态框 */}
        <Modal
          title="导出配置"
          open={configModalVisible}
          onCancel={() => setConfigModalVisible(false)}
          footer={[
            <Button key="copy" onClick={() => {
              navigator.clipboard.writeText(configText);
              message.success('已复制到剪贴板');
            }}>
              复制
            </Button>,
            <Button key="close" type="primary" onClick={() => setConfigModalVisible(false)}>
              关闭
            </Button>
          ]}
        >
          <TextArea
            value={configText}
            readOnly
            rows={15}
            style={{ fontFamily: 'monospace' }}
          />
        </Modal>

        {/* 导入配置模态框 */}
        <Modal
          title="导入配置"
          open={importModalVisible}
          onCancel={() => setImportModalVisible(false)}
          onOk={handleImportConfig}
          okText="导入"
          cancelText="取消"
        >
          <Paragraph>
            请粘贴配置JSON内容：
          </Paragraph>
          <TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴配置JSON..."
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
        </Modal>
      </div>
    </Modal>
  );
};

export default MusicSourceManagerComponent; 