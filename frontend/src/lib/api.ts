import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

export type FieldErrors = Record<string, string>

const REFRESH_EXEMPT_URLS = ['/auth/login', '/auth/register', '/auth/refresh']

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type ValidationIssue = {
  loc?: (string | number)[]
  msg?: string
}

function normalizeValidationIssues(detail: unknown[]): FieldErrors {
  const fieldErrors: FieldErrors = {}

  for (const issue of detail) {
    if (typeof issue !== 'object' || issue === null) continue

    const { loc, msg } = issue as ValidationIssue
    if (typeof msg !== 'string' || !Array.isArray(loc)) continue

    const field = loc.filter((part) => part !== 'body').at(-1)
    if (field === undefined) continue

    fieldErrors[String(field)] = msg
  }

  return fieldErrors
}

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0
  const data = error.response?.data

  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail

    if (typeof detail === 'string') {
      return new ApiError(detail, status)
    }

    if (Array.isArray(detail)) {
      return new ApiError(
        'Verifique os campos destacados.',
        status,
        normalizeValidationIssues(detail),
      )
    }
  }

  if (status === 0) {
    const message =
      error.code === 'ECONNABORTED'
        ? 'O servidor demorou para responder. Tente novamente.'
        : 'Não foi possível conectar ao servidor.'
    return new ApiError(message, status)
  }

  return new ApiError(error.message || 'Erro inesperado.', status)
}

function refreshableConfig(error: AxiosError): RetriableConfig | null {
  const config = error.config as RetriableConfig | undefined
  if (!config || config._retry) return null
  if (error.response?.status !== 401) return null
  const url = config.url ?? ''
  if (REFRESH_EXEMPT_URLS.some((path) => url.endsWith(path))) return null
  return config
}

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.warn(
    '[api] VITE_API_URL não definido — usando caminhos relativos. Copie .env.example para .env.',
  )
}

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
})

// Registrado antes do de normalizacao para receber o AxiosError cru: se um 401
// for de sessao expirada, renova via refresh_token e repete a requisicao uma vez.
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError) {
      const config = refreshableConfig(error)

      if (config) {
        config._retry = true
        try {
          await api.post('/auth/refresh')
          return await api.request(config)
        } catch {
          // Sessao nao recuperavel: segue com o 401 original.
        }
      }

      return Promise.reject(toApiError(error))
    }
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      return Promise.reject(toApiError(error))
    }
    return Promise.reject(error)
  },
)
