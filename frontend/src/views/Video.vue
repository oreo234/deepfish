<template>
  <div class="video-page">
    <el-card class="card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>视频识别</span>
          <el-button type="primary" :disabled="!videoLoaded || processing" @click="startDetect">开始识别</el-button>
          <el-button type="danger" :disabled="!processing" @click="stopDetect">停止识别</el-button>
        </div>
      </template>
      <div class="content">
        <div class="left">
          <div class="upload-box">
            <el-upload
              class="upload"
              action=""
              :auto-upload="false"
              :show-file-list="false"
              accept="video/*"
              :on-change="handleVideoChange"
            >
              <el-button type="primary">选择视频文件</el-button>
            </el-upload>
            <div class="tips">支持 mp4 等常见视频格式，识别过程将抽取关键帧进行检测</div>
          </div>
          <div class="preview-box" v-if="videoUrl">
            <video ref="videoEl" :src="videoUrl" controls @loadedmetadata="onLoaded" class="preview-video"></video>
          </div>
        </div>
        <div class="right">
          <el-card shadow="hover" class="results-card">
            <template #header>
              <div class="card-header">
                <span>识别结果（逐帧）</span>
              </div>
            </template>
            <el-empty v-if="frameResults.length === 0" description="尚未开始识别或无结果" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="(item, idx) in frameResults"
                :key="idx"
                :timestamp="item.timeLabel"
                placement="top"
              >
                <div class="result-item">
                  <div class="thumb">
                    <img :src="item.frameDataUrl" alt="frame" />
                  </div>
                  <div class="info">
                    <div class="class">类别：{{ item.result.class }}</div>
                    <div class="conf">置信度：{{ (item.result.confidence * 100).toFixed(1) }}%</div>
                    <div class="model">模型：{{ item.result.model }}</div>
                    <div class="time">推理耗时：{{ item.result.inference_time }}s</div>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { fishApi } from '@/api/index.js'

export default {
  name: 'VideoRecognition',
  data() {
    return {
      videoUrl: '',
      videoLoaded: false,
      processing: false,
      frameResults: [],
      frameIntervalSec: 1, // 抽帧间隔（秒）
      maxFrames: 8, // 最大抽帧数量
      _timer: null
    }
  },
  methods: {
    handleVideoChange(file) {
      if (!file || !file.raw) return
      const raw = file.raw
      const url = URL.createObjectURL(raw)
      this.videoUrl = url
      this.videoLoaded = false
      this.frameResults = []
      this.$nextTick(() => {
        const v = this.$refs.videoEl
        if (v) {
          v.load()
        }
      })
    },
    onLoaded() {
      this.videoLoaded = true
    },
    startDetect() {
      if (!this.videoLoaded) {
        ElMessage.warning('请先选择并加载视频')
        return
      }
      if (this.processing) return
      this.processing = true
      this.frameResults = []
      const video = this.$refs.videoEl
      const duration = Math.floor(video.duration)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 设置画布尺寸为视频尺寸
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360

      let framesExtracted = 0
      let currentTime = 0

      const processNextFrame = async () => {
        if (!this.processing) return
        if (framesExtracted >= this.maxFrames || currentTime > duration) {
          this.processing = false
          ElMessage.success('识别完成')
          return
        }
        try {
          video.currentTime = currentTime
          await this.waitForFrameRender(video)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/png')
          const base64 = dataUrl.split(',')[1]
          const predict = await fishApi.predict(base64)
          this.frameResults.push({
            timeLabel: `t = ${currentTime}s`,
            frameDataUrl: dataUrl,
            result: predict
          })
          framesExtracted += 1
          currentTime += this.frameIntervalSec
          // 下一帧
          setTimeout(processNextFrame, 300)
        } catch (err) {
          console.error('视频识别错误:', err)
          ElMessage.error('识别发生错误')
          this.processing = false
        }
      }

      processNextFrame()
    },
    stopDetect() {
      this.processing = false
    },
    waitForFrameRender(video) {
      // 等待视频在指定时间渲染完成
      return new Promise((resolve) => {
        const handler = () => {
          video.removeEventListener('seeked', handler)
          resolve()
        }
        video.addEventListener('seeked', handler)
      })
    }
  },
  beforeUnmount() {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl)
    this.processing = false
  }
}
</script>

<style scoped>
.video-page {
  padding: 20px;
}
.card {
  max-width: 1200px;
  margin: 0 auto;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.content {
  display: flex;
  gap: 20px;
}
.left, .right {
  flex: 1;
}
.upload-box {
  margin-bottom: 16px;
}
.tips {
  margin-top: 8px;
  color: #909399;
}
.preview-box {
  margin-top: 10px;
}
.preview-video {
  width: 100%;
  max-height: 400px;
}
.results-card {
  min-height: 400px;
}
.result-item {
  display: flex;
  gap: 12px;
  align-items: center;
}
.result-item .thumb {
  width: 160px;
  height: 90px;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.result-item .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.result-item .info {
  display: grid;
  grid-template-columns: repeat(2, auto);
  gap: 8px 24px;
}
</style>