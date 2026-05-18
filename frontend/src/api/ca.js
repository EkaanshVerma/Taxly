import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const caLogin = (email, password) =>
  axios.post(`${BASE}/ca/login`, { email, password })

export const caRegister = (name, email, phone, password) =>
  axios.post(`${BASE}/ca/register`, { name, email, phone, password })

export const getClients = (token) =>
  axios.get(`${BASE}/ca/clients`, { headers: { Authorization: `Bearer ${token}` } })

export const createClient = (token, clientName, clientPhone) =>
  axios.post(`${BASE}/ca/clients`, { client_name: clientName, client_phone: clientPhone }, { headers: { Authorization: `Bearer ${token}` } })

export const approveClient = (token, sessionId, notes) =>
  axios.post(`${BASE}/ca/clients/${sessionId}/approve`, { notes }, { headers: { Authorization: `Bearer ${token}` } })

export const downloadXml = (token, sessionId) =>
  axios.get(`${BASE}/ca/clients/${sessionId}/xml`, { headers: { Authorization: `Bearer ${token}` } })

export const deleteClient = (token, sessionId) =>
  axios.delete(`${BASE}/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } })
