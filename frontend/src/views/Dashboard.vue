<template>
  <div class="dashboard-container">
    <el-page-header @back="goBack" title="返回首页" content="数据看板" />
    
    <div class="dashboard-header">
      <h1>鱼类识别模型数据分析</h1>
      <el-select v-model="selectedModel" placeholder="选择模型" @change="loadModelData">
        <el-option
          v-for="model in models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        />
      </el-select>
    </div>
    
    <el-row :gutter="20" class="dashboard-content">
      <!-- 数据集分布 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>数据集分布</h3>
              <el-tooltip content="显示训练数据集中各类鱼的数量分布" placement="top">
                <el-icon><info-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="chart-container" ref="datasetDistributionChart"></div>
        </el-card>
      </el-col>
      
      <!-- 训练曲线 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>训练曲线</h3>
              <el-tooltip content="显示模型训练过程中损失和准确率的变化" placement="top">
                <el-icon><info-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="chart-container" ref="trainingCurveChart"></div>
        </el-card>
      </el-col>
      
      <!-- 混淆矩阵 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>混淆矩阵</h3>
              <el-tooltip content="显示模型在测试集上的预测结果与真实标签的对比" placement="top">
                <el-icon><info-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="chart-container" ref="confusionMatrixChart"></div>
        </el-card>
      </el-col>
      
      <!-- 性能指标 -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>性能指标</h3>
              <el-tooltip content="显示模型在各类鱼上的精确率、召回率和F1分数" placement="top">
                <el-icon><info-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="chart-container" ref="performanceMetricsChart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 详细数据表格 -->
    <el-card class="data-table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>详细指标数据</h3>
          <el-button type="primary" size="small" @click="exportData">导出数据</el-button>
        </div>
      </template>
      <el-table :data="tableData" stripe style="width: 100%" height="400">
        <el-table-column prop="class" label="鱼类" width="180" />
        <el-table-column prop="samples" label="样本数" width="100" />
        <el-table-column prop="precision" label="精确率" width="100">
          <template #default="scope">
            {{ (scope.row.precision * 100).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="recall" label="召回率" width="100">
          <template #default="scope">
            {{ (scope.row.recall * 100).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="f1" label="F1分数" width="100">
          <template #default="scope">
            {{ (scope.row.f1 * 100).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="accuracy" label="准确率" width="100">
          <template #default="scope">
            {{ (scope.row.accuracy * 100).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetails(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailsDialogVisible"
      title="鱼类识别详情"
      width="80%"
    >
      <div v-if="selectedFishDetails">
        <div class="fish-details-header">
          <h2>{{ selectedFishDetails.class }}</h2>
          <p>样本数量: {{ selectedFishDetails.samples }}</p>
        </div>
        
        <el-divider content-position="center">性能指标</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">精确率:</span>
              <el-progress 
                :percentage="Math.round(selectedFishDetails.precision * 100)" 
                :color="getColorByValue(selectedFishDetails.precision)"
              />
            </div>
            <div class="metric-item">
              <span class="metric-label">召回率:</span>
              <el-progress 
                :percentage="Math.round(selectedFishDetails.recall * 100)" 
                :color="getColorByValue(selectedFishDetails.recall)"
              />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="metric-item">
              <span class="metric-label">F1分数:</span>
              <el-progress 
                :percentage="Math.round(selectedFishDetails.f1 * 100)" 
                :color="getColorByValue(selectedFishDetails.f1)"
              />
            </div>
            <div class="metric-item">
              <span class="metric-label">准确率:</span>
              <el-progress 
                :percentage="Math.round(selectedFishDetails.accuracy * 100)" 
                :color="getColorByValue(selectedFishDetails.accuracy)"
              />
            </div>
          </el-col>
        </el-row>
        
        <el-divider content-position="center">样例图片</el-divider>
        
        <div class="sample-images">
          <div v-for="(image, index) in selectedFishDetails.sampleImages" :key="index" class="sample-image-container">
            <el-image 
              :src="image" 
              fit="cover"
              :preview-src-list="selectedFishDetails.sampleImages"
            />
          </div>
        </div>
        
        <el-divider content-position="center">常见误识别</el-divider>
        
        <div class="misclassification-info">
          <p>该类鱼最容易被误识别为:</p>
          <el-tag 
            v-for="(item, index) in selectedFishDetails.commonMisclassifications" 
            :key="index"
            :type="getTagType(index)"
            class="misclassification-tag"
          >
            {{ item.class }} ({{ (item.rate * 100).toFixed(1) }}%)
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { fishApi } from '@/api'

export default {
  name: 'DashboardPage',
  components: {
    InfoFilled
  },
  data() {
    return {
      selectedModel: 'yolov5',
      models: [
        { id: 'yolov5', name: 'YOLOv5' },
        { id: 'resnet50', name: 'ResNet50' },
        { id: 'efficientnet', name: 'EfficientNet' }
      ],
      charts: {},
      tableData: [],
      detailsDialogVisible: false,
      selectedFishDetails: null,
      metricsOverall: null,
      mockData: {
        yolov5: {
          datasetDistribution: [
            { value: 245, name: '金鱼' },
            { value: 198, name: '锦鲤' },
            { value: 176, name: '斗鱼' },
            { value: 154, name: '孔雀鱼' },
            { value: 132, name: '神仙鱼' },
            { value: 120, name: '罗汉鱼' },
            { value: 98, name: '龙鱼' }
          ],
          trainingCurve: {
            epochs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            loss: [0.82, 0.56, 0.43, 0.36, 0.31, 0.28, 0.25, 0.23, 0.21, 0.20],
            accuracy: [0.65, 0.78, 0.83, 0.86, 0.88, 0.90, 0.91, 0.92, 0.93, 0.94]
          },
          confusionMatrix: [
            [95, 3, 1, 0, 0, 1, 0],
            [2, 92, 0, 3, 1, 0, 2],
            [1, 0, 94, 2, 2, 1, 0],
            [0, 2, 1, 93, 3, 1, 0],
            [1, 1, 2, 2, 91, 2, 1],
            [2, 0, 1, 1, 2, 94, 0],
            [0, 3, 0, 0, 1, 1, 95]
          ],
          classNames: ['金鱼', '锦鲤', '斗鱼', '孔雀鱼', '神仙鱼', '罗汉鱼', '龙鱼'],
          performanceMetrics: [
            { class: '金鱼', precision: 0.95, recall: 0.94, f1: 0.945, accuracy: 0.96, samples: 245 },
            { class: '锦鲤', precision: 0.92, recall: 0.91, f1: 0.915, accuracy: 0.93, samples: 198 },
            { class: '斗鱼', precision: 0.94, recall: 0.93, f1: 0.935, accuracy: 0.95, samples: 176 },
            { class: '孔雀鱼', precision: 0.93, recall: 0.92, f1: 0.925, accuracy: 0.94, samples: 154 },
            { class: '神仙鱼', precision: 0.91, recall: 0.90, f1: 0.905, accuracy: 0.92, samples: 132 },
            { class: '罗汉鱼', precision: 0.94, recall: 0.93, f1: 0.935, accuracy: 0.95, samples: 120 },
            { class: '龙鱼', precision: 0.95, recall: 0.94, f1: 0.945, accuracy: 0.96, samples: 98 }
          ],
          fishDetails: {
            '金鱼': {
              class: '金鱼',
              samples: 245,
              precision: 0.95,
              recall: 0.94,
              f1: 0.945,
              accuracy: 0.96,
              sampleImages: [
                'https://via.placeholder.com/150?text=金鱼1',
                'https://via.placeholder.com/150?text=金鱼2',
                'https://via.placeholder.com/150?text=金鱼3',
                'https://via.placeholder.com/150?text=金鱼4'
              ],
              commonMisclassifications: [
                { class: '锦鲤', rate: 0.03 },
                { class: '斗鱼', rate: 0.01 },
                { class: '罗汉鱼', rate: 0.01 }
              ]
            },
            '锦鲤': {
              class: '锦鲤',
              samples: 198,
              precision: 0.92,
              recall: 0.91,
              f1: 0.915,
              accuracy: 0.93,
              sampleImages: [
                'https://via.placeholder.com/150?text=锦鲤1',
                'https://via.placeholder.com/150?text=锦鲤2',
                'https://via.placeholder.com/150?text=锦鲤3',
                'https://via.placeholder.com/150?text=锦鲤4'
              ],
              commonMisclassifications: [
                { class: '金鱼', rate: 0.02 },
                { class: '孔雀鱼', rate: 0.03 },
                { class: '龙鱼', rate: 0.02 }
              ]
            }
            // 其他鱼类详情数据省略...
          }
        }
        // 其他模型数据省略...
      }
    }
  },
  mounted() {
    this.loadModelData()
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    async loadModelData() {
      // 1) 调用后端接口获取整体指标
      try {
        const metrics = await fishApi.getMetrics(this.selectedModel)
        this.metricsOverall = metrics
      } catch (err) {
        console.error('获取整体指标失败:', err)
        ElMessage.error('获取整体指标失败')
      }

      // 2) 仍使用本地模拟数据渲染其余图表（如需接后端可再替换）
      const data = this.mockData?.[this.selectedModel] || this.mockData?.yolov5
      if (data) {
        this.tableData = data.performanceMetrics || []
        this.$nextTick(() => {
          this.renderDatasetDistributionChart(data.datasetDistribution)
          this.renderTrainingCurveChart(data.trainingCurve)
          this.renderConfusionMatrixChart(data.confusionMatrix, data.classNames)
        })
      }

      // 3) 渲染整体性能指标图
      if (this.metricsOverall) {
        this.$nextTick(() => {
          this.renderOverallMetricsChart(this.metricsOverall)
        })
      }
    },
    renderOverallMetricsChart(metrics) {
      const chartDom = this.$refs.performanceMetricsChart
      if (this.charts.performanceMetrics) {
        this.charts.performanceMetrics.dispose()
      }
      const chart = echarts.init(chartDom)
      this.charts.performanceMetrics = chart

      const categories = ['Top-1准确率', 'Top-5准确率', '召回率', 'F1分数']
      const values = [
        metrics?.accuracy?.top1 || 0,
        metrics?.accuracy?.top5 || 0,
        metrics?.recall || 0,
        metrics?.f1 || 0
      ]

      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 20 } },
        yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: '{value * 100}%' } },
        series: [
          {
            name: '指标值',
            type: 'bar',
            data: values,
            itemStyle: { color: '#4fc08d' }
          }
        ]
      }
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderDatasetDistributionChart(data) {
      const chartDom = this.$refs.datasetDistributionChart
      if (this.charts.datasetDistribution) {
        this.charts.datasetDistribution.dispose()
      }
      
      const chart = echarts.init(chartDom)
      this.charts.datasetDistribution = chart
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: data.map(item => item.name)
        },
        series: [
          {
            name: '数据集分布',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderTrainingCurveChart(data) {
      const chartDom = this.$refs.trainingCurveChart
      if (this.charts.trainingCurve) {
        this.charts.trainingCurve.dispose()
      }
      
      const chart = echarts.init(chartDom)
      this.charts.trainingCurve = chart
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['损失', '准确率']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.epochs.map(epoch => `Epoch ${epoch}`)
        },
        yAxis: [
          {
            type: 'value',
            name: '损失',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#ff7675'
              }
            },
            axisLabel: {
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '准确率',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: {
                color: '#0984e3'
              }
            },
            axisLabel: {
              formatter: '{value * 100}%'
            }
          }
        ],
        series: [
          {
            name: '损失',
            type: 'line',
            yAxisIndex: 0,
            data: data.loss,
            itemStyle: {
              color: '#ff7675'
            }
          },
          {
            name: '准确率',
            type: 'line',
            yAxisIndex: 1,
            data: data.accuracy,
            itemStyle: {
              color: '#0984e3'
            }
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderConfusionMatrixChart(data, classNames) {
      const chartDom = this.$refs.confusionMatrixChart
      if (this.charts.confusionMatrix) {
        this.charts.confusionMatrix.dispose()
      }
      
      const chart = echarts.init(chartDom)
      this.charts.confusionMatrix = chart
      
      // 准备数据
      const seriesData = []
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          seriesData.push([i, j, data[i][j]])
        }
      }
      
      const option = {
        tooltip: {
          position: 'top',
          formatter: function(params) {
            return `预测: ${classNames[params.data[1]]}<br>实际: ${classNames[params.data[0]]}<br>数量: ${params.data[2]}`
          }
        },
        grid: {
          height: '70%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: classNames,
          splitArea: {
            show: true
          },
          axisLabel: {
            interval: 0,
            rotate: 45
          },
          name: '预测类别',
          nameLocation: 'middle',
          nameGap: 50
        },
        yAxis: {
          type: 'category',
          data: classNames,
          splitArea: {
            show: true
          },
          name: '实际类别',
          nameLocation: 'middle',
          nameGap: 50
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          inRange: {
            color: ['#e0f7fa', '#4dd0e1', '#0097a7', '#006064']
          }
        },
        series: [{
          name: '混淆矩阵',
          type: 'heatmap',
          data: seriesData,
          label: {
            show: true
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    renderPerformanceMetricsChart(data) {
      const chartDom = this.$refs.performanceMetricsChart
      if (this.charts.performanceMetrics) {
        this.charts.performanceMetrics.dispose()
      }
      
      const chart = echarts.init(chartDom)
      this.charts.performanceMetrics = chart
      
      const classNames = data.map(item => item.class)
      const precision = data.map(item => item.precision)
      const recall = data.map(item => item.recall)
      const f1 = data.map(item => item.f1)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['精确率', '召回率', 'F1分数']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: classNames,
            axisLabel: {
              interval: 0,
              rotate: 45
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '分数',
            min: 0,
            max: 1,
            axisLabel: {
              formatter: '{value * 100}%'
            }
          }
        ],
        series: [
          {
            name: '精确率',
            type: 'bar',
            data: precision,
            itemStyle: {
              color: '#4fc08d'
            }
          },
          {
            name: '召回率',
            type: 'bar',
            data: recall,
            itemStyle: {
              color: '#0984e3'
            }
          },
          {
            name: 'F1分数',
            type: 'bar',
            data: f1,
            itemStyle: {
              color: '#fdcb6e'
            }
          }
        ]
      }
      
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    },
    viewDetails(row) {
      // 在实际项目中，这里可能需要额外的API调用获取详细信息
      // 这里使用模拟数据
      const modelData = this.mockData[this.selectedModel] || this.mockData.yolov5
      this.selectedFishDetails = modelData.fishDetails[row.class] || {
        ...row,
        sampleImages: [
          'https://via.placeholder.com/150?text=样例图片',
          'https://via.placeholder.com/150?text=样例图片'
        ],
        commonMisclassifications: [
          { class: '其他鱼类1', rate: 0.02 },
          { class: '其他鱼类2', rate: 0.01 }
        ]
      }
      
      this.detailsDialogVisible = true
    },
    exportData() {
      ElMessage.success('数据已导出')
      // 实际项目中应该实现真正的数据导出功能
    },
    getColorByValue(value) {
      if (value >= 0.9) return '#67C23A'
      if (value >= 0.8) return '#409EFF'
      if (value >= 0.7) return '#E6A23C'
      return '#F56C6C'
    },
    getTagType(index) {
      const types = ['', 'success', 'warning', 'info', 'danger']
      return types[index % types.length] || ''
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 0;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.dashboard-content {
  margin-bottom: 30px;
}

.chart-card {
  margin-bottom: 20px;
  height: 400px;
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

.chart-container {
  height: 320px;
  width: 100%;
}

.data-table-card {
  margin-top: 30px;
}

/* 详情对话框样式 */
.fish-details-header {
  text-align: center;
  margin-bottom: 20px;
}

.fish-details-header h2 {
  margin: 0;
  color: #303133;
}

.metric-item {
  margin-bottom: 15px;
}

.metric-label {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
}

.sample-images {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin: 20px 0;
}

.sample-image-container {
  width: 150px;
  height: 150px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.misclassification-info {
  text-align: center;
}

.misclassification-tag {
  margin: 5px;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-card {
    height: 350px;
  }
  
  .chart-container {
    height: 270px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>