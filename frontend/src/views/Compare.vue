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
          <p>支持 JPG、PNG、GIF 格式图片</p>
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
    </div>
  </div>
</template>

<script>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
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
      uploadedImageId: null,
      loading: false,
      comparisonResults: null,
      // 与接口文档一致的三个检测模型
      models: [
        { id: 'yolo_public_model', name: 'YOLOv5', type: '目标检测', color: '#409EFF' },
        { id: 'faster_rcnn_public_model', name: 'Faster R-CNN', type: '目标检测', color: '#67C23A' },
        { id: 'retinanet_public_model', name: 'RetinaNet', type: '目标检测', color: '#E6A23C' }
      ],
      // 映射后端英文类别到前端中英双语
      classNameMap: {
        AngelFish: '神仙鱼 (Pterophyllum scalare)',
        BlueTang: '蓝吊 (Paracanthurus hepatus)',
        ButterflyFish: '蝶鱼 (Chaetodontidae)',
        ClownFish: '小丑鱼 (Amphiprioninae)',
        GoldFish: '金鱼 (Carassius auratus)',
        Gourami: '丝足鱼/吻鱼 (Osphronemidae)',
        MorishIdol: '莫里什神仙鱼 (Zanclidae)',
        PlatyFish: '月光鱼/剑尾鱼 (Xiphophorus maculatus)',
        RibbonedSweetlips: '丝鳢/花唇鱼 (Plectorhinchus polytaenia)',
        ThreeStripedDamselfish: '三带豆娘 (Dascyllus aruanus)',
        YellowCichlid: '黄慈鲷 (Labidochromis caeruleus)',
        YellowTang: '黄吊 (Zebrasoma flavescens)',
        ZebraFish: '斑马鱼 (Danio rerio)'
      }
    }
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    handleFileChange(file) {
      if (!file) return
      const type = file.raw?.type || ''
      const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(type)
      if (!isImage) {
        ElMessage.error('只能上传JPG、PNG或GIF格式的图片!')
        return
      }
      this.imageFile = file.raw
      this.imageUrl = URL.createObjectURL(file.raw)
      this.comparisonResults = null
      
      // 按接口文档：选择图片后立即上传到 /upload，保存图片ID
      fishApi.uploadImage(file.raw)
        .then(res => {
          if (res && res.id) {
            this.uploadedImageId = res.id
            ElMessage.success(`图片上传成功，ID: ${res.id}`)
          } else {
            ElMessage.warning('上传成功，但未返回图片ID')
          }
        })
        .catch(err => {
          console.error('图片上传失败:', err)
          ElMessage.error('图片上传失败，请稍后重试')
        })
    },
    async compareModels() {
      if (!this.imageUrl) {
        ElMessage.warning('请先上传图片')
        return
      }

      // 若缺少图片ID，补传一次当前文件
      if (!this.uploadedImageId && this.imageFile) {
        try {
          const r = await fishApi.uploadImage(this.imageFile)
          if (r && r.id) {
            this.uploadedImageId = r.id
            ElMessage.success(`图片重新上传成功，ID: ${r.id}`)
          }
        } catch (e) {
          console.error('补传图片失败:', e)
        }
      }

      if (!this.uploadedImageId) {
        ElMessage.error('缺少图片ID，无法开始对比分析。请重新上传图片。')
        return
      }

      this.loading = true
      this.comparisonResults = {}

      try {
        // 并行向三个模型发送 /predict 请求，并记录点击到返回的时间差
        const types = this.models.map(m => m.id)
        const tasks = types.map(async (ptype) => {
          const startTs = performance.now()
          const data = await fishApi.predictById(this.uploadedImageId, ptype)
          const elapsed = (performance.now() - startTs) / 1000
          const det = data?.detections?.[0] || {}
          const mappedClass = this.classNameMap[det.class_name] || det.class_name || '未知'
          const confidence = Number(det.confidence || 0)
          this.comparisonResults[ptype] = {
            image_url: data?.result_image_id ? fishApi.getImageUrl(data.result_image_id) : this.imageUrl,
            class: mappedClass,
            confidence,
            inference_time: Number(elapsed.toFixed(3))
          }
        })

        await Promise.allSettled(tasks)
      } catch (error) {
        console.error('对比请求失败:', error)
        ElMessage.error('对比请求失败，请稍后重试')
      } finally {
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

/* 上传区域样式：左右排列 */
.upload-section {
  margin-top: 30px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
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

/* 响应式调整 */
@media (max-width: 768px) {
  .model-cards .el-row {
    display: block;
  }
  
  .model-cards .el-col {
    width: 100%;
  }
  
  .upload-section {
    flex-direction: column; /* 小屏幕下上下排列 */
    align-items: center;
  }
}
</style>