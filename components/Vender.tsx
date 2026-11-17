'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, num, type Produto, type Venda } from '@/lib/tipos'

type ItemCarrinho = { produto_id: string; nome: string; quantidade: number; preco: number }

export default function Vender({ produtos, vendas, onChange }: { produtos: Produto[]; vendas: Venda[]; onChange: () => void }) {
  const [produtoId, setProdutoId] = useState('')
  const [qtd, setQtd] = useState('1')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [fiado, setFiado] = useState(false)
  const [cliente, setCliente] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const escolhido = produtos.find((p) => p.id === (produtoId || produtos[0]?.id))
  const total = carrinho.reduce((a, i) => a + i.preco * i.quantidade, 0)
  const clientes = Array.from(new Set(vendas.filter((v) => v.fiado && v.cliente).map((v) => v.cliente as string)))

  function adicionar() {
    setOk('')
    const q = Math.floor(num(qtd))
    if (!escolhido || q < 1) return setErro('Escolha o produto e a quantidade.')
    const ja = carrinho.find((i) => i.produto_id === escolhido.id)
    const soma = q + (ja?.quantidade ?? 0)
    if (soma > escolhido.quantidade)
      return setErro(`Só tem ${escolhido.quantidade} unidade(s) de ${escolhido.nome} em estoque.`)
    setErro('')
    setCarrinho(
      ja
        ? carrinho.map((i) => (i.produto_id === escolhido.id ? { ...i, quantidade: soma } : i))
        : [...carrinho, { produto_id: escolhido.id, nome: escolhido.nome, quantidade: q, preco: escolhido.preco_venda }]
    )
    setQtd('1')
  }

  async function finalizar() {
    setOk('')
    if (carrinho.length === 0) return setErro('Adicione pelo menos um produto.')
    if (fiado && !cliente.trim()) return setErro('Digite o nome do cliente do fiado.')
    setErro('')
    setEnviando(true)
    const { error } = await getSupabase().rpc('registrar_venda', {
      p_itens: carrinho.map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
      p_fiado: fiado,
      p_cliente: fiado ? cliente.trim() : null,
    })
    setEnviando(false)
    if (error) return setErro(error.message)
    setOk(fiado ? `Fiado anotado para ${cliente.trim()}.` : 'Venda registrada!')
    setCarrinho([])
    setCliente('')
    setFiado(false)
    onChange()
  }

  return (
    <section className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="card">
        <b>Adicionar produto à venda</b>
        <label className="rotulo">Produto</label>
        <select className="campo" value={escolhido?.id ?? ''} onChange={(e) => setProdutoId(e.target.value)}>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome} ({p.quantidade} un.) · {R(p.preco_venda)}</option>
          ))}
        </select>
        <label className="rotulo">Quantidade</label>
        <input className="campo" inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value)} />
        <button className="btn mt-3" onClick={adicionar} disabled={produtos.length === 0}>+ Adicionar</button>
      </div>

      <div className="card">
        <b>Carrinho</b>
        {carrinho.length === 0 && <p className="py-3 text-center text-gray-700">Nenhum produto adicionado.</p>}
        {carrinho.map((i) => (
          <div key={i.produto_id} className="mt-2 flex items-center justify-between gap-2">
            <div><b>{i.nome}</b><div className="text-sm text-gray-700">{i.quantidade} × {R(i.preco)}</div></div>
            <div className="flex items-center gap-2">
              <b>{R(i.preco * i.quantidade)}</b>
              <button className="btn btn-g btn-p" aria-label={`Tirar ${i.nome}`}
                onClick={() => setCarrinho(carrinho.filter((x) => x.produto_id !== i.produto_id))}>✕</button>
            </div>
          </div>
        ))}
        <hr className="my-3 border-gray-400" />
        <div className="flex justify-between text-xl"><span>Total</span><b>{R(total)}</b></div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className={!fiado ? 'btn' : 'btn btn-g'} onClick={() => setFiado(false)}>💵 Pago agora</button>
          <button className={fiado ? 'btn' : 'btn btn-g'} onClick={() => setFiado(true)}>📒 Fiado</button>
        </div>
        {fiado && (
          <>
            <label className="rotulo">Nome do cliente</label>
            <input className="campo" list="clientes" value={cliente} onChange={(e) => setCliente(e.target.value)}
              placeholder="Ex.: Dona Maria, bloco B" />
            <datalist id="clientes">{clientes.map((c) => <option key={c} value={c} />)}</datalist>
          </>
        )}
        {erro && <div className="erro">{erro}</div>}
        {ok && <p className="mt-3 font-bold text-green-800">{ok}</p>}
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={finalizar} disabled={enviando}>{enviando ? 'Registrando…' : 'Finalizar venda'}</button>
          <button className="btn btn-g" onClick={() => { setCarrinho([]); setErro(''); setOk('') }}>Limpar</button>
        </div>
      </div>
    </section>
  )
}
