import axios from "axios"
import { CHATBOT_API_URL, BASE_URL } from "@/constants/Constant"

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

const chatbotApi = axios.create({
  baseURL: CHATBOT_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

chatbotApi.interceptors.request.use(
  (config) => {
    const cookieToken = getCookie("access_token")
    if (cookieToken) {
      config.headers["Authorization"] = cookieToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

chatbotApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const { accessToken: newAccessToken } = response.data
        originalRequest.headers["Authorization"] = `${newAccessToken}`
        return chatbotApi(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export type KnowledgeEntry = {
  id: string
  question: string
  answer: string
  category: string
  language: string
}

export const getKnowledgeEntries = async (): Promise<KnowledgeEntry[]> => {
  const res = await chatbotApi.get<KnowledgeEntry[]>("/admin/knowledge")
  return res.data
}

export const addKnowledgeEntry = async (data: {
  question: string
  answer: string
  category: string
  language: string
}): Promise<KnowledgeEntry> => {
  const res = await chatbotApi.post<KnowledgeEntry>("/admin/knowledge", data)
  return res.data
}

export const deleteKnowledgeEntry = async (entryId: string): Promise<void> => {
  await chatbotApi.delete(`/admin/knowledge/${entryId}`)
}

export default chatbotApi
