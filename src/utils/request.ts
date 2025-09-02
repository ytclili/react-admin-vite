import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const devBaseURL = 'http://localhost:3002/api'
const prodBaseURL = 'https://api.xinchebangmai.cn'

const BASE_URL = devBaseURL

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

// Request interceptor: attach token if exists
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor: unify success/error handling
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Backend unified response { code, message, data }
    const res = response.data
    if (typeof res === 'object' && res !== null && 'code' in res) {
      if (res.code === 0 || res.code === 200) {
        return res.data as any
      }
      return Promise.reject({ code: res.code, message: res.message })
    }
    // Support { statusCode, message, data }
    if (typeof res === 'object' && res !== null && 'statusCode' in (res as any)) {
      const r: any = res
      if (r.statusCode >= 200 && r.statusCode < 300) {
        return r
      }
      return Promise.reject({ code: r.statusCode, message: r.message })
    }
    // Fallback: return raw data
    return response.data as any
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        // Token expired -> clear and optionally redirect
        localStorage.removeItem('token')
      }
    }
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig) {
  return instance.request<any, T>(config)
}

export function get<T = any>(url: string, config?: AxiosRequestConfig) {
  return instance.get<any, T>(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
  return instance.post<any, T>(url, data, config)
}

export default instance


