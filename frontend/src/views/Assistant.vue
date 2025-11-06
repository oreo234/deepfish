<template>
  <div class="assistant-page">
    <el-card shadow="never" class="card">
      <template #header>
        <div class="card-header">
          <span>AI 助手</span>
        </div>
      </template>
      <div class="chat-box" ref="chatBox">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['msg', msg.role]">
          <div class="bubble">
            <div class="content">{{ msg.content }}</div>
          </div>
        </div>
      </div>
      <div class="input-box">
        <el-input v-model="input" placeholder="请输入问题，例如：如何进行视频识别？" @keyup.enter="send" />
        <el-button type="primary" @click="send">发送</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'

export default {
  name: 'AssistantPage',
  data() {
    return {
      input: '',
      messages: [
        { role: 'assistant', content: '你好，我是系统内置的助手，可以回答使用说明与常见问题。' }
      ]
    }
  },
  methods: {
    async send() {
      const text = (this.input || '').trim()
      if (!text) return
      this.messages.push({ role: 'user', content: text })
      this.input = ''
      this.scrollToBottom()
      try {
        // TODO: 可接入后端/第三方LLM
        await new Promise(r => setTimeout(r, 400))
        const reply = this.simpleFAQ(text)
        this.messages.push({ role: 'assistant', content: reply })
        this.$nextTick(this.scrollToBottom)
      } catch (err) {
        console.error(err)
        ElMessage.error('助手暂时不可用')
      }
    },
    simpleFAQ(text) {
      const t = text.toLowerCase()
      if (t.includes('视频')) return '在“视频识别”页面选择视频文件，点击开始识别，系统会按间隔抽帧进行检测并展示结果。'
      if (t.includes('训练')) return '在“训练过程”页面可查看训练曲线与日志，后续可接入后端训练状态接口以实时更新。'
      if (t.includes('热力图')) return '识别后可在后端提供的 /heatmap 接口获取热力图（SVG），前端可进行展示。'
      return '请详细描述你的问题，我将尽力为你解答。'
    },
    scrollToBottom() {
      const box = this.$refs.chatBox
      if (box) box.scrollTop = box.scrollHeight
    }
  }
}
</script>

<style scoped>
.assistant-page { padding: 20px; }
.card { max-width: 900px; margin: 0 auto; }
.card-header { display: flex; align-items: center; }
.chat-box {
  height: 460px;
  overflow: auto;
  padding: 10px;
  background: #fafafa;
  border: 1px solid #ebeef5;
}
.msg { display: flex; margin: 10px 0; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }
.bubble { max-width: 70%; padding: 10px 14px; border-radius: 10px; }
.msg.user .bubble { background: #409eff; color: white; }
.msg.assistant .bubble { background: white; border: 1px solid #ebeef5; }
.input-box { display: flex; gap: 10px; margin-top: 10px; }
</style>