'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { R, num, dataBR, diasParaVencer, CATEGORIAS_PADRAO, type Produto } from '@/lib/tipos'

type Form = { nome: string; quantidade: string; minimo: string; custo: string; venda: string; validade: string; categoria: string }
const VAZIO: Form = { nome: '', quantidade: '', minimo: '3', custo: '', venda: '', validade: '', categoria: 'Outros' }

export default function Estoque({ produtos, onChange }: { produtos: Produto[]; onChange: () => void }) {
  const [form, setForm] = useState<Form>(VAZIO)
  const [editId, setEditId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const [erro, setErro] = useState('')

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function salvar() {
    if (!form.nome.trim()) return setErro('Digite o nome do produto.')
    setErro('')
    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || 'Outros',
      quantidade: Math.max(0, Math.floor(num(form.quantidade))),
      estoque_minimo: Math.max(0, Math.floor(num(form.minimo))),
      preco_custo: num(form.custo),
      preco_venda: num(form.venda),
      validade: form.validade || null,
    }
    const sb = getSupabase()
    const { error } = editId
      ? await sb.from('produtos').update(dados).eq('id', editId)
      : await sb.from('produtos').insert(dados)
    if (error) return setErro('Não consegui salvar: ' + error.message)
    setForm(VAZIO)
    setEditId(null)
    onChange()
  }

  function editar(p: Produto) {
    setEditId(p.id)
    setForm({
      nome: p.nome, quantidade: String(p.quantidade), minimo: String(p.estoque_minimo),
      custo: String(p.preco_custo), venda: String(p.preco_venda), validade: p.validade ?? '', categoria: p.categoria ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function entrada(p: Produto) {
    const n = Math.floor(num(prompt('Quantas unidades entraram?', '1') ?? '0'))
    if (n < 1) return
    const { error } = await getSupabase().from('produtos').update({ quantidade: p.quantidade + n }).eq('id', p.id)
    if (error) return setErro('Não consegui atualizar: ' + error.message)
    onChange()
  }

  async function excluir(p: Produto) {
    if (!confirm(`Excluir ${p.nome}?`)) return
    const { error } = await getSupabase().from('produtos').delete().eq('id', p.id)
    if (error) return setErro('Não consegui excluir: ' + error.message)
    onChange()
  }

  const usadas = Array.from(new Set(produtos.map((p) => p.categoria))).sort()
  const sugestoes = [...CATEGORIAS_PADRAO, ...usadas.filter((c) => !CATEGORIAS_PADRAO.includes(c))]
  const lista = produtos.filter(
    (p) => p.nome.toLowerCase().includes(busca.toLowerCase()) && (filtro === 'Todas' || p.categoria === filtro)
  )

  return (
    <section className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-6">
      <div className="card lg:sticky lg:top-4">
        <b>{editId ? 'Editando produto' : 'Novo produto'}</b>
        <label className="rotulo">Nome</label>
        <input className="campo" value={form.nome} onChange={set('nome')} placeholder="Ex.: Arroz 5kg" />
        <div className="grid grid-cols-2 gap-x-3">
          <div><label className="rotulo">Quantidade</label>
            <input className="campo" inputMode="numeric" value={form.quantidade} onChange={set('quantidade')} /></div>
          <div><label className="rotulo">Avisar quando restar</label>
            <input className="campo" inputMode="numeric" value={form.minimo} onChange={set('minimo')} /></div>
          <div><label className="rotulo">Preço de custo (R$)</label>
            <input className="campo" inputMode="decimal" value={form.custo} onChange={set('custo')} /></div>
          <div><label className="rotulo">Preço de venda (R$)</label>
            <input className="campo" inputMode="decimal" value={form.venda} onChange={set('venda')} /></div>
        </div>
        <label className="rotulo">Categoria</label>
        <select className="campo" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          {sugestoes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="rotulo">Validade (opcional)</label>
        <input className="campo" type="date" value={form.validade} onChange={set('validade')} />
        {erro && <div className="erro">{erro}</div>}
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={salvar}>Salvar produto</button>
          {editId && <button className="btn btn-g" onClick={() => { setEditId(null); setForm(VAZIO) }}>Cancelar</button>}
        </div>
      </div>

      <div>
      <input className="campo mb-3" placeholder="🔍 Buscar produto" value={busca} onChange={(e) => setBusca(e.target.value)} />
      {usadas.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {['Todas', ...usadas].map((c) => (
            <button key={c} className={filtro === c ? 'btn btn-p' : 'btn btn-g btn-p'} onClick={() => setFiltro(c)}>{c}</button>
          ))}
        </div>
      )}

      {lista.length === 0 && <p className="py-6 text-center text-gray-700">Nenhum produto ainda. Cadastre o primeiro acima.</p>}

      {lista.map((p) => {
        const dias = diasParaVencer(p.validade)
        return (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <b>{p.nome}</b>{' '}
                {p.quantidade <= p.estoque_minimo && <span className="tag-vermelha">estoque baixo</span>}{' '}
                {dias !== null && dias < 0 && <span className="tag-vermelha">VENCIDO</span>}
                {dias !== null && dias >= 0 && dias <= 7 && (
                  <span className="tag-amarela">vence em {dias} {dias === 1 ? 'dia' : 'dias'}</span>
                )}
                <div className="text-sm text-gray-700">
                  {p.categoria} · Custo {R(p.preco_custo)} · Venda {R(p.preco_venda)}
                  {p.validade && ` · Validade ${dataBR(p.validade)}`}
                </div>
              </div>
              <div className="text-2xl font-bold">{p.quantidade}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-g btn-p" onClick={() => entrada(p)}>+ Entrada</button>
              <button className="btn btn-g btn-p" onClick={() => editar(p)}>Editar</button>
              <button className="btn btn-g btn-p" onClick={() => excluir(p)}>Excluir</button>
            </div>
          </div>
        )
      })}
      </div>
    </section>
  )
}
