import axios from 'axios'
import { getPublicApiUrl } from '@/config/publicApiUrl'
import { getJwtToken } from './jwtTokenStore'

const apiUrl = getPublicApiUrl()

export const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-type': 'application/json',
  },
})

// Request interceptor to add JWT token to API requests only
axiosInstance.interceptors.request.use(
  config => {
    // Only add token on client side (not during SSR)
    if (typeof window !== 'undefined') {
      const requestUrl = config.baseURL || config.url || ''
      // Only add token if the request is going to our API
      if (apiUrl && (requestUrl.includes(apiUrl) || config.baseURL === apiUrl)) {
        const token = getJwtToken()
        if (token) {
          if (!config.headers) {
            config.headers = {}
          }
          config.headers.Authorization = token
        }
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)
