'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

type Produto = {
  id: number
  nome: string
  preco: number
  estoque: number
}

type Movimentacao = {
  id: number
  produto_id: number
  tipo: string
  quantidade: number
  motivo: string | null
  criado_em: string
  produtos: { nome: string }[] | null
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])

  const [produtoId, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')

  const [tipo, setTipo] =
    useState<'entrada' | 'perda'>('entrada')

  const [busca, setBusca] = useState('')

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function carregarDados() {
    setCarregando(true)

    const [
      { data: produtosData, error: produtosError },
      { data: movimentacoesData, error: movimentacoesError },
    ] = await Promise.all([
      supabase
        .from('produtos')
        .select('id, nome, preco, estoque')
        .eq('ativo', true)
        .order('nome'),

      supabase
        .from('movimentacoes_estoque')
        .select(`
          id,
          produto_id,
          tipo,
          quantidade,
          motivo,
          criado_em,
          produtos (
            nome
          )
        `)
        .order('criado_em', {
          ascending: false,
        }),
    ])

    if (produtosError) {
      console.error(produtosError)
      setMensagem(
        'Não foi possível carregar os produtos.'
      )
    }

    if (movimentacoesError) {
      console.error(movimentacoesError)
      setMensagem(
        'Não foi possível carregar o histórico.'
      )
    }

    setProdutos(produtosData || [])
    setMovimentacoes(
      (movimentacoesData as Movimentacao[]) || []
    )

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function registrarMovimentacao(
    event: FormEvent
  ) {
    event.preventDefault()

    setMensagem('')

    if (!produtoId) {
      setMensagem(
        'Selecione um produto.'
      )
      return
    }

    const quantidadeNumero =
      Number(quantidade)

    if (
      !quantidade ||
      Number.isNaN(quantidadeNumero) ||
      !Number.isInteger(quantidadeNumero) ||
      quantidadeNumero <= 0
    ) {
      setMensagem(
        'Digite uma quantidade válida.'
      )
      return
    }

    if (!motivo.trim()) {
      setMensagem(
        'Informe o motivo da movimentação.'
      )
      return
    }

    setSalvando(true)

    const rpc =
      tipo === 'entrada'
        ? 'registrar_entrada'
        : 'registrar_perda'

    const { error } = await supabase.rpc(
      rpc,
      {
        p_produto_id: Number(produtoId),
        p_quantidade: quantidadeNumero,
        p_motivo: motivo.trim(),
      }
    )

    if (error) {
      console.error(error)

      setMensagem(
        error.message ||
          'Não foi possível registrar a movimentação.'
      )

      setSalvando(false)
      return
    }

    setMensagem(
      tipo === 'entrada'
        ? 'Entrada registrada com sucesso! ✓'
        : 'Perda registrada com sucesso.'
    )

    setProdutoId('')
    setQuantidade('')
    setMotivo('')

    await carregarDados()

    setSalvando(false)
  }

  const produtosFiltrados = produtos.filter(
    (produto) =>
      produto.nome
        .toLowerCase()
        .includes(busca.toLowerCase())
  )

  function formatarData(data: string) {
    return new Date(data).toLocaleString(
      'pt-BR',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    )
  }

  function nomeProduto(
    movimentacao: Movimentacao
  ) {
    return (
      movimentacao.produtos?.[0]?.nome ||
      'Produto não encontrado'
    )
  }

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
            Estoque
          </h1>

          <p className="page-subtitle">
            Controle as entradas, perdas e
            quantidades disponíveis.
          </p>
        </section>

        {/* RESUMO DO ESTOQUE */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              📦
            </div>

            <p className="stat-label">
              Produtos ativos
            </p>

            <strong className="stat-value">
              {produtos.length}
            </strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              🧮
            </div>

            <p className="stat-label">
              Unidades em estoque
            </p>

            <strong className="stat-value">
              {produtos.reduce(
                (total, produto) =>
                  total + produto.estoque,
                0
              )}
            </strong>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              📝
            </div>

            <p className="stat-label">
              Movimentações
            </p>

            <strong className="stat-value">
              {movimentacoes.length}
            </strong>
          </div>

        </section>

        {/* REGISTRAR MOVIMENTAÇÃO */}
        <section
          className="card"
          style={{ marginTop: 28 }}
        >

          <h2 className="section-title">
            Registrar movimentação
          </h2>

          <p
            style={{
              marginTop: -10,
              marginBottom: 22,
              color: 'var(--texto-suave)',
              fontSize: 13,
            }}
          >
            Adicione produtos ao estoque ou
            registre uma perda.
          </p>

          {/* TIPO */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 20,
            }}
          >

            <button
              type="button"
              className={
                tipo === 'entrada'
                  ? 'button button-success'
                  : 'button button-secondary'
              }
              onClick={() => {
                setTipo('entrada')
                setMensagem('')
              }}
            >
              📥 Entrada
            </button>

            <button
              type="button"
              className={
                tipo === 'perda'
                  ? 'button button-danger'
                  : 'button button-secondary'
              }
              onClick={() => {
                setTipo('perda')
                setMensagem('')
              }}
            >
              ⚠️ Perda
            </button>

          </div>

          <form onSubmit={registrarMovimentacao}>

            <div className="stock-form-grid">

              {/* PRODUTO */}
              <div className="input-group">

                <label className="input-label">
                  Produto
                </label>

                <select
                  className="select"
                  value={produtoId}
                  onChange={(event) =>
                    setProdutoId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Selecione um produto
                  </option>

                  {produtos.map((produto) => (
                    <option
                      key={produto.id}
                      value={produto.id}
                    >
                      {produto.nome} — estoque:{' '}
                      {produto.estoque}
                    </option>
                  ))}
                </select>

              </div>

              {/* QUANTIDADE */}
              <div className="input-group">

                <label className="input-label">
                  Quantidade
                </label>

                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={quantidade}
                  onChange={(event) =>
                    setQuantidade(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 10"
                  required
                />

              </div>

              {/* MOTIVO */}
              <div className="input-group">

                <label className="input-label">
                  Motivo
                </label>

                <input
                  className="input"
                  type="text"
                  value={motivo}
                  onChange={(event) =>
                    setMotivo(
                      event.target.value
                    )
                  }
                  placeholder={
                    tipo === 'entrada'
                      ? 'Ex.: Compra de fornecedor'
                      : 'Ex.: Produto vencido'
                  }
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className={
                tipo === 'entrada'
                  ? 'button button-success'
                  : 'button button-danger'
              }
              disabled={salvando}
            >
              {salvando
                ? 'Registrando...'
                : tipo === 'entrada'
                ? 'Registrar entrada'
                : 'Registrar perda'}
            </button>

          </form>

          {mensagem && (
            <div className="message">
              {mensagem}
            </div>
          )}

        </section>

        {/* PRODUTOS EM ESTOQUE */}
        <section style={{ marginTop: 35 }}>

          <h2 className="section-title">
            Produtos em estoque
          </h2>

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

          {carregando ? (

            <div className="loading">
              Carregando estoque...
            </div>

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

            <div className="stock-products-grid">

              {produtosFiltrados.map(
                (produto) => (

                  <div
                    key={produto.id}
                    className="stock-product-card"
                  >

                    <div
                      className="stock-product-header"
                    >

                      <div>
                        <h3>
                          {produto.nome}
                        </h3>

                        <p>
                          R${' '}
                          {Number(
                            produto.preco
                          )
                            .toFixed(2)
                            .replace(
                              '.',
                              ','
                            )}
                        </p>
                      </div>

                      <span
                        className={
                          produto.estoque <= 0
                            ? 'stock-badge stock-empty'
                            : produto.estoque <= 5
                            ? 'stock-badge stock-low'
                            : 'stock-badge stock-ok'
                        }
                      >
                        {produto.estoque <= 0
                          ? 'Sem estoque'
                          : produto.estoque <= 5
                          ? 'Estoque baixo'
                          : 'Em estoque'}
                      </span>

                    </div>

                    <div
                      className="stock-product-quantity"
                    >
                      <span>
                        Quantidade disponível
                      </span>

                      <strong>
                        {produto.estoque}
                      </strong>
                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* HISTÓRICO */}
        <section style={{ marginTop: 38 }}>

          <h2 className="section-title">
            Histórico de movimentações
          </h2>

          {carregando ? (

            <div className="loading">
              Carregando histórico...
            </div>

          ) : movimentacoes.length === 0 ? (

            <div className="card">
              <p
                style={{
                  margin: 0,
                  color: 'var(--texto-suave)',
                }}
              >
                Nenhuma movimentação registrada.
              </p>
            </div>

          ) : (

            <div className="movement-list">

              {movimentacoes.map(
                (movimentacao) => {

                  const entrada =
                    movimentacao.tipo ===
                    'entrada'

                  return (
                    <div
                      key={movimentacao.id}
                      className="movement"
                    >

                      <div
                        className="movement-icon"
                      >
                        {entrada
                          ? '📥'
                          : '⚠️'}
                      </div>

                      <div
                        className="movement-info"
                      >

                        <strong>
                          {nomeProduto(
                            movimentacao
                          )}
                        </strong>

                        <span>
                          {entrada
                            ? 'Entrada'
                            : 'Perda'}
                          {' • '}
                          {movimentacao.motivo ||
                            'Sem motivo informado'}
                        </span>

                        <small>
                          {formatarData(
                            movimentacao.criado_em
                          )}
                        </small>

                      </div>

                      <strong
                        className={
                          entrada
                            ? 'movement-positive'
                            : 'movement-negative'
                        }
                      >
                        {entrada ? '+' : '-'}
                        {Math.abs(
                          movimentacao.quantidade
                        )}
                      </strong>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

      </div>
    </main>
  )
}