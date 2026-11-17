import { R, resumoItens, type Venda } from '@/lib/tipos'

export default function Historico({ vendas }: { vendas: Venda[] }) {
  if (vendas.length === 0) return <p className="py-6 text-center text-gray-700">Nenhuma venda registrada.</p>
  return (
    <section className="lg:grid lg:grid-cols-2 lg:gap-x-6">
      {vendas.slice(0, 100).map((v) => (
        <div key={v.id} className="card flex items-center justify-between gap-3">
          <div>
            <b>{resumoItens(v)}</b>{' '}
            {v.fiado && (v.pago
              ? <span className="tag-amarela">fiado pago</span>
              : <span className="tag-vermelha">fiado: {v.cliente}</span>)}
            <div className="text-sm text-gray-700">{new Date(v.criado_em).toLocaleString('pt-BR')}</div>
          </div>
          <b>{R(v.total)}</b>
        </div>
      ))}
    </section>
  )
}
