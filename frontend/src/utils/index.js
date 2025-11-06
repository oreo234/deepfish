/**
 * 图片转Base64
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 返回Base64字符串
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = error => reject(error)
  })
}

/**
 * 格式化置信度为百分比
 * @param {number} confidence - 置信度值(0-1)
 * @returns {string} - 格式化后的百分比字符串
 */
export const formatConfidence = (confidence) => {
  return `${(confidence * 100).toFixed(2)}%`
}

/**
 * 根据置信度获取对应的状态类型
 * @param {number} confidence - 置信度值(0-1)
 * @returns {string} - Element Plus的类型(success, warning, danger)
 */
export const getConfidenceType = (confidence) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.5) return 'warning'
  return 'danger'
}

/**
 * 格式化时间戳为可读字符串
 * @param {number} timestamp - 时间戳
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 防抖后的函数
 */
export const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 节流后的函数
 */
export const throttle = (fn, delay) => {
  let last = 0
  return function(...args) {
    const now = Date.now()
    if (now - last > delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 获取随机颜色
 * @returns {string} - 十六进制颜色值
 */
export const getRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`
}

/**
 * 下载文件
 * @param {string} url - 文件URL
 * @param {string} filename - 文件名
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} - 是否复制成功
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}