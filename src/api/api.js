import axios from 'axios'

// 创建 axios 实例
const service = axios.create({
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 2xx 范围内的状态码都会触发该函数
    const res = response.data
    
    // 根据实际业务需求处理响应数据
    if (response.status === 200) {
      return res
    } else {
      // 其他状态码视为错误
      console.error('请求错误:', res.message || '未知错误')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    // 超出 2xx 范围的状态码都会触发该函数
    console.error('响应错误:', error.message)
    
    if (error.response) {
      // 请求已发出，服务器返回状态码
      const status = error.response.status
      switch (status) {
        case 400:
          console.error('请求参数错误')
          break
        case 401:
          console.error('未授权，请重新登录')
          break
        case 403:
          console.error('拒绝访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        case 502:
          console.error('网关错误')
          break
        case 503:
          console.error('服务不可用')
          break
        default:
          console.error(`连接错误: ${status}`)
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，请检查网络连接')
    } else {
      // 发送请求时出了点问题
      console.error('请求配置错误:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// 获取随机英文单词接口
export const getRandomEnglishWords = () => {
  return service({
    url: 'https://v2.xxapi.cn/api/randomenglishwords',
    method: 'get'
  })
}

// 导出 axios 实例供其他接口使用
export default service
