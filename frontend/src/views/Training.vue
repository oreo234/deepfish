<template>
  <div class="training-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>训练曲线</span>
              <el-select v-model="selectedModel" placeholder="选择模型" size="small" style="width: 160px">
                <el-option label="YOLOv5" value="yolov5" />
                <el-option label="YOLOv8" value="yolov8" />
              </el-select>
            </div>
          </template>
          <div ref="chartEl" class="chart"></div>
        </el-card>
        <el-card class="chart-card" shadow="never" style="margin-top: 20px">
          <template #header>
            <span>学习率与其它指标</span>
          </template>
          <div ref="chartEl2" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>训练日志</span>
          </template>
          <div class="logs">
            <pre>{{ logs }}</pre>
          </div>
          <div class="actions">
            <el-button type="primary" :loading="loading" @click="refresh">刷新</el-button>
            <el-button @click="downloadLogs">下载日志</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

export default {
  name: 'TrainingPage',
  data() {
    return {
      selectedModel: 'yolov5',
      loading: false,
      logs: 'Epoch 1/50 loss=1.24 mAP@0.5=0.45\nEpoch 2/50 loss=1.10 mAP@0.5=0.50\n...',
      mockCurves: {
        epochs: Array.from({ length: 20 }, (_, i) => i + 1),
        loss: Array.from({ length: 20 }, () => (Math.random() * 0.5 + 0.5).toFixed(3)),
        accuracy: Array.from({ length: 20 }, () => (Math.random() * 0.2 + 0.7).toFixed(3)),
        lr: Array.from({ length: 20 }, () => (Math.random() * 0.001 + 0.0005).toFixed(6))
      }
    }
  },
  mounted() {
    this.renderCharts()
  },
  methods: {
    renderCharts() {
      const el = this.$refs.chartEl
      const chart = echarts.init(el)
      const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['损失', '准确率'] },
        xAxis: { type: 'category', data: this.mockCurves.epochs.map(e => `Epoch ${e}`) },
        yAxis: [
          { type: 'value', name: '损失' },
          { type: 'value', name: '准确率', min: 0, max: 1 }
        ],
        series: [
          { name: '损失', type: 'line', yAxisIndex: 0, data: this.mockCurves.loss },
          { name: '准确率', type: 'line', yAxisIndex: 1, data: this.mockCurves.accuracy }
        ]
      }
      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())

      const el2 = this.$refs.chartEl2
      const chart2 = echarts.init(el2)
      const option2 = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['学习率'] },
        xAxis: { type: 'category', data: this.mockCurves.epochs.map(e => `Epoch ${e}`) },
        yAxis: [{ type: 'value', name: 'LR' }],
        series: [ { name: '学习率', type: 'line', data: this.mockCurves.lr } ]
      }
      chart2.setOption(option2)
      window.addEventListener('resize', () => chart2.resize())
    },
    async refresh() {
      this.loading = true
      try {
        // TODO: 接入后端训练状态接口
        await new Promise(r => setTimeout(r, 600))
        ElMessage.success('训练状态已刷新')
      } finally {
        this.loading = false
      }
    },
    downloadLogs() {
      const blob = new Blob([this.logs], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'training_logs.txt'
      a.click()
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.training-page {
  padding: 20px;
}
.chart-card {
  height: 420px;
}
.chart {
  width: 100%;
  height: 340px;
}
.logs {
  height: 300px;
  overflow: auto;
  background: #fafafa;
  padding: 10px;
  border: 1px solid #ebeef5;
}
.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}
</style>