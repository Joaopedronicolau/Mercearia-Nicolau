export type Produto = {
  id: string
  nome: string
  quantidade: number
  estoque_minimo: number
  preco_custo: number
  preco_venda: number
  validade: string | null
}

export type ItemVenda = {
  id: string
  nome: string
  quantidade: number
  preco_venda: number
}

export type Venda = {
  id: string
  total: number
  lucro: number
  fiado: boolean
  cliente: string | null
  pago: boolean
  criado_em: string
  venda_itens: ItemVenda[]
}

export const R = (n: number) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Aceita "12,50" ou "12.50"
export const num = (s: string) => {
  const v = parseFloat(String(s).replace(',', '.'))
  return Number.isFinite(v) ? v : 0
}

export function hojeISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

export function diasParaVencer(validade: string | null): number | null {
  if (!validade) return null
  const a = new Date(validade + 'T00:00:00').getTime()
  const b = new Date(hojeISO() + 'T00:00:00').getTime()
  return Math.round((a - b) / 86400000)
}

export function dataBR(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function resumoItens(v: Venda) {
  return v.venda_itens.map((i) => `${i.quantidade}× ${i.nome}`).join(', ')
}
