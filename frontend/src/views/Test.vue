<template>
  <div class="test-container">
    <el-page-header @back="goBack" title="返回首页" content="单张图片测试" />
    
    <div class="content-area">
      <!-- 左侧上传区域 -->
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
          <el-button type="primary" @click="detectFish" :loading="loading">开始识别</el-button>
        </div>
        
        <div class="sample-images">
          <h3>样例图片</h3>
          <div class="samples">
            <div 
              v-for="(sample, index) in sampleImages" 
              :key="index"
              class="sample-item"
              @click="useSampleImage(sample.url)"
            >
              <img :src="sample.url" :alt="sample.name" />
              <span>{{ sample.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧结果区域 -->
      <div class="result-section">
        <div v-if="!result" class="no-result">
          <el-empty description="请上传图片并点击开始识别" />
        </div>
        
        <div v-else class="result-content">
          <h2>识别结果</h2>
          
          <div class="result-image-container">
            <img :src="resultImageUrl || imageUrl" class="result-image" />
          </div>
          
          <div class="result-details">
            <el-descriptions title="鱼类信息" :column="1" border>
              <el-descriptions-item label="鱼种类">
                <el-tag size="large">{{ result.class }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="置信度">
                <el-progress 
                  :percentage="Math.round(result.confidence * 100)" 
                  :color="confidenceColor"
                  :format="percentageFormat"
                />
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="result-footer">
            <div class="inference-time">
              <el-statistic title="推理耗时" :value="result.inference_time" :precision="2">
                <template #suffix>
                  <span>秒</span>
                </template>
              </el-statistic>
            </div>
            
            <div class="model-info">
              <el-tag type="info">模型: {{ result.model }}</el-tag>
            </div>
            
            <el-button type="primary" @click="resetTest">再试一次</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fishApi } from '@/api'

export default {
  name: 'TestPage',
  components: {
    UploadFilled
  },
  data() {
    return {
      imageUrl: '',
      imageFile: null,
      uploadedImageId: null, // 上传后返回的图片ID
      predictType: 'yolo_public_model', // 默认模型类型
      loading: false,
      result: null,
      resultImageUrl: '',
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
      },
      sampleImages: [
        { name: '金鱼 (Carassius auratus)', url: '/samples/goldfish.jpg' },
        { name: '锦鲤 (Cyprinus carpio)', url: '/samples/carp.jpg' },
        { name: '斗鱼 (Betta splendens)', url: '/samples/betta.jpg' },
        { name: '孔雀鱼 (Poecilia reticulata)', url: '/samples/guppy.jpg' },
        { name: '神仙鱼 (Pterophyllum scalare)', url: '/samples/angelfish.jpg' }
      ]
    }
  },
  computed: {
    confidenceColor() {
      const confidence = this.result?.confidence || 0
      if (confidence > 0.8) return '#67C23A'
      if (confidence > 0.5) return '#E6A23C'
      return '#F56C6C'
    },
    percentageFormat() {
      return (percentage) => `${percentage}%`
    }
  },
  methods: {
    goBack() {
      this.$router.push('/')
    },
    async handleFileChange(file) {
      if (!file) return

      const type = file.raw?.type || ''
      const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(type)
      if (!isImage) {
        ElMessage.error('只能上传JPG、PNG或GIF格式的图片!')
        return
      }

      // 预览与状态重置
      this.imageFile = file.raw
      this.imageUrl = URL.createObjectURL(file.raw)
      this.result = null
      this.resultImageUrl = ''
      this.uploadedImageId = null

      // 立即上传到 /upload，并保存图片ID
      try {
        const res = await fishApi.uploadImage(file.raw)
        if (res && res.id) {
          this.uploadedImageId = res.id
          ElMessage.success(`图片上传成功，ID: ${res.id}`)
        } else {
          ElMessage.warning('上传成功，但未返回图片ID')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        ElMessage.error('图片上传失败，请稍后重试')
      }
    },
    async useSampleImage(url) {
      this.imageUrl = url
      this.imageFile = null
      this.result = null
      this.resultImageUrl = ''
      this.uploadedImageId = null

      // 将样例图片转为 File 并上传
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const file = new File([blob], 'sample.jpg', { type: blob.type || 'image/jpeg' })
        const res = await fishApi.uploadImage(file)
        if (res && res.id) {
          this.uploadedImageId = res.id
          ElMessage.success(`样例图片上传成功，ID: ${res.id}`)
        } else {
          ElMessage.warning('样例图片上传成功，但未返回图片ID')
        }
      } catch (error) {
        console.error('样例图片上传失败:', error)
        ElMessage.error('样例图片上传失败，请稍后重试')
      }
    },
    async detectFish() {
      if (!this.imageUrl) {
        ElMessage.warning('请先上传或选择图片')
        return
      }

      // 如果没有获得图片ID，尝试补传一次
      if (!this.uploadedImageId) {
        try {
          let fileToUpload = this.imageFile
          if (!fileToUpload && this.imageUrl.startsWith('/')) {
            const resp = await fetch(this.imageUrl)
            const blob = await resp.blob()
            fileToUpload = new File([blob], 'sample.jpg', { type: blob.type || 'image/jpeg' })
          }
          if (fileToUpload) {
            const r = await fishApi.uploadImage(fileToUpload)
            if (r && r.id) {
              this.uploadedImageId = r.id
              ElMessage.success(`图片重新上传成功，ID: ${r.id}`)
            }
          }
        } catch (e) {
          console.error('补传图片失败:', e)
        }
      }

      if (!this.uploadedImageId) {
        ElMessage.error('缺少图片ID，无法执行识别。请重新上传图片。')
        return
      }

      this.loading = true
      try {
        // 按接口文档：基于 image_id 调用 /predict
        const data = await fishApi.predictById(this.uploadedImageId, this.predictType)

        // 将后端的英文 class_name 映射为前端中英双语显示
        const mappedClass = this.classNameMap[data?.detections?.[0]?.class_name] || data?.detections?.[0]?.class_name || '未知鱼类'
        const confidence = Number(data?.detections?.[0]?.confidence || 0)

        // 更新前端结果信息（替换默认展示）
        this.result = {
          class: mappedClass,
          confidence,
          inference_time: data?.inference_time || 0,
          model: data?.predict_type || this.predictType
        }

        // 通过第二个接口获取识别结果图像URL进行展示
        if (data?.result_image_id) {
          this.resultImageUrl = fishApi.getImageUrl(data.result_image_id)
        } else {
          this.resultImageUrl = ''
        }
      } catch (error) {
        console.error('识别请求失败:', error)
        ElMessage.error('识别请求失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    resetTest() {
      this.imageUrl = ''
      this.imageFile = null
      this.uploadedImageId = null
      this.result = null
      this.resultImageUrl = ''
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-area {
  display: flex;
  margin-top: 30px;
  gap: 30px;
}

/* 左侧上传区域样式 */
.upload-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-box {
  width: 100%;
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

.sample-images {
  margin-top: 20px;
}

.sample-images h3 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #606266;
}

.samples {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.sample-item {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.sample-item:hover {
  transform: scale(1.05);
}

.sample-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.sample-item span {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

/* 右侧结果区域样式 */
.result-section {
  flex: 1;
  min-height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: white;
}

.no-result {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-content h2 {
  text-align: center;
  color: #303133;
  margin-bottom: 10px;
}

.result-image-container {
  text-align: center;
}

.result-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.result-details {
  margin-top: 20px;
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content-area {
    flex-direction: column;
  }
  
  .result-footer {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>