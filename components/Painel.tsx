'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, hojeISO, type Produto, type Venda } from '@/lib/tipos'
import Estoque from './Estoque'
import Vender from './Vender'
import Fiado from './Fiado'
import Historico from './Historico'

type Aba = 'estoque' | 'vender' | 'fiado' | 'historico'
const ABAS: { id: Aba; nome: string }[] = [
  { id: 'estoque', nome: 'Estoque' },
  { id: 'vender', nome: 'Vender' },
  { id: 'fiado', nome: 'Fiado' },
  { id: 'historico', nome: 'Histórico' },
]

export default function Painel() {
  const [aba, setAba] = useState<Aba>('estoque')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const sb = getSupabase()
    const [p, v] = await Promise.all([
      sb.from('produtos').select('*').order('nome'),
      sb.from('vendas').select('*, venda_itens(*)').order('criado_em', { ascending: false }).limit(300),
    ])
    if (p.error || v.error) {
      setErro('Não consegui carregar os dados. Confira a internet e atualize a página.')
      return
    }
    setErro('')
    setProdutos(p.data as Produto[])
    setVendas(v.data as Venda[])
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const hoje = hojeISO()
  const vendasHoje = vendas
    .filter((v) => {
      const d = new Date(v.criado_em)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return iso === hoje
    })
    .reduce((a, v) => a + v.total, 0)
  const fiadoAberto = vendas.filter((v) => v.fiado && !v.pago).reduce((a, v) => a + v.total, 0)
  const itens = produtos.reduce((a, p) => a + p.quantidade, 0)

  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛒 Controle de Estoque</h1>
        <button className="btn btn-g btn-p" onClick={() => getSupabase().auth.signOut()}>Sair</button>
      </div>

      <div className="card mt-3 grid grid-cols-3 gap-2 text-center">
        <div><b className="block break-words text-base sm:text-xl">{itens}</b><span className="text-sm text-gray-700">Itens em estoque</span></div>
        <div><b className="block break-words text-base sm:text-xl">{R(vendasHoje)}</b><span className="text-sm text-gray-700">Vendas de hoje</span></div>
        <div><b className="block break-words text-base sm:text-xl">{R(fiadoAberto)}</b><span className="text-sm text-gray-700">Fiado em aberto</span></div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={aba === a.id ? 'btn px-1' : 'btn btn-g px-1'}>
            {a.nome}
          </button>
        ))}
      </div>

      {erro && <div className="erro">{erro}</div>}

      {aba === 'estoque' && <Estoque produtos={produtos} onChange={carregar} />}
      {aba === 'vender' && <Vender produtos={produtos} vendas={vendas} onChange={carregar} />}
      {aba === 'fiado' && <Fiado vendas={vendas} onChange={carregar} />}
      {aba === 'historico' && <Historico vendas={vendas} />}
    </main>
  )
}
