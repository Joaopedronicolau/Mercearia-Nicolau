'use client'

import { useEffect, useState } from 'react'
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
  produtos: {
    nome: string
  }[] | null
}

export default function EstoquePage() {
  const [produtos, setProdutos] =
    useState<Produto[]>([])

  const [movimentacoes, setMovimentacoes] =
    useState<Movimentacao[]>([])

  const [
    produtoSelecionado,
    setProdutoSelecionado,
  ] = useState('')

  const [quantidade, setQuantidade] =
    useState('')

  const [motivo, setMotivo] =
    useState('')

  const [
    tipoMovimentacao,
    setTipoMovimentacao,
  ] = useState<
    'entrada' | 'perda'
  >('entrada')

  const [filtroProduto, setFiltroProduto] =
    useState('')

  const [carregando, setCarregando] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [mensagem, setMensagem] =
    useState('')

  async function carregarDados() {
    const {
      data: produtosData,
      error: produtosError,
    } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (produtosError) {
      console.error(produtosError)
      setMensagem(
        'Erro ao carregar produtos.'
      )
      setCarregando(false)
      return
    }

    const {
      data: movimentacoesData,
      error: movimentacoesError,
    } = await supabase
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
      })

    if (movimentacoesError) {
      console.error(
        movimentacoesError
      )
      setMensagem(
        'Erro ao carregar movimentações.'
      )
      setCarregando(false)
      return
    }

    setProdutos(produtosData || [])

    setMovimentacoes(
      (movimentacoesData as Movimentacao[]) ||
        []
    )

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function registrarMovimentacao() {
    setMensagem('')

    if (!produtoSelecionado) {
      setMensagem(
        'Selecione um produto.'
      )
      return
    }

    const quantidadeNumerica =
      Number(quantidade)

    if (
      !quantidadeNumerica ||
      quantidadeNumerica <= 0
    ) {
      setMensagem(
        'Digite uma quantidade válida.'
      )
      return
    }

    if (!motivo.trim()) {
      setMensagem(
        'Informe o motivo.'
      )
      return
    }

    setSalvando(true)

    let error

    if (
      tipoMovimentacao === 'entrada'
    ) {
      const resultado =
        await supabase.rpc(
          'registrar_entrada',
          {
            p_produto_id:
              Number(
                produtoSelecionado
              ),
            p_quantidade:
              quantidadeNumerica,
            p_motivo: motivo,
          }
        )

      error = resultado.error
    } else {
      const resultado =
        await supabase.rpc(
          'registrar_perda',
          {
            p_produto_id:
              Number(
                produtoSelecionado
              ),
            p_quantidade:
              quantidadeNumerica,
            p_motivo: motivo,
          }
        )

      error = resultado.error
    }

    if (error) {
      console.error(error)
      setMensagem(error.message)
      setSalvando(false)
      return
    }

    setMensagem(
      tipoMovimentacao === 'entrada'
        ? 'Entrada registrada com sucesso! 📦'
        : 'Perda registrada com sucesso! ❌'
    )

    setProdutoSelecionado('')
    setQuantidade('')
    setMotivo('')

    await carregarDados()

    setSalvando(false)
  }

  const movimentacoesFiltradas =
    movimentacoes.filter(
      (movimentacao) => {
        if (!filtroProduto) {
          return true
        }

        return (
          movimentacao.produto_id ===
          Number(filtroProduto)
        )
      }
    )

  if (carregando) {
    return (
      <main>
        <Navigation />

        <div className="page-container">
          <p>Carregando estoque...</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Navigation />

      <div className="page-container">
        <section>
          <p
            style={{
              margin: 0,
              color: 'var(--roxo)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            📦 Controle da loja
          </p>

          <h1 className="page-title">
            Estoque
          </h1>

          <p className="page-subtitle">
            Controle entradas, perdas e quantidade
            disponível.
          </p>
        </section>

        <section
          className="card"
          style={{ marginTop: 28 }}
        >
          <h2 className="section-title">
            Estoque atual
          </h2>

          {produtos.length === 0 ? (
            <p>
              Nenhum produto cadastrado.
            </p>
          ) : (
            <div className="stock-list">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="stock-item"
                >
                  <div>
                    <strong>
                      {produto.nome}
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        color:
                          'var(--texto-suave)',
                        fontSize: 13,
                      }}
                    >
                      {`R$ ${Number(
                        produto.preco
                      )
                        .toFixed(2)
                        .replace('.', ',')}`}
                    </div>
                  </div>

                  <div className="stock-quantity">
                    {produto.estoque} un.
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className="card"
          style={{ marginTop: 18 }}
        >
          <h2 className="section-title">
            Movimentar estoque
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, 1fr)',
              gap: 8,
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              className={
                tipoMovimentacao ===
                'entrada'
                  ? 'button button-success'
                  : 'button button-secondary'
              }
              onClick={() => {
                setTipoMovimentacao(
                  'entrada'
                )
                setMotivo('')
              }}
            >
              ➕ Entrada
            </button>

            <button
              type="button"
              className={
                tipoMovimentacao ===
                'perda'
                  ? 'button button-danger'
                  : 'button button-secondary'
              }
              onClick={() => {
                setTipoMovimentacao(
                  'perda'
                )
                setMotivo('')
              }}
            >
              ❌ Perda
            </button>
          </div>

          <div className="input-group">
            <label className="input-label">
              Produto
            </label>

            <select
              className="select"
              value={produtoSelecionado}
              onChange={(event) =>
                setProdutoSelecionado(
                  event.target.value
                )
              }
            >
              <option value="">
                Selecione um produto
              </option>

              {produtos.map((produto) => (
                <option
                  key={produto.id}
                  value={produto.id}
                >
                  {produto.nome} —{' '}
                  {produto.estoque}{' '}
                  disponíveis
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              Quantidade
            </label>

            <input
              className="input"
              type="number"
              min="1"
              value={quantidade}
              onChange={(event) =>
                setQuantidade(
                  event.target.value
                )
              }
              placeholder="Ex: 5"
            />
          </div>

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
                tipoMovimentacao ===
                'entrada'
                  ? 'Ex: Produção de doces'
                  : 'Ex: Doces estragados'
              }
            />
          </div>

          <button
            className={
              tipoMovimentacao ===
              'entrada'
                ? 'button button-success'
                : 'button button-danger'
            }
            style={{
              width: '100%',
            }}
            onClick={
              registrarMovimentacao
            }
            disabled={salvando}
          >
            {salvando
              ? 'Registrando...'
              : tipoMovimentacao ===
                  'entrada'
                ? 'Registrar entrada'
                : 'Registrar perda'}
          </button>

          {mensagem && (
            <div className="message">
              {mensagem}
            </div>
          )}
        </section>

        <section
          className="card"
          style={{ marginTop: 18 }}
        >
          <h2 className="section-title">
            Histórico
          </h2>

          <div className="input-group">
            <label className="input-label">
              Filtrar por produto
            </label>

            <select
              className="select"
              value={filtroProduto}
              onChange={(event) =>
                setFiltroProduto(
                  event.target.value
                )
              }
            >
              <option value="">
                Todos os produtos
              </option>

              {produtos.map((produto) => (
                <option
                  key={produto.id}
                  value={produto.id}
                >
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          {movimentacoesFiltradas.length ===
          0 ? (
            <p
              style={{
                color:
                  'var(--texto-suave)',
              }}
            >
              Nenhuma movimentação encontrada.
            </p>
          ) : (
            movimentacoesFiltradas.map(
              (movimentacao) => (
                <div
                  key={movimentacao.id}
                  className="movement"
                >
                  <strong>
                    {movimentacao.produtos?.[0]?.nome}
                  </strong>

                  <p
                    style={{
                      margin:
                        '6px 0',
                      fontSize: 13,
                      color:
                        'var(--texto-suave)',
                    }}
                  >
                    {movimentacao.tipo ===
                    'entrada'
                      ? 'Entrada'
                      : 'Perda'}
                  </p>

                  <p
                    className={
                      movimentacao.quantidade >
                      0
                        ? 'movement-positive'
                        : 'movement-negative'
                    }
                    style={{
                      margin:
                        '4px 0',
                    }}
                  >
                    Quantidade:{' '}
                    {movimentacao.quantidade >
                    0
                      ? `+${movimentacao.quantidade}`
                      : movimentacao.quantidade}
                  </p>

                  <p
                    style={{
                      margin:
                        '5px 0',
                      fontSize: 13,
                    }}
                  >
                    Motivo:{' '}
                    {movimentacao.motivo ||
                      '-'}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color:
                        'var(--texto-suave)',
                    }}
                  >
                    {new Date(
                      movimentacao.criado_em
                    ).toLocaleString(
                      'pt-BR'
                    )}
                  </p>
                </div>
              )
            )
          )}
        </section>
      </div>
    </main>
  )
}