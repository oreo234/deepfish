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
        <el-card class="chart-card tall" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>数据集分布</h3>
              <el-tooltip content="显示训练数据集中各类鱼的数量分布" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <!-- 若后端有数据则渲染图表，否则显示占位图片或文案 -->
          <div v-if="datasetDistributionImg" class="image-container">
            <el-image :src="datasetDistributionImg" fit="contain" />
          </div>
          <div v-else class="chart-container" ref="datasetDistributionChart"></div>
        </el-card>
      </el-col>
      
      <!-- 混合指标图：根据所选模型展示混淆矩阵/训练损失 +（YOLO显示train_batch0） -->
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>模型指标图</h3>
              <el-tooltip content="根据所选模型展示：YOLOv8显示混淆矩阵与train_batch0；其余显示训练损失曲线" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="image-container two-images" v-if="selectedModel==='yolo_seg' || selectedModel==='yolo_test'">
            <div class="img-item">
              <h4>{{ selectedModel==='yolo_seg' ? '验证集 混淆矩阵' : '测试集 混淆矩阵' }}</h4>
              <el-image :src="selectedModel==='yolo_seg' ? yoloSegConfusionImg : yoloValConfusionImg" fit="contain" />
            </div>
            <div class="img-item">
              <h4>训练批次样例（train_batch0）</h4>
              <el-image :src="trainBatchImg" fit="contain" />
            </div>
          </div>
          <div class="image-container" v-else-if="selectedModel==='resnet50'">
            <el-image :src="retinanetLossImg" fit="contain" />
          </div>
          <div class="image-container" v-else-if="selectedModel==='efficientnet'">
            <el-image :src="fasterrcnnLossImg" fit="contain" />
          </div>
        </el-card>
      </el-col>
      <!-- 模型效果图：仅在 YOLO 与 EfficientNet 展示；比例不变、完整显示 -->
      <!-- 新增：曲线4图，两行两列 -->
      <el-col v-if="selectedModel==='yolo_seg' " :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>{{ selectedModel==='yolo_seg' ? '验证集' : '测试集' }}曲线概览</h3>
            </div>
          </template>
          <div class="grid-2x2">
            <el-image :src="selectedModel==='yolo_seg' ? boxF1CurveImg : boxF1CurveImg2" fit="contain" />
            <el-image :src="selectedModel==='yolo_seg' ? boxPCurveImg : boxPCurveImg2" fit="contain" />
            <el-image :src="selectedModel==='yolo_seg' ? boxPRCurveImg : boxPRCurveImg2" fit="contain" />
            <el-image :src="selectedModel==='yolo_seg' ? boxRCurveImg : boxRCurveImg2" fit="contain" />
          </div>
        </el-card>
      </el-col>
      <el-col v-if="selectedModel==='yolo_test'" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>{{ selectedModel==='yolo_seg' ? '验证集' : '测试集' }}曲线概览</h3>
            </div>
          </template>
          <div class="grid-2x2">
            <el-image :src="boxF1CurveImg2" fit="contain" />
            <el-image :src="boxPCurveImg2" fit="contain" />
            <el-image :src="boxPRCurveImg2" fit="contain" />
            <el-image :src="boxRCurveImg2" fit="contain" />
          </div>
        </el-card>
      </el-col>
      <el-col v-if="selectedModel!=='resnet50'" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>模型效果图</h3>
              <el-tooltip content="展示YOLOv8的train_batch0或Faster R-CNN的效果图" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="image-container" v-if="selectedModel==='efficientnet'">
            <el-image :src="efficientnetResultImg" fit="contain" />
          </div>
          <div class="image-container two-images" v-else>
            <div class="img-item">
              <el-image :src="selectedModel==='yolo_seg' ? segResultsImg : valLeftImg" fit="contain" />
            </div>
            <div class="img-item">
              <el-image :src="selectedModel==='yolo_seg' ? trainBatchImg : valRightImg" fit="contain" />
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- 不同模型效果对比（来自 Markdown） -->
      <el-card class="data-table-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>不同模型效果对比</h3>
            <el-tooltip content="根据Markdown内容转为结构化表格进行美观展示" placement="top">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-table :data="modelCompareRows" style="width: 100%" v-if="modelCompareRows.length">
          <el-table-column v-for="(col, idx) in modelCompareCols" :key="idx" :prop="col" :label="col" />
        </el-table>
        <div v-else class="no-excel">未能解析到模型对比内容</div>
      </el-card>

      <!-- 删除冗余块开始 -->
      <!-- 训练曲线旧块、混淆矩阵旧块、性能指标旧块、详细数据表格与详情对话框整体移除，避免校验错误与重复渲染 -->
      <el-col v-if="false"></el-col>
    </el-row>

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
      selectedModel: 'yolo_seg',
      models: [
        { id: 'yolo_seg', name: 'YOLOv8-验证集' },
        { id: 'yolo_test', name: 'YOLOv8-测试集' },
        { id: 'resnet50', name: 'RetinaNet' },
        { id: 'efficientnet', name: 'Faster R-CNN' }
      ],
      charts: {},
      tableData: [],
      detailsDialogVisible: false,
      selectedFishDetails: null,
      metricsOverall: null,
      // 新增：本地图片路径
      datasetDistributionImg: new URL('../assets/yolo_fish_segmentation/labels.jpg', import.meta.url).href,
      yoloSegConfusionImg: new URL('../assets/yolo_fish_segmentation/confusion_matrix.png', import.meta.url).href,
      yoloValConfusionImg: new URL('../assets/yolo_val/confusion_matrix.png', import.meta.url).href,
      trainBatchImg: new URL('../assets/yolo_fish_segmentation/train_batch0.jpg', import.meta.url).href,
      // 验证集/测试集曲线图（两行两列）
      boxF1CurveImg: new URL('../assets/yolo_fish_segmentation/BoxF1_curve.png', import.meta.url).href,
      boxPCurveImg: new URL('../assets/yolo_fish_segmentation/BoxP_curve.png', import.meta.url).href,
      boxPRCurveImg: new URL('../assets/yolo_fish_segmentation/BoxPR_curve.png', import.meta.url).href,
      boxRCurveImg: new URL('../assets/yolo_fish_segmentation/BoxR_curve.png', import.meta.url).href,
      boxF1CurveImg2: new URL('../assets/yolo_val/BoxF1_curve.png', import.meta.url).href,
      boxPCurveImg2: new URL('../assets/yolo_val/BoxP_curve.png', import.meta.url).href,
      boxPRCurveImg2: new URL('../assets/yolo_val/BoxPR_curve.png', import.meta.url).href,
      boxRCurveImg2: new URL('../assets/yolo_val/BoxR_curve.png', import.meta.url).href,
      // 新增：不同模型的训练损失与效果图
      retinanetLossImg: new URL('../assets/retinanet_training_loss_curve.png', import.meta.url).href,
      fasterrcnnLossImg: new URL('../assets/fasterrcnn_training_loss_curve.png', import.meta.url).href,
      efficientnetResultImg: new URL('../assets/fasterrcnn结果.jpg', import.meta.url).href,
      // 验证集左右图
      segResultsImg: new URL('../assets/yolo_fish_segmentation/results.png', import.meta.url).href,
      // 测试集左右图
      valLeftImg: new URL('../assets/yolo_val/val_batch0_labels.jpg', import.meta.url).href,
      valRightImg: new URL('../assets/yolo_val/val_batch1_labels.jpg', import.meta.url).href,
      // Markdown渲染后的HTML
      mdHtml: '',
      valPredImg: new URL('../assets/yolo_fish_segmentation/val_batch0_pred.jpg', import.meta.url).href,
      valLabelImg: new URL('../assets/yolo_fish_segmentation/val_batch0_labels.jpg', import.meta.url).href,
      // Excel 解析后的行列（若无 XLSX 依赖，则不解析，仅提供下载）
      excelRows: [],
      excelCols: [],
      modelCompareCols: [],
      modelCompareRows: [],
      mockData: {
        // 保留 mockData 以便数据集分布和其它图表备用，但优先使用本地图片
      }
    }
  },
  mounted() {
    this.loadModelData()
    // 尝试以CSV解析 results.csv 作为对比数据的简易来源（若存在）
    this.tryLoadCsv()
    this.tryLoadModelCompareMd()
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    async loadModelData() {
      // 保留：整体指标从后端获取
      try {
        const metrics = await fishApi.getMetrics(this.selectedModel)
        this.metricsOverall = metrics
      } catch (err) {
        console.error('获取整体指标失败:', err)
      }
      // 若无后端图表数据，则数据集分布与混淆矩阵使用本地图片，训练曲线可暂不显示或保留占位
      // 数据集分布图表仅在没有本地图片时回退到ECharts
      if (!this.datasetDistributionImg) {
        const data = this.mockData?.[this.selectedModel] || {}
        if (data.datasetDistribution) {
          this.$nextTick(() => this.renderDatasetDistributionChart(data.datasetDistribution))
        }
      }
    },
    // 简易CSV解析（不引入新库），若存在 results.csv 则读取其中的列作为对比表格
    async tryLoadCsv() {
      try {
        const csvUrl = new URL('../assets/yolo_fish_segmentation/results.csv', import.meta.url).href
        const resp = await fetch(csvUrl)
        if (!resp.ok) return
        const text = await resp.text()
        const lines = text.trim().split(/\r?\n/)
        const header = lines.shift().split(',')
        const rows = lines.map(line => {
          const cols = line.split(',')
          const obj = {}
          header.forEach((h, i) => obj[h] = cols[i])
          return obj
        })
        this.excelCols = header
        this.excelRows = rows
      } catch (e) {
        // 如果读取失败，保持空，用户仍可下载Excel原始文件
        this.excelCols = []
        this.excelRows = []
      }
    },
    downloadExcel() {
      // 提供下载链接到本地Excel文件
      const excelUrl = new URL('../../整理好的对比数据.xlsx', import.meta.url).href
      const a = document.createElement('a')
      a.href = excelUrl
      a.download = '整理好的对比数据.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    exportData() {
      // 将当前展示的数据导出为CSV，避免空方法报错
      let headers = []
      let rows = []
      if (this.excelRows && this.excelRows.length && this.excelCols && this.excelCols.length) {
        headers = this.excelCols
        rows = this.excelRows.map(r => headers.map(h => r[h] ?? ''))
      } else if (this.tableData && this.tableData.length) {
        headers = ['class', 'samples', 'precision', 'recall', 'f1', 'accuracy']
        rows = this.tableData.map(r => headers.map(h => r[h] ?? ''))
      } else {
        ElMessage.warning('暂无可供导出的数据')
        return
      }
      const csvContent = [headers.join(','), ...rows.map(cols => cols.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '导出数据.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    tryLoadModelCompareMd() {
      try {
        const mdUrl = new URL('../assets/模型对比.md', import.meta.url).href
        fetch(mdUrl)
          .then(resp => (resp.ok ? resp.text() : Promise.reject('not ok')))
          .then(text => {
            const { cols, rows } = this.parseMarkdownTable(text)
            this.modelCompareCols = cols
            this.modelCompareRows = rows
          })
          .catch(() => {
            this.mdHtml = '<p>未能加载模型效果对比文档。</p>'
            this.modelCompareCols = []
            this.modelCompareRows = []
          })
      } catch (e) {
        this.mdHtml = '<p>未能加载模型效果对比文档。</p>'
        this.modelCompareCols = []
        this.modelCompareRows = []
      }
    },
    simpleMarkdownToHtml(md) {
      const lines = md.split(/\r?\n/)
      const html = []
      let i = 0
      while (i < lines.length) {
        const line = lines[i]
        if (line.startsWith('### ')) { html.push(`<h3>${line.slice(4)}</h3>`); i++; continue }
        if (line.startsWith('## ')) { html.push(`<h2>${line.slice(3)}</h2>`); i++; continue }
        if (line.startsWith('# ')) { html.push(`<h1>${line.slice(2)}</h1>`); i++; continue }
        if (line.trim().startsWith('|')) {
          const tbl = []
          while (i < lines.length && lines[i].trim().startsWith('|')) { tbl.push(lines[i]); i++ }
          const parseRow = r => r.trim().slice(1, r.trim().endsWith('|') ? -1 : undefined).split('|').map(c => c.trim())
          const header = parseRow(tbl[0] || '')
          const rows = tbl.slice(2).map(parseRow)
          html.push('<table>')
          html.push('<thead><tr>' + header.map(h => `<th>${h}</th>`).join('') + '</tr></thead>')
          html.push('<tbody>' + rows.map(cols => '<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>')
          html.push('</table>')
          continue
        }
        if (line.trim().length === 0) { i++; continue }
        html.push(`<p>${line}</p>`)
        i++
      }
      return html.join('\n')
    },
    parseMarkdownTable(md) {
      const lines = md.split(/\r?\n/)
      const tbl = []
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('|')) tbl.push(lines[i])
      }
      if (!tbl.length) return { cols: [], rows: [] }
      // 仅解析第一张表
      const parseRow = r => r.trim().slice(1, r.trim().endsWith('|') ? -1 : undefined).split('|').map(c => c.trim())
      const header = parseRow(tbl[0])
      // 跳过第二行的分隔符
      const rows = tbl.slice(2).map(parseRow).map(cols => Object.fromEntries(cols.map((c, idx) => [header[idx], c])))
      return { cols: header, rows }
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
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-container.two-images {
  gap: 16px;
}
.image-container .el-image {
  max-width: 100%;
  max-height: 100%;
}
.img-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.img-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}
.markdown-content table {
  width: 100%;
  border-collapse: collapse;
}
.markdown-content th,
.markdown-content td {
  border: 1px solid #dcdfe6;
  padding: 6px 8px;
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
.grid-2x2 {
  width: 100%;
  height: 400px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}
.grid-2x2 .el-image {
  width: 100%;
  height: 100%;
}
.chart-card.tall {
  height: 560px;
}
.chart-card.tall .chart-container,
.chart-card.tall .image-container {
  height: 480px;
}
.image-container.two-images {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 16px;
}
</style>