'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, hojeISO } from '@/lib/tipos'

type VendaRow = { total: number; lucro: number; fiado: boolean; pago: boolean }
type ItemRow = { nome: string; quantidade: number; preco_venda: number; preco_custo: number }
type Linha = { nome: string; qtd: number; venda: number; lucro: number }

// O Supabase devolve no máximo 1000 linhas por consulta; isto busca em páginas.
async function buscarTudo<T>(
  fazer: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const todos: T[] = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await fazer(de, de + 999)
    if (error) throw new Error(error.message)
    todos.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return todos
}

export default function Relatorio() {
  const [de, setDe] = useState(hojeISO())
  const [ate, setAte] = useState(hojeISO())
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [resumo, setResumo] = useState({ qtdVendas: 0, total: 0, lucro: 0, fiadoAberto: 0 })
  const [linhas, setLinhas] = useState<Linha[]>([])

  const carregar = useCallback(async (d: string, a: string) => {
    if (!d || !a || d > a) {
      setErro('Escolha um período válido (a data inicial não pode ser maior que a final).')
      return
    }
    setCarregando(true)
    setErro('')
    try {
      const sb = getSupabase()
      const { data: auth } = await sb.auth.getUser()
      if (!auth.user) throw new Error('Faça login para ver o relatório.')
      const uid = auth.user.id

      // período inclusivo, no fuso de Brasília
      const inicio = `${d}T00:00:00-03:00`
      const fim = `${a}T23:59:59.999-03:00`

      const vendas = await buscarTudo<VendaRow>((x, y) =>
        sb.from('vendas').select('total, lucro, fiado, pago')
          .eq('user_id', uid).gte('criado_em', inicio).lte('criado_em', fim)
          .order('criado_em').range(x, y)
      )
      const itens = await buscarTudo<ItemRow>((x, y) =>
        sb.from('venda_itens')
          .select('nome, quantidade, preco_venda, preco_custo, vendas!inner(criado_em)')
          .eq('user_id', uid).gte('vendas.criado_em', inicio).lte('vendas.criado_em', fim)
          .range(x, y)
      )

      setResumo({
        qtdVendas: vendas.length,
        total: vendas.reduce((s, v) => s + Number(v.total), 0),
        lucro: vendas.reduce((s, v) => s + Number(v.lucro), 0),
        fiadoAberto: vendas.filter((v) => v.fiado && !v.pago).reduce((s, v) => s + Number(v.total), 0),
      })

      const mapa = new Map<string, Linha>()
      for (const i of itens) {
        const venda = i.quantidade * Number(i.preco_venda)
        const custo = i.quantidade * Number(i.preco_custo)
        const l = mapa.get(i.nome) ?? { nome: i.nome, qtd: 0, venda: 0, lucro: 0 }
        l.qtd += i.quantidade
        l.venda += venda
        l.lucro += venda - custo
        mapa.set(i.nome, l)
      }
      setLinhas([...mapa.values()].sort((p, q) => q.lucro - p.lucro))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar(de, ate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const margem = resumo.total ? (resumo.lucro / resumo.total) * 100 : 0

  return (
    <section className="space-y-3">
      <div className="card flex flex-wrap items-end gap-2">
        <label className="text-sm">
          De
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="block rounded border p-2" />
        </label>
        <label className="text-sm">
          Até
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="block rounded border p-2" />
        </label>
        <button className="btn" onClick={() => carregar(de, ate)} disabled={carregando}>
          {carregando ? 'Carregando…' : 'Filtrar'}
        </button>
      </div>

      {erro && <div className="erro">{erro}</div>}

      <div className="card grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <div><b className="block break-words text-base sm:text-xl">{R(resumo.total)}</b><span className="text-sm text-gray-700">Vendas ({resumo.qtdVendas})</span></div>
        <div><b className="block break-words text-base sm:text-xl">{R(resumo.lucro)}</b><span className="text-sm text-gray-700">Lucro</span></div>
        <div><b className="block break-words text-base sm:text-xl">{margem.toFixed(1)}%</b><span className="text-sm text-gray-700">Margem</span></div>
        <div><b className="block break-words text-base sm:text-xl">{R(resumo.fiadoAberto)}</b><span className="text-sm text-gray-700">Fiado em aberto</span></div>
      </div>
      <p className="text-xs text-gray-600">
        Vendas e lucro incluem as vendas no fiado (mesmo ainda não pagas). O fiado em aberto é o valor que ainda falta receber.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Produto</th><th>Qtd</th><th>Vendido</th><th>Lucro</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.nome} className="border-b">
                <td className="py-2">{l.nome}</td><td>{l.qtd}</td><td>{R(l.venda)}</td><td>{R(l.lucro)}</td>
              </tr>
            ))}
            {!carregando && linhas.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-600">Nenhuma venda no período.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
