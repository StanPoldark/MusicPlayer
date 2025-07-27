# 音乐播放器项目

这是一个基于 Next.js 的现代音乐播放器应用。

## 最新优化 (2024)

### 播放控制优化
- **修复播放状态切换问题**：现在暂停后再播放会从暂停的位置继续，而不是重新开始
- **改进进度条控制**：拖拽进度条更加精确，支持实时预览播放位置
- **播放位置保存**：自动保存每首歌的播放位置，切换歌曲后能恢复到上次播放的位置
- **状态同步优化**：确保UI状态与实际音频播放状态完全同步

### 性能优化
- **音频源管理**：只在真正切换歌曲时重新设置音频源，避免不必要的重载
- **AudioContext优化**：改进音频上下文的初始化和管理
- **内存管理**：更好的事件监听器管理和清理
- **加载状态**：添加音频加载指示器，提供更好的用户反馈

### 用户体验改进
- **错误处理**：增强的错误处理和用户提示
- **加载反馈**：播放按钮显示加载状态
- **进度条工具提示**：拖拽时显示时间预览
- **播放历史**：记录每首歌的播放进度

### 技术改进
- **Redux状态管理**：新增 `currentTime`、`duration`、`isLoading`、`playbackHistory` 状态
- **类型安全**：改进 TypeScript 类型定义
- **代码结构**：分离音频源设置和播放控制逻辑
- **动画优化**：使用 Framer Motion 添加流畅的UI动画

## 功能特性

- 🎵 音乐播放、暂停、上一首、下一首
- 🎚️ 音量控制和进度条拖拽
- 🔄 播放模式切换（单曲循环、列表循环、顺序播放）
- 📱 响应式设计，支持移动端
- 🎨 现代化UI设计，支持全屏模式
- 🎤 歌词显示和同步
- 📊 音频频谱可视化
- 🔍 音乐搜索和播放列表管理
- 💾 播放历史和位置记忆

## 技术栈

- **前端框架**: Next.js 15
- **状态管理**: Redux Toolkit
- **UI组件**: Ant Design
- **动画**: Framer Motion
- **样式**: Tailwind CSS + SCSS
- **类型检查**: TypeScript
- **音频处理**: Web Audio API

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── components/          # React组件
│   ├── MusicPlayer/    # 音乐播放器核心组件
│   ├── Search/         # 搜索组件
│   ├── PlayList/       # 播放列表组件
│   └── ...
├── redux/              # Redux状态管理
│   └── modules/
│       └── musicPlayer/ # 音乐播放器状态
├── contexts/           # React Context
├── hooks/              # 自定义Hooks
├── utils/              # 工具函数
└── types/              # TypeScript类型定义
```

## 主要组件说明

### MusicPlayer 组件
- 核心播放控制逻辑
- 音频源管理和状态同步
- 进度条和音量控制
- 播放模式和全屏功能

### Redux 状态管理
- `currentTrack`: 当前播放歌曲
- `isPlaying`: 播放状态
- `currentTime`: 当前播放时间
- `duration`: 歌曲总时长
- `playbackHistory`: 播放历史记录
- `isLoading`: 加载状态

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License
