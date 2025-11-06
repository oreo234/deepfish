<template>
  <div class="compare-container">
    <el-page-header @back="goBack" title="返回首页" content="模型对比" />
    
    <div class="upload-section">
      <el-upload
        class="upload-box"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <el-icon class="upload-icon"><upload-filled /></el-icon>
        <div class="upload-text">
          <span>拖拽图片到此处或点击上传</span>
          <p>支持 JPG、PNG 格式图片</p>
        </div>
      </el-upload>
      
      <div class="preview-area" v-if="imageUrl">
        <img :src="imageUrl" class="preview-image" />
        <el-button type="primary" @click="compareModels" :loading="loading">开始对比分析</el-button>
      </div>
    </div>
    
    <div class="comparison-section" v-if="comparisonResults">
      <h2>模型对比结果</h2>
      
      <!-- 模型卡片对比区 -->
      <div class="model-cards">
        <el-row :gutter="20">
          <el-col :span="8" v-for="(model, index) in models" :key="index">
            <el-card class="model-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <h3>{{ model.name }}</h3>
                  <el-tag :type="getTagType(index)">{{ model.type }}</el-tag>
                </div>
              </template>
              
              <div class="card-content">
                <div class="result-image-container">
                  <img :src="comparisonResults[model.id]?.image_url || imageUrl" class="result-image" />
                </div>
                
                <div class="result-info">
                  <div class="fish-class">
                    <span class="label">识别结果:</span>
                    <span class="value">{{ comparisonResults[model.id]?.class || '未知' }}</span>
                  </div>
                  
                  <div class="confidence">
                    <span class="label">置信度:</span>
                    <el-progress 
                      :percentage="Math.round((comparisonResults[model.id]?.confidence || 0) * 100)" 
                      :color="getConfidenceColor(comparisonResults[model.id]?.confidence || 0)"
                    />
                  </div>
                  
                  <div class="inference-time">
                    <span class="label">推理时间:</span>
                    <span class="value">{{ comparisonResults[model.id]?.inference_time || 0 }} 秒</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 图表对比区 -->
      <div class="chart-section">
        <el-tabs type="border-card">
          <el-tab-pane label="准确率对比">
            <div class="chart-container" ref="accuracyChart"></div>
          </el-tab-pane>
          <el-tab-pane label="召回率对比">
            <div class="chart-container" ref="recallChart"></div>
          </el-tab-pane>
          <el-tab-pane label="F1分数对比">
            <div class="chart-container" ref="f1Chart"></div>
          </el-tab-pane>
        </el-tabs>
        
        <div class="chart-actions">
          <el-tooltip content="下载对比图表" placement="top">
            <el-button type="primary" plain icon="Download" @click="downloadChart">下载对比图</el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { fishApi } from '@/api'

export default {
  name: 'ComparePage',
  components: {
    UploadFilled
  },
  data() {
    return {
      imageUrl: '',
      imageFile: null,
      loading: false,
      comparisonResults: null,
      models: [
        { id: 'model1', name: 'YOLOv5', type: '目标检测', color: '#409EFF' },
        { id: 'model2', name: 'ResNet50', type: '分类', color: '#67C23A' },
        { id: 'model3', name: 'EfficientNet', type: '分类', color: '#E6A23C' }
      ],
      charts: {}
    }
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    handleFileChange(file) {
      if (!file) return
      const isImage = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png'
      if (!isImage) {
        ElMessage.error('只能上传JPG或PNG格式的图片!')
        return
      }
      this.imageFile = file.raw
      this.imageUrl = URL.createObjectURL(file.raw)
      this.comparisonResults = null
      Object.values(this.charts).forEach(chart => { chart && chart.dispose() })
      this.charts = {}
    },
    async compareModels() {
      if (!this.imageUrl) {
        ElMessage.warning('请先上传图片')
        return
      }
      this.loading = true
      try {
        const reader = new FileReader()
        reader.readAsDataURL(this.imageFile)
        reader.onload = async () => {
          const base64Image = reader.result.split(',')[1]
          try {
            const data = await fishApi.compare(base64Image)
            this.comparisonResults = data
            this.loading = false
            this.$nextTick(() => { this.renderCharts() })
          } catch (error) {
            console.error('对比请求失败:', error)
            ElMessage.error('对比请求失败，请稍后重试')
            this.loading = false
          }
        }
      } catch (error) {
        console.error('处理图片失败:', error)
        ElMessage.error('处理图片失败，请重试')
        this.loading = false
      }
    },
    getTagType(index) {
      const types = ['', 'success', 'warning']
      return types[index] || ''
    },
    getConfidenceColor(confidence) {
      if (confidence > 0.8) return '#67C23A'
      if (confidence > 0.5) return '#E6A23C'
      return '#F56C6C'
    },
    renderCharts() {
      this.renderAccuracyChart()
      this.renderRecallChart()
      this.renderF1Chart()
    },
    renderAccuracyChart() {
      const chartDom = this.$refs.accuracyChart
      const chart = echarts.init(chartDom)
      this.charts.accuracy = chart
      
      const option = {
        title: {
          text: '准确率对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Top-1准确率', 'Top-5准确率'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.models.map(model => model.name)
        },
        yAxis: {
          type: 'value',
          name: '准确率',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: '{value * 100}%'
          }
        },
        series: [
          {
            name: 'Top-1准确率',
            type: 'bar',
            data: this.models.map(model => this.comparisonResults[model.id]?.metrics.accuracy.top1 || 0),
            itemStyle: {
              color: function(params) {
                const colors = ['#409EFF', '#67C23A', '#E6A23C']
                return colors[params.dataIndex] || '#409EFF'
              }
            }
          },
          {
            name: 'Top-5准确率',
            type: 'bar',
            data: this.models.map(model => this.comparisonResults[model.id]?.metrics.accuracy.top5 || 0),
            itemStyle: {
              color: function(params) {
                const colors = ['#95c8ff', '#95e1a0', '#f3d19e']
                return colors[params.dataIndex] || '#95c8ff'
              }
            }
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderRecallChart() {
      const chartDom = this.$refs.recallChart
      const chart = echarts.init(chartDom)
      this.charts.recall = chart
      
      const option = {
        title: {
          text: '召回率对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.models.map(model => model.name)
        },
        yAxis: {
          type: 'value',
          name: '召回率',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: '{value * 100}%'
          }
        },
        series: [
          {
            name: '召回率',
            type: 'bar',
            data: this.models.map(model => this.comparisonResults[model.id]?.metrics.recall || 0),
            itemStyle: {
              color: function(params) {
                const colors = ['#409EFF', '#67C23A', '#E6A23C']
                return colors[params.dataIndex] || '#409EFF'
              }
            }
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderF1Chart() {
      const chartDom = this.$refs.f1Chart
      const chart = echarts.init(chartDom)
      this.charts.f1 = chart
      
      const option = {
        title: {
          text: 'F1分数对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.models.map(model => model.name)
        },
        yAxis: {
          type: 'value',
          name: 'F1分数',
          min: 0,
          max: 1,
          axisLabel: {
            formatter: '{value * 100}%'
          }
        },
        series: [
          {
            name: 'F1分数',
            type: 'bar',
            data: this.models.map(model => this.comparisonResults[model.id]?.metrics.f1 || 0),
            itemStyle: {
              color: function(params) {
                const colors = ['#409EFF', '#67C23A', '#E6A23C']
                return colors[params.dataIndex] || '#409EFF'
              }
            }
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    downloadChart() {
      ElMessage.success('图表已下载')
      // 实际项目中应该实现真正的下载功能
    }
  }
}
</script>

<style scoped>
.compare-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 上传区域样式 */
.upload-section {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.upload-box {
  width: 100%;
  max-width: 500px;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  padding: 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #8c939d;
  margin-bottom: 10px;
}

.upload-text {
  color: #606266;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 对比结果区域样式 */
.comparison-section {
  margin-top: 40px;
}

.comparison-section h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

/* 模型卡片样式 */
.model-cards {
  margin-bottom: 40px;
}

.model-card {
  height: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-image-container {
  text-align: center;
  margin-bottom: 10px;
}

.result-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-info .label {
  font-weight: bold;
  color: #606266;
  margin-right: 5px;
}

.result-info .value {
  color: #303133;
}

/* 图表区域样式 */
.chart-section {
  margin-top: 40px;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.chart-actions {
  margin-top: 20px;
  text-align: right;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .model-cards .el-row {
    display: block;
  }
  
  .model-cards .el-col {
    width: 100%;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>