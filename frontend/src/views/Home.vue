<template>
  <div class="home-container">
    <!-- 顶部Hero区域 -->
    <div class="hero-section">
      <video autoplay loop muted class="background-video">
        <source src="../assets/fish.mp4" type="video/mp4">
      </video>
      <div class="hero-content">
        <h1>AI 鱼类识别系统</h1>
        <p>基于深度学习的智能鱼类识别与分析平台</p>
      </div>
    </div>
    
    <!-- 功能卡片区域 -->
    <div class="features-section">
      <el-row :gutter="20" justify="center">
        <el-col :xs="24" :sm="8" v-for="(card, index) in featureCards" :key="index">
          <el-card class="feature-card" shadow="hover" @click="navigateTo(card.route)">
            <div class="card-icon">
              <el-icon :size="50" :color="card.iconColor">
                <component :is="card.icon"></component>
              </el-icon>
            </div>
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 页脚区域 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="tech-stack">
          <h3>技术栈</h3>
          <p>Vue3 | Element Plus | ECharts | FastAPI | PyTorch | YOLOv5</p>
        </div>
        <div class="team-info">
          <h3>团队</h3>
          <p>靳取 倪镭 钟欣言</p>
        </div>
        <div class="github-link">
          <h3>GitHub</h3>
          <a href="https://github.com/username/fish-detect" target="_blank">项目源码</a>
        </div>
      </div>
      <div class="copyright">
        <p>&copy; 2025 AI鱼类识别系统 - 保留所有权利</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { Search, DataAnalysis, PieChart, VideoPlay, TrendCharts, ChatLineRound } from '@element-plus/icons-vue'

export default {
  name: 'HomePage',
  components: {
    Search,
    DataAnalysis,
    PieChart,
    VideoPlay,
    TrendCharts,
    ChatLineRound
  },
  data() {
    return {
      featureCards: [
        {
          title: '单张测试',
          description: '上传单张图片，快速识别鱼类种类',
          icon: 'Search',
          iconColor: '#409EFF',
          route: '/test'
        },
        {
          title: '模型对比',
          description: '多个模型同时分析，对比识别效果',
          icon: 'DataAnalysis',
          iconColor: '#67C23A',
          route: '/compare'
        },
        {
          title: '数据看板',
          description: '查看数据集分布和模型性能指标',
          icon: 'PieChart',
          iconColor: '#E6A23C',
          route: '/dashboard'
        },
        // 新增功能入口
        {
          title: '视频识别',
          description: '上传视频或摄像头识别，支持逐帧检测',
          icon: 'VideoPlay',
          iconColor: '#8e44ad',
          route: '/video'
        },
        {
          title: '训练过程',
          description: '查看模型训练进度与日志、曲线等',
          icon: 'TrendCharts',
          iconColor: '#2ecc71',
          route: '/training'
        },
        {
          title: 'AI 助手',
          description: '交流与问答，获取系统使用和技术支持',
          icon: 'ChatLineRound',
          iconColor: '#e67e22',
          route: '/assistant'
        }
      ]
    }
  },
  methods: {
    navigateTo(route) {
      this.$router.push(route)
    }
  }
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Hero区域样式 */
.hero-section {
  position: relative;
  height: 500px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.6);
}

.hero-content {
  z-index: 1;
  padding: 20px;
}

.hero-content h1 {
  font-size: 3.5rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-content p {
  font-size: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* 功能卡片区域样式 */
.features-section {
  padding: 60px 20px;
  background-color: #f5f7fa;
  flex: 1;
}

.feature-card {
  height: 100%;
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease;
  cursor: pointer;
  margin-bottom: 20px;
}

.feature-card:hover {
  transform: translateY(-10px);
}

.card-icon {
  margin-bottom: 20px;
}

.feature-card h2 {
  margin-bottom: 15px;
  font-size: 1.8rem;
  color: #303133;
}

.feature-card p {
  color: #606266;
  font-size: 1rem;
}

/* 页脚样式 */
.footer {
  background-color: #303133;
  color: #e0e0e0;
  padding: 40px 20px 20px;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 30px;
}

.footer-content > div {
  margin-bottom: 20px;
}
</style>