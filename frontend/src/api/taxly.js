import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const createSession = (userId) =>
  axios.post(`${BASE}/sessions`, { user_id: userId })

export const sendMessage = (sessionId, message) =>
  axios.post(`${BASE}/sessions/${sessionId}/chat`, { message })

export const uploadForm16 = (sessionId, file) => {
  const form = new FormData()
  form.append('file', file)
  return axios.post(`${BASE}/sessions/${sessionId}/upload-form16`, form)
}

export const calculateTax = (sessionId) =>
  axios.post(`${BASE}/sessions/${sessionId}/calculate`)

export const generateXml = (sessionId, taxpayer) =>
  axios.post(`${BASE}/sessions/${sessionId}/generate-xml`, { taxpayer })

export const getSession = (sessionId) =>
  axios.get(`${BASE}/sessions/${sessionId}`)

export const getSessions = (userId) =>
  axios.get(`${BASE}/sessions`, { params: { user_id: userId } })

export const downloadXml = (sessionId) =>
  axios.get(`${BASE}/sessions/${sessionId}/download-xml`)

export const sendOtp = (email) =>
  axios.post(`${BASE}/auth/send-otp`, { email })

export const verifyOtp = (email, otp) =>
  axios.post(`${BASE}/auth/verify-otp`, { email, otp })