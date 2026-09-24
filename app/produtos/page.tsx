'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

type Produto = {
  id: number
  nome: string
  preco: number
  estoque: number
  ativo: boolean
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [busca, setBusca] = useState('')

  const [editandoId, setEditandoId] =
    useState<number | null>(null)

  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [estoqueInicial, setEstoqueInicial] =
    useState('')

  const [filtro, setFiltro] =
    useState<'ativos' | 'todos' | 'inativos'>('ativos')

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function carregarProdutos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco, estoque, ativo')
      .order('nome')

    if (error) {
      console.error(error)
      setMensagem(
        'Não foi possível carregar os produtos.'
      )
      setCarregando(false)
      return
    }

    setProdutos(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  function limparFormulario() {
    setEditandoId(null)
    setNome('')
    setPreco('')
    setEstoqueInicial('')
  }

  function editarProduto(produto: Produto) {
    setEditandoId(produto.id)
    setNome(produto.nome)
    setPreco(String(produto.preco))
    setEstoqueInicial('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function salvarProduto(event: FormEvent) {
    event.preventDefault()

    setMensagem('')

    const nomeLimpo = nome.trim()
    const precoNumero = Number(preco)

    if (!nomeLimpo) {
      setMensagem('Digite o nome do produto.')
      return
    }

    if (
      !preco ||
      Number.isNaN(precoNumero) ||
      precoNumero < 0
    ) {
      setMensagem('Digite um preço válido.')
      return
    }

    setSalvando(true)

    if (editandoId !== null) {
      const { error } = await supabase
        .from('produtos')
        .update({
          nome: nomeLimpo,
          preco: precoNumero,
        })
        .eq('id', editandoId)

      if (error) {
        console.error(error)
        setMensagem(
          'Não foi possível atualizar o produto.'
        )
        setSalvando(false)
        return
      }

      setMensagem(
        'Produto atualizado com sucesso! ✓'
      )
    } else {
      const estoqueNumero =
        estoqueInicial === ''
          ? 0
          : Number(estoqueInicial)

      if (
        Number.isNaN(estoqueNumero) ||
        !Number.isInteger(estoqueNumero) ||
        estoqueNumero < 0
      ) {
        setMensagem(
          'O estoque inicial deve ser um número inteiro maior ou igual a zero.'
        )
        setSalvando(false)
        return
      }

      const { data: novoProduto, error } =
        await supabase
          .from('produtos')
          .insert({
            nome: nomeLimpo,
            preco: precoNumero,
            estoque: 0,
            ativo: true,
          })
          .select('id')
          .single()

      if (error || !novoProduto) {
        console.error(error)

        setMensagem(
          'Não foi possível cadastrar o produto.'
        )

        setSalvando(false)
        return
      }

      if (estoqueNumero > 0) {
        const { error: erroEstoque } =
          await supabase.rpc(
            'registrar_entrada',
            {
              p_produto_id: novoProduto.id,
              p_quantidade: estoqueNumero,
              p_motivo: 'Estoque inicial',
            }
          )

        if (erroEstoque) {
          console.error(erroEstoque)

          setMensagem(
            'Produto criado, mas não foi possível registrar o estoque inicial.'
          )

          await carregarProdutos()
          limparFormulario()
          setSalvando(false)

          return
        }
      }

      setMensagem(
        'Produto cadastrado com sucesso! ✓'
      )
    }

    limparFormulario()

    await carregarProdutos()

    setSalvando(false)
  }

  async function alterarStatus(produto: Produto) {
    const novoStatus = !produto.ativo

    const { error } = await supabase
      .from('produtos')
      .update({
        ativo: novoStatus,
      })
      .eq('id', produto.id)

    if (error) {
      console.error(error)

      setMensagem(
        'Não foi possível alterar o status do produto.'
      )

      return
    }

    setMensagem(
      novoStatus
        ? 'Produto ativado com sucesso! ✓'
        : 'Produto desativado com sucesso.'
    )

    await carregarProdutos()
  }

  const produtosFiltrados = produtos.filter(
    (produto) => {
      const correspondeBusca =
        produto.nome
          .toLowerCase()
          .includes(busca.toLowerCase())

      const correspondeFiltro =
        filtro === 'todos' ||
        (filtro === 'ativos' && produto.ativo) ||
        (filtro === 'inativos' && !produto.ativo)

      return (
        correspondeBusca && correspondeFiltro
      )
    }
  )

  return (
    <main>
      <Navigation />

      <div className="page-container">

        {/* CABEÇALHO */}
        <section>
          <p
            style={{
              margin: 0,
              color: 'var(--azul)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🏪 Mercearia Nicolau
          </p>

          <h1 className="page-title">
            Produtos
          </h1>

          <p className="page-subtitle">
            Cadastre, edite e controle os produtos
            da mercearia.
          </p>
        </section>

        {/* FORMULÁRIO */}
        <section className="card product-form-card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 15,
              marginBottom: 20,
            }}
          >
            <div>
              <h2 className="section-title">
                {editandoId !== null
                  ? 'Editar produto'
                  : 'Novo produto'}
              </h2>

              {editandoId !== null && (
                <p
                  style={{
                    margin: '-10px 0 0',
                    color: 'var(--texto-suave)',
                    fontSize: 13,
                  }}
                >
                  O estoque atual não é alterado
                  aqui. Use o controle de estoque.
                </p>
              )}
            </div>

            {editandoId !== null && (
              <button
                type="button"
                className="button button-secondary"
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={salvarProduto}>

            <div className="product-form-grid">

              <div className="input-group">
                <label className="input-label">
                  Nome do produto
                </label>

                <input
                  className="input"
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  placeholder="Ex.: Arroz 5kg"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Preço
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(event) =>
                    setPreco(event.target.value)
                  }
                  placeholder="0,00"
                  required
                />
              </div>

              {editandoId === null && (
                <div className="input-group">
                  <label className="input-label">
                    Estoque inicial
                  </label>

                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={estoqueInicial}
                    onChange={(event) =>
                      setEstoqueInicial(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 30"
                  />
                </div>
              )}

            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : editandoId !== null
                ? 'Salvar alterações'
                : 'Cadastrar produto'}
            </button>

          </form>

          {mensagem && (
            <div className="message">
              {mensagem}
            </div>
          )}

        </section>

        {/* PRODUTOS CADASTRADOS */}
        <section style={{ marginTop: 35 }}>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 15,
              flexWrap: 'wrap',
            }}
          >

            <div>
              <h2 className="section-title">
                Produtos cadastrados
              </h2>
            </div>

            <div className="product-filters">

              <button
                type="button"
                className={
                  filtro === 'ativos'
                    ? 'button button-primary'
                    : 'button button-secondary'
                }
                onClick={() =>
                  setFiltro('ativos')
                }
              >
                Ativos
              </button>

              <button
                type="button"
                className={
                  filtro === 'todos'
                    ? 'button button-primary'
                    : 'button button-secondary'
                }
                onClick={() =>
                  setFiltro('todos')
                }
              >
                Todos
              </button>

              <button
                type="button"
                className={
                  filtro === 'inativos'
                    ? 'button button-primary'
                    : 'button button-secondary'
                }
                onClick={() =>
                  setFiltro('inativos')
                }
              >
                Inativos
              </button>

            </div>

          </div>

          {/* BUSCA */}
          <div className="input-group">
            <input
              className="input"
              type="search"
              value={busca}
              onChange={(event) =>
                setBusca(event.target.value)
              }
              placeholder="🔎 Buscar produto..."
            />
          </div>

          {/* CARREGANDO */}
          {carregando ? (
            <p>Carregando produtos...</p>

          ) : produtosFiltrados.length === 0 ? (

            <div className="card">
              <p
                style={{
                  margin: 0,
                  color: 'var(--texto-suave)',
                }}
              >
                Nenhum produto encontrado.
              </p>
            </div>

          ) : (

            <div className="product-management-grid">

              {produtosFiltrados.map((produto) => (

                <div
                  key={produto.id}
                  className="product-management-card"
                >

                  <div className="product-management-top">

                    <div>

                      <h3 className="product-management-name">
                        {produto.nome}
                      </h3>

                      <p className="product-management-price">
                        R${' '}
                        {Number(produto.preco)
                          .toFixed(2)
                          .replace('.', ',')}
                      </p>

                    </div>

                    <span
                      className={
                        produto.ativo
                          ? 'status-badge status-active'
                          : 'status-badge status-inactive'
                      }
                    >
                      {produto.ativo
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>

                  </div>

                  <div className="product-management-stock">

                    <span>
                      Estoque atual
                    </span>

                    <strong>
                      {produto.estoque} un.
                    </strong>

                  </div>

                  <div className="product-management-actions">

                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() =>
                        editarProduto(produto)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        produto.ativo
                          ? 'button button-danger'
                          : 'button button-success'
                      }
                      onClick={() =>
                        alterarStatus(produto)
                      }
                    >
                      {produto.ativo
                        ? 'Desativar'
                        : 'Ativar'}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  )
}