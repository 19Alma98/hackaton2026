import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.warn(
    '[axiosInstance] VITE_API_URL non è definita. ' +
    'Copia .env.example in .env.local e imposta il valore corretto.'
  )
}

export const axiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const url = axios.isAxiosError(error) ? error.config?.url : 'unknown'
    const message = axios.isAxiosError(error) ? error.message : String(error)
    console.error(`[API Error] ${url ?? ''}:`, message)
    return Promise.reject(error)
  }
)
