export interface RequestRow {
  id: number
  method: string
  path: string
  headers: string
  query: string
  body: string
  ip: string
  created_at: number | string
}
export interface BinRow {
  id: string
  expires_at: number | string
  created_at: number | string
}
