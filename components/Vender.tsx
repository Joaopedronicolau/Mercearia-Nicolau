'use client'

import { useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, num, type Produto, type Venda } from '@/lib/tipos'
import ScannerButton from './ScannerButton'

type ItemCarrinho = { produto_id: string; nome: string; quantidade: number; preco: number }

// Ignora zeros à esquerda (o leitor às vezes devolve 12 dígitos em vez de 13)
const normaliza = (s: string | null | undefined) => (s ?? '').trim().replace(/^0+/, '')

export default function Vender({ produtos, vendas, onChange }: { produtos: Produto[]; vendas: Venda[]; onChange: () => void }) {
  const [produtoId, setProdutoId] = useState('')
  const [qtd, setQtd] = useState('1')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const carrinhoRef = useRef<ItemCarrinho[]>([])
  const [fiado, setFiado] = useState(false)
  const [cliente, setCliente] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const escolhido = produtos.find((p) => p.id === (produtoId || produtos[0]?.id))
  const grupos = Array.from(new Set(produtos.map((p) => p.categoria))).sort()
  const total = carrinho.reduce((a, i) => a + i.preco * i.quantidade, 0)
  const clientes = Array.from(new Set(vendas.filter((v) => v.fiado && v.cliente).map((v) => v.cliente as string)))

  function guardar(novo: ItemCarrinho[]) {
    carrinhoRef.current = novo
    setCarrinho(novo)
  }

  // Coloca q unidades no carrinho. Devolve uma mensagem de erro, ou null se deu certo.
  function colocar(p: Produto, q: number): string | null {
    const atual = carrinhoRef.current
    const ja = atual.find((i) => i.produto_id === p.id)
    const soma = q + (ja?.quantidade ?? 0)
    if (soma > p.quantidade) return `Só tem ${p.quantidade} unidade(s) de ${p.nome} em estoque.`
    guardar(
      ja
        ? atual.map((i) => (i.produto_id === p.id ? { ...i, quantidade: soma } : i))
        : [...atual, { produto_id: p.id, nome: p.nome, quantidade: q, preco: p.preco_venda }]
    )
    return null
  }

  function adicionar() {
    setOk('')
    const q = Math.floor(num(qtd))
    if (!escolhido || q < 1) return setErro('Escolha o produto e a quantidade.')
    const msg = colocar(escolhido, q)
    if (msg) return setErro(msg)
    setErro('')
    setQtd('1')
  }

  // Chamado a cada código de barras lido: adiciona 1 unidade e avisa na tela da câmera.
  function lerCodigo(codigo: string): string {
    setOk('')
    setErro('')
    const alvo = normaliza(codigo)
    const p = produtos.find((x) => alvo !== '' && normaliza(x.codigo_barras) === alvo)
    if (!p) return `❌ Código ${codigo} não cadastrado.`
    const msg = colocar(p, 1)
    if (msg) return `⚠️ ${msg}`
    const n = carrinhoRef.current.find((i) => i.produto_id === p.id)?.quantidade ?? 1
    return `✔ ${p.nome} (${n} no carrinho)`
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
    guardar([])
    setCliente('')
    setFiado(false)
    onChange()
  }

  return (
    <section className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="card">
        <div className="flex items-center justify-between gap-2">
          <b>Adicionar produto à venda</b>
          <ScannerButton label="📷 Escanear" onCodigo={lerCodigo} />
        </div>
        <label className="rotulo">Produto</label>
        <select className="campo" value={escolhido?.id ?? ''} onChange={(e) => setProdutoId(e.target.value)}>
          {grupos.map((g) => (
            <optgroup key={g} label={g}>
              {produtos.filter((p) => p.categoria === g).map((p) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.quantidade} un.) · {R(p.preco_venda)}</option>
              ))}
            </optgroup>
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
                onClick={() => guardar(carrinho.filter((x) => x.produto_id !== i.produto_id))}>✕</button>
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
          <button className="btn btn-g" onClick={() => { guardar([]); setErro(''); setOk('') }}>Limpar</button>
        </div>
      </div>
    </section>
  )
}
