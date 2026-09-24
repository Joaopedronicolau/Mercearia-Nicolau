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

type ItemCarrinho = {
  produto_id: number
  nome: string
  preco: number
  quantidade: number
}

export default function VendasPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [busca, setBusca] = useState('')

  const [formaPagamento, setFormaPagamento] =
    useState('')

  const [valorRecebido, setValorRecebido] =
    useState('')

  const [finalizando, setFinalizando] =
    useState(false)

  const [carregando, setCarregando] =
    useState(true)

  const [mensagem, setMensagem] =
    useState('')

  async function carregarProdutos() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco, estoque')
      .eq('ativo', true)
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

  function adicionarProduto(produto: Produto) {
    setMensagem('')

    if (produto.estoque <= 0) {
      setMensagem(
        `${produto.nome} está sem estoque.`
      )
      return
    }

    const itemExistente = carrinho.find(
      (item) =>
        item.produto_id === produto.id
    )

    if (itemExistente) {
      if (
        itemExistente.quantidade >=
        produto.estoque
      ) {
        setMensagem(
          `Não há mais ${produto.nome} disponível no estoque.`
        )
        return
      }

      setCarrinho(
        carrinho.map((item) =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade:
                  item.quantidade + 1,
              }
            : item
        )
      )

      return
    }

    setCarrinho([
      ...carrinho,
      {
        produto_id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco),
        quantidade: 1,
      },
    ])
  }

  function removerProduto(produtoId: number) {
    setCarrinho(
      carrinho.filter(
        (item) =>
          item.produto_id !== produtoId
      )
    )
  }

  function aumentarQuantidade(
    produtoId: number
  ) {
    const produto = produtos.find(
      (item) => item.id === produtoId
    )

    const item = carrinho.find(
      (item) =>
        item.produto_id === produtoId
    )

    if (!produto || !item) return

    if (item.quantidade >= produto.estoque) {
      setMensagem(
        `Estoque insuficiente para ${produto.nome}.`
      )
      return
    }

    setCarrinho(
      carrinho.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              quantidade:
                item.quantidade + 1,
            }
          : item
      )
    )
  }

  function diminuirQuantidade(
    produtoId: number
  ) {
    const item = carrinho.find(
      (item) =>
        item.produto_id === produtoId
    )

    if (!item) return

    if (item.quantidade <= 1) {
      removerProduto(produtoId)
      return
    }

    setCarrinho(
      carrinho.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              quantidade:
                item.quantidade - 1,
            }
          : item
      )
    )
  }

  function calcularTotal() {
    return carrinho.reduce(
      (total, item) =>
        total +
        item.preco * item.quantidade,
      0
    )
  }

  function formatarPreco(valor: number) {
    return `R$ ${valor
      .toFixed(2)
      .replace('.', ',')}`
  }

  async function finalizarVenda() {
    setMensagem('')

    if (carrinho.length === 0) {
      setMensagem(
        'Adicione pelo menos um produto à venda.'
      )
      return
    }

    if (!formaPagamento) {
      setMensagem(
        'Selecione a forma de pagamento.'
      )
      return
    }

    const total = calcularTotal()

    let recebido: number | null = null
    let troco: number | null = null

    if (formaPagamento === 'Dinheiro') {
      recebido = Number(valorRecebido)

      if (
        !valorRecebido ||
        Number.isNaN(recebido) ||
        recebido < total
      ) {
        setMensagem(
          'O valor recebido é insuficiente.'
        )
        return
      }

      troco = recebido - total
    }

    setFinalizando(true)

    try {
      const { data: venda, error: erroVenda } =
        await supabase
          .from('vendas')
          .insert({
            total,
            forma_pagamento:
              formaPagamento,
            valor_recebido: recebido,
            troco,
          })
          .select('id')
          .single()

      if (erroVenda || !venda) {
        console.error(erroVenda)

        setMensagem(
          'Não foi possível registrar a venda.'
        )

        return
      }

      const itens = carrinho.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal:
          item.preco * item.quantidade,
      }))

      const { error: erroItens } =
        await supabase
          .from('itens_venda')
          .insert(itens)

      if (erroItens) {
        console.error(erroItens)

        setMensagem(
          'A venda foi criada, mas não foi possível registrar os itens.'
        )

        return
      }

      for (const item of carrinho) {
        const { error } =
          await supabase.rpc(
            'registrar_movimentacao_venda',
            {
              p_produto_id:
                item.produto_id,
              p_quantidade:
                item.quantidade,
            }
          )

        if (error) {
          console.error(error)

          setMensagem(
            `A venda foi registrada, mas houve um problema ao baixar o estoque de ${item.nome}.`
          )

          return
        }
      }

      setCarrinho([])
      setFormaPagamento('')
      setValorRecebido('')

      setMensagem(
        `Venda finalizada com sucesso! Total: ${formatarPreco(total)} ✓`
      )

      await carregarProdutos()
    } catch (error) {
      console.error(error)

      setMensagem(
        'Ocorreu um erro ao finalizar a venda.'
      )
    } finally {
      setFinalizando(false)
    }
  }

  const produtosFiltrados =
    produtos.filter((produto) =>
      produto.nome
        .toLowerCase()
        .includes(busca.toLowerCase())
    )

  const total = calcularTotal()

  const valorRecebidoNumero =
    Number(valorRecebido) || 0

  const troco =
    formaPagamento === 'Dinheiro' &&
    valorRecebidoNumero >= total
      ? valorRecebidoNumero - total
      : 0

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
            Nova venda
          </h1>

          <p className="page-subtitle">
            Selecione os produtos e finalize a
            compra no caixa.
          </p>
        </section>

        <div className="sales-layout">

          {/* PRODUTOS */}
          <section>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 15,
                marginBottom: 15,
              }}
            >
              <h2 className="section-title">
                Produtos
              </h2>

              <span
                style={{
                  color:
                    'var(--texto-suave)',
                  fontSize: 13,
                }}
              >
                {produtosFiltrados.length}{' '}
                produtos
              </span>
            </div>

            <div className="input-group">

              <input
                className="input"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="🔎 Buscar produto..."
              />

            </div>

            {carregando ? (

              <div className="loading">
                Carregando produtos...
              </div>

            ) : produtosFiltrados.length ===
              0 ? (

              <div className="card">
                <p
                  style={{
                    margin: 0,
                    color:
                      'var(--texto-suave)',
                  }}
                >
                  Nenhum produto encontrado.
                </p>
              </div>

            ) : (

              <div className="sales-products-grid">

                {produtosFiltrados.map(
                  (produto) => (

                    <button
                      key={produto.id}
                      type="button"
                      className="sales-product-card"
                      onClick={() =>
                        adicionarProduto(
                          produto
                        )
                      }
                      disabled={
                        produto.estoque <= 0
                      }
                    >

                      <div className="sales-product-icon">
                        🛒
                      </div>

                      <div
                        className="sales-product-info"
                      >
                        <strong>
                          {produto.nome}
                        </strong>

                        <span>
                          {formatarPreco(
                            Number(
                              produto.preco
                            )
                          )}
                        </span>
                      </div>

                      <div
                        className={
                          produto.estoque <= 0
                            ? 'sales-stock empty'
                            : produto.estoque <= 5
                            ? 'sales-stock low'
                            : 'sales-stock'
                        }
                      >
                        {produto.estoque <= 0
                          ? 'Sem estoque'
                          : `${produto.estoque} un.`}
                      </div>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

          {/* CARRINHO */}
          <section className="sales-cart">

            <div className="sales-cart-header">

              <div>
                <h2 className="section-title">
                  Carrinho
                </h2>

                <p>
                  {carrinho.length}{' '}
                  {carrinho.length === 1
                    ? 'item'
                    : 'itens'}
                </p>
              </div>

              {carrinho.length > 0 && (
                <button
                  type="button"
                  className="sales-clear-button"
                  onClick={() =>
                    setCarrinho([])
                  }
                >
                  Limpar
                </button>
              )}

            </div>

            {carrinho.length === 0 ? (

              <div className="sales-empty-cart">

                <div className="sales-empty-icon">
                  🛒
                </div>

                <strong>
                  Carrinho vazio
                </strong>

                <p>
                  Clique nos produtos ao lado
                  para adicioná-los à venda.
                </p>

              </div>

            ) : (

              <div className="sales-cart-items">

                {carrinho.map((item) => (

                  <div
                    key={item.produto_id}
                    className="sales-cart-item"
                  >

                    <div
                      className="sales-cart-item-info"
                    >

                      <strong>
                        {item.nome}
                      </strong>

                      <span>
                        {formatarPreco(
                          item.preco
                        )}{' '}
                        cada
                      </span>

                    </div>

                    <div
                      className="sales-cart-controls"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          diminuirQuantidade(
                            item.produto_id
                          )
                        }
                      >
                        −
                      </button>

                      <strong>
                        {item.quantidade}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          aumentarQuantidade(
                            item.produto_id
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <strong className="sales-cart-subtotal">
                      {formatarPreco(
                        item.preco *
                          item.quantidade
                      )}
                    </strong>

                  </div>

                ))}

              </div>

            )}

            {/* TOTAL */}
            <div className="sales-total">

              <span>
                Total
              </span>

              <strong>
                {formatarPreco(total)}
              </strong>

            </div>

            {/* PAGAMENTO */}
            <div className="sales-payment">

              <h3>
                Forma de pagamento
              </h3>

              <div className="payment-grid">

                {[
                  'PIX',
                  'Cartão',
                  'Dinheiro',
                ].map((forma) => (

                  <button
                    key={forma}
                    type="button"
                    className={
                      formaPagamento === forma
                        ? 'payment-button selected'
                        : 'payment-button'
                    }
                    onClick={() => {
                      setFormaPagamento(
                        forma
                      )

                      if (
                        forma !==
                        'Dinheiro'
                      ) {
                        setValorRecebido(
                          ''
                        )
                      }
                    }}
                  >
                    {forma === 'PIX'
                      ? '📱'
                      : forma ===
                        'Cartão'
                      ? '💳'
                      : '💵'}{' '}
                    {forma}
                  </button>

                ))}

              </div>

              {/* DINHEIRO */}
              {formaPagamento ===
                'Dinheiro' && (
                <div
                  className="cash-payment"
                >

                  <div className="input-group">

                    <label className="input-label">
                      Valor recebido
                    </label>

                    <input
                      className="input"
                      type="number"
                      min={total}
                      step="0.01"
                      value={
                        valorRecebido
                      }
                      onChange={(event) =>
                        setValorRecebido(
                          event.target.value
                        )
                      }
                      placeholder="R$ 0,00"
                    />

                  </div>

                  <div className="change-box">

                    <span>
                      Troco
                    </span>

                    <strong>
                      {formatarPreco(
                        troco
                      )}
                    </strong>

                  </div>

                </div>
              )}

            </div>

            {/* MENSAGEM */}
            {mensagem && (
              <div className="message">
                {mensagem}
              </div>
            )}

            {/* FINALIZAR */}
            <button
              type="button"
              className="button button-primary sales-finalize-button"
              onClick={finalizarVenda}
              disabled={
                finalizando ||
                carrinho.length === 0
              }
            >
              {finalizando
                ? 'Finalizando venda...'
                : '✓ Finalizar venda'}
            </button>

          </section>

        </div>

      </div>
    </main>
  )
}