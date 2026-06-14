import axios from 'axios'

const BASE = '/api'

export const uploadPDF = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await axios.post(`${BASE}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const askQuestion = async (sessionId, question, apiKey) => {
  const { data } = await axios.post(`${BASE}/ask`, {
    session_id: sessionId,
    question,
    api_key: apiKey,
  })
  return data
}

export const getSessions = async () => {
  const { data } = await axios.get(`${BASE}/sessions`)
  return data
}

export const getSession = async (sessionId) => {
  const { data } = await axios.get(`${BASE}/sessions/${sessionId}`)
  return data
}

export const deleteSession = async (sessionId) => {
  await axios.delete(`${BASE}/sessions/${sessionId}`)
}
