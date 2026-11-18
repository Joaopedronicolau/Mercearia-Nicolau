'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, resumoItens, type Venda } from '@/lib/tipos'

export default function Historico({ vendas, onChange }: { vendas: Venda[]; onChange: () => void }) {
  const [erro, setErro] = useState('')

  async function desfazer(v: Venda) {
    if (!confirm(`Desfazer a venda de ${R(v.total)}?\n${resumoItens(v)}\n\nOs produtos voltam para o estoque.`)) return
    const { error } = await getSupabase().rpc('cancelar_venda', { p_venda_id: v.id })
    if (error) return setErro('Não consegui desfazer: ' + error.message)
    setErro('')
    onChange()
  }

  if (vendas.length === 0) return <p className="py-6 text-center text-gray-700">Nenhuma venda registrada.</p>

  return (
    <section className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6">
      {erro && <div className="erro lg:col-span-2">{erro}</div>}
      {vendas.slice(0, 100).map((v) => (
        <div key={v.id} className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <b>{resumoItens(v)}</b>{' '}
              {v.fiado && (v.pago
                ? <span className="tag-amarela">fiado pago</span>
                : <span className="tag-vermelha">fiado: {v.cliente}</span>)}
              <div className="text-sm text-gray-700">{new Date(v.criado_em).toLocaleString('pt-BR')}</div>
            </div>
            <b>{R(v.total)}</b>
          </div>
          <button className="btn btn-g btn-p mt-3" onClick={() => desfazer(v)}>Desfazer venda</button>
        </div>
      ))}
    </section>
  )
}
