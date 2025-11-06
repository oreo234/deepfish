import axios from 'axios'

// 创建axios实例（直接请求外部API，不依赖本地后端）
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 全部请求强制附加 Authorization: Bearer <SECRET_KEY>
    const secret = import.meta.env.VITE_SECRET_KEY || '1234@abcd'
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${secret}`
    // 兼容网关的自定义头（可按需删除）
    config.headers['SECRET_KEY'] = secret
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

// ----------------------
// 缓存工具（localStorage + TTL）
// ----------------------
const CACHE_PREFIX = 'fish_cache:'

const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key)
      if (!raw) return null
      const { data, exp } = JSON.parse(raw)
      if (exp && Date.now() > exp) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return data
    } catch (e) {
      console.warn('Cache get error:', e)
      return null
    }
  },
  set(key, data, ttl = 5 * 60 * 1000) {
    try {
      const exp = ttl > 0 ? Date.now() + ttl : null
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, exp }))
    } catch (e) {
      console.warn('Cache set error:', e)
    }
  },
  remove(key) {
    localStorage.removeItem(CACHE_PREFIX + key)
  },
  clear(prefix = '') {
    const p = CACHE_PREFIX + prefix
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(p)) localStorage.removeItem(k)
    })
  }
}

// 简易稳定字符串哈希（用于生成缓存键）
function simpleHash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return h.toString(16)
}

function makeKey(endpoint, payload) {
  const s = typeof payload === 'string' ? payload : JSON.stringify(payload || {})
  // 避免Base64过长，取哈希
  return `${endpoint}:${simpleHash(s)}`
}

// 包装 GET/POST，带缓存
async function cachedGet(url, params = {}, options = {}) {
  const { useCache = true, ttl = 5 * 60 * 1000 } = options
  const key = makeKey(url, params)
  if (useCache) {
    const hit = cache.get(key)
    if (hit) return hit
  }
  const data = await api.get(url, { params })
  if (useCache) cache.set(key, data, ttl)
  return data
}

async function cachedPost(url, body = {}, options = {}) {
  const { useCache = true, ttl = 5 * 60 * 1000 } = options
  const key = makeKey(url, body)
  if (useCache) {
    const hit = cache.get(key)
    if (hit) return hit
  }
  const data = await api.post(url, body)
  if (useCache) cache.set(key, data, ttl)
  return data
}

// ----------------------
// 鱼类识别API（直接请求外部API）
// ----------------------
export const fishApi = {
  // 新增：上传图片（multipart/form-data）
  async uploadImage(file) {
    const form = new FormData()
    form.append('file', file)
    const secret = import.meta.env.VITE_SECRET_KEY || '1234@abcd'
    // 覆盖 Content-Type 并显式附加 Authorization 以确保不会被代理或拦截器合并覆盖
    return api.post('/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${secret}`,
        'SECRET_KEY': secret
      }
    })
  },

  // 新增：基于 image_id 进行预测
  predictById(imageId, predictType = 'yolo_public_model', options = {}) {
    const body = { image_id: imageId, predict_type: predictType }
    return cachedPost('/predict', body, { ...options, useCache: false })
  },

  // 获取图片URL（接口文档第2个接口）
  getImageUrl(imageId) {
    const base = import.meta.env.VITE_API_BASE || '/api'
    // 统一拼接，避免重复斜杠
    return `${base.replace(/\/$/, '')}/image/${imageId}`
  },

  // 保留：旧的 Base64 识别
  predict(imageBase64, options = {}) {
    return cachedPost('/predict', { image: imageBase64 }, options)
  },

  // 多模型对比
  compare(imageBase64, options = {}) {
    return cachedPost('/compare', { image: imageBase64 }, options)
  },

  // 获取指标数据
  getMetrics(modelId = null, options = {}) {
    const params = modelId ? { model: modelId } : {}
    return cachedGet('/metrics', params, options)
  },

  // 获取热力图
  getHeatmap(imageId, options = {}) {
    return cachedGet(`/heatmap/${imageId}`, {}, options)
  },

  // 训练相关（根据外部API约定，如未实现可与后端对齐）
  trainingStart(payload, options = {}) {
    // payload: { dataset_id, model, epochs, hyperparams }
    return cachedPost('/training/start', payload, { ...options, useCache: false })
  },
  trainingStatus(taskId = null, options = {}) {
    const params = taskId ? { task_id: taskId } : {}
    return cachedGet('/training/status', params, { ...options, ttl: 5 * 1000 })
  },
  trainingLogs(taskId, tail = 200, options = {}) {
    const params = { task_id: taskId, tail }
    return cachedGet('/training/logs', params, { ...options, ttl: 5 * 1000 })
  },
  trainingDownload(taskId, artifact = 'best', options = {}) {
    const params = { task_id: taskId, artifact }
    return cachedGet('/training/download', params, options)
  },

  // AI 助手
  assistantChat(sessionId, message, context = null, options = {}) {
    const body = { session_id: sessionId, message, context }
    // 聊天请求不建议缓存（每次问题不同）
    return cachedPost('/assistant/chat', body, { ...options, useCache: false })
  },
  assistantHistory(sessionId, limit = 50, options = {}) {
    const params = { session_id: sessionId, limit }
    return cachedGet('/assistant/history', params, options)
  },

  // 缓存管理
  clearCache(prefix = '') {
    cache.clear(prefix)
  }
}

// 保留默认导出
export default api