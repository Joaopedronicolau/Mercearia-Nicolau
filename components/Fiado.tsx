'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, resumoItens, type Venda } from '@/lib/tipos'

export default function Fiado({ vendas, onChange }: { vendas: Venda[]; onChange: () => void }) {
  const [erro, setErro] = useState('')
  const abertas = vendas.filter((v) => v.fiado && !v.pago)
  const porCliente = new Map<string, Venda[]>()
  abertas.forEach((v) => {
    const c = v.cliente || 'Sem nome'
    porCliente.set(c, [...(porCliente.get(c) ?? []), v])
  })

  async function pagar(ids: string[], confirmar?: string) {
    if (confirmar && !confirm(confirmar)) return
    const { error } = await getSupabase().from('vendas').update({ pago: true }).in('id', ids)
    if (error) return setErro('Não consegui atualizar: ' + error.message)
    setErro('')
    onChange()
  }

  if (porCliente.size === 0) return <p className="py-6 text-center text-gray-700">Ninguém devendo. 🎉</p>

  return (
    <section className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6">
      {erro && <div className="erro lg:col-span-2">{erro}</div>}
      {Array.from(porCliente.entries()).map(([cliente, lista]) => (
        <div key={cliente} className="card">
          <div className="flex justify-between"><b>{cliente}</b><b>{R(lista.reduce((a, v) => a + v.total, 0))}</b></div>
          {lista.map((v) => (
            <div key={v.id} className="mt-3 flex items-center justify-between gap-2">
              <div className="text-sm text-gray-700">
                {new Date(v.criado_em).toLocaleDateString('pt-BR')} · {resumoItens(v)}<br />{R(v.total)}
              </div>
              <button className="btn btn-g btn-p" onClick={() => pagar([v.id])}>Pago</button>
            </div>
          ))}
          <button className="btn btn-p mt-3"
            onClick={() => pagar(lista.map((v) => v.id), `Marcar tudo de ${cliente} como pago?`)}>
            Quitar tudo de {cliente}
          </button>
        </div>
      ))}
    </section>
  )
}
