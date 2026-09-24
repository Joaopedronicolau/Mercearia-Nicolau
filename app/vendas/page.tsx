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

  const [carregando, setCarregando] =
    useState(true)

  const [formaPagamento, setFormaPagamento] =
    useState('')

  const [valorRecebido, setValorRecebido] =
    useState('')

  const [finalizando, setFinalizando] =
    useState(false)

  const [mensagem, setMensagem] =
    useState('')

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      console.error(error)
      setMensagem('Erro ao carregar produtos.')
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

    const itemExistente =
      carrinho.find(
        (item) =>
          item.produto_id === produto.id
      )

    if (
      itemExistente &&
      itemExistente.quantidade >= produto.estoque
    ) {
      return
    }

    if (produto.estoque <= 0) {
      return
    }

    if (itemExistente) {
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
      carrinho
        .map((item) =>
          item.produto_id === produtoId
            ? {
                ...item,
                quantidade:
                  item.quantidade - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantidade > 0
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
        'Adicione pelo menos um produto.'
      )
      return
    }

    if (!formaPagamento) {
      setMensagem(
        'Escolha a forma de pagamento.'
      )
      return
    }

    const total = calcularTotal()

    let valorRecebidoNumerico: number | null =
      null

    let troco = 0

    if (formaPagamento === 'dinheiro') {
      valorRecebidoNumerico =
        Number(valorRecebido)

      if (
        !valorRecebidoNumerico ||
        valorRecebidoNumerico < total
      ) {
        setMensagem(
          'O valor recebido é insuficiente.'
        )
        return
      }

      troco =
        valorRecebidoNumerico - total
    }

    setFinalizando(true)

    const { data: venda, error: erroVenda } =
      await supabase
        .from('vendas')
        .insert({
          total,
          forma_pagamento: formaPagamento,
          valor_recebido:
            valorRecebidoNumerico,
          troco,
        })
        .select()
        .single()

    if (erroVenda) {
      console.error(erroVenda)
      setMensagem(
        'Erro ao registrar a venda.'
      )
      setFinalizando(false)
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
        'A venda foi criada, mas houve erro nos itens.'
      )
      setFinalizando(false)
      return
    }

    for (const item of carrinho) {
      const {
        error: erroEstoque,
      } = await supabase.rpc(
        'registrar_movimentacao_venda',
        {
          p_produto_id:
            item.produto_id,
          p_quantidade:
            item.quantidade,
        }
      )

      if (erroEstoque) {
        console.error(erroEstoque)

        setMensagem(
          `Erro ao baixar o estoque de ${item.nome}.`
        )

        setFinalizando(false)
        return
      }
    }

    setCarrinho([])
    setFormaPagamento('')
    setValorRecebido('')

    setMensagem(
      'Venda realizada com sucesso! 🎉'
    )

    await carregarProdutos()

    setFinalizando(false)
  }

  const total = calcularTotal()

  const troco =
    formaPagamento === 'dinheiro'
      ? Math.max(
          0,
          Number(valorRecebido || 0) -
            total
        )
      : 0

  if (carregando) {
    return (
      <main>
        <Navigation />

        <div className="page-container">
          <p>Carregando produtos...</p>
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
            🛒 Caixa
          </p>

          <h1 className="page-title">
            Nova venda
          </h1>

          <p className="page-subtitle">
            Escolha os doces e finalize o pedido.
          </p>
        </section>

        <div className="sales-layout">
          <section className="card">
            <h2 className="section-title">
              Produtos 🍫
            </h2>

            <div className="products-grid">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="product-card"
                >
                  <div className="product-name">
                    {produto.nome}
                  </div>

                  <div className="product-price">
                    {formatarPreco(
                      Number(produto.preco)
                    )}
                  </div>

                  <div className="product-stock">
                    {produto.estoque > 0
                      ? `${produto.estoque} disponíveis`
                      : 'Sem estoque'}
                  </div>

                  <button
                    className="button button-primary product-button"
                    onClick={() =>
                      adicionarProduto(
                        produto
                      )
                    }
                    disabled={
                      produto.estoque <= 0 ||
                      (() => {
                        const item =
                          carrinho.find(
                            (i) =>
                              i.produto_id ===
                              produto.id
                          )

                        return (
                          item !== undefined &&
                          item.quantidade >=
                            produto.estoque
                        )
                      })()
                    }
                  >
                    {produto.estoque <= 0
                      ? 'Esgotado'
                      : 'Adicionar'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">
              Pedido 🛍️
            </h2>

            {carrinho.length === 0 ? (
              <p
                style={{
                  color:
                    'var(--texto-suave)',
                  textAlign: 'center',
                  padding: '30px 10px',
                }}
              >
                Seu carrinho está vazio.
              </p>
            ) : (
              <>
                {carrinho.map((item) => (
                  <div
                    key={item.produto_id}
                    className="cart-item"
                  >
                    <div>
                      <strong>
                        {item.nome}
                      </strong>

                      <div
                        style={{
                          marginTop: 4,
                          color:
                            'var(--texto-suave)',
                          fontSize: 13,
                        }}
                      >
                        {formatarPreco(
                          item.preco
                        )}{' '}
                        cada
                      </div>
                    </div>

                    <div className="quantity-controls">
                      <button
                        className="quantity-button"
                        onClick={() =>
                          removerProduto(
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
                        className="quantity-button"
                        onClick={() => {
                          const produto =
                            produtos.find(
                              (p) =>
                                p.id ===
                                item.produto_id
                            )

                          if (produto) {
                            adicionarProduto(
                              produto
                            )
                          }
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div className="total-box">
                  <p
                    style={{
                      margin: 0,
                      color:
                        'var(--texto-suave)',
                    }}
                  >
                    Total
                  </p>

                  <div className="total-value">
                    {formatarPreco(total)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 20,
                  }}
                >
                  <label className="input-label">
                    Forma de pagamento
                  </label>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(3, 1fr)',
                      gap: 7,
                    }}
                  >
                    <button
                      type="button"
                      className={
                        formaPagamento ===
                        'pix'
                          ? 'button button-primary'
                          : 'button button-secondary'
                      }
                      onClick={() =>
                        setFormaPagamento(
                          'pix'
                        )
                      }
                    >
                      PIX
                    </button>

                    <button
                      type="button"
                      className={
                        formaPagamento ===
                        'cartao'
                          ? 'button button-primary'
                          : 'button button-secondary'
                      }
                      onClick={() =>
                        setFormaPagamento(
                          'cartao'
                        )
                      }
                    >
                      Cartão
                    </button>

                    <button
                      type="button"
                      className={
                        formaPagamento ===
                        'dinheiro'
                          ? 'button button-primary'
                          : 'button button-secondary'
                      }
                      onClick={() =>
                        setFormaPagamento(
                          'dinheiro'
                        )
                      }
                    >
                      Dinheiro
                    </button>
                  </div>
                </div>

                {formaPagamento ===
                  'dinheiro' && (
                  <div
                    style={{
                      marginTop: 16,
                    }}
                  >
                    <label className="input-label">
                      Valor recebido
                    </label>

                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorRecebido}
                      onChange={(event) =>
                        setValorRecebido(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 20,00"
                    />

                    <p
                      style={{
                        color:
                          'var(--texto-suave)',
                        fontSize: 14,
                      }}
                    >
                      Troco:{' '}
                      <strong
                        style={{
                          color:
                            'var(--roxo-escuro)',
                        }}
                      >
                        {formatarPreco(
                          troco
                        )}
                      </strong>
                    </p>
                  </div>
                )}

                <button
                  className="button button-primary"
                  style={{
                    width: '100%',
                    marginTop: 18,
                    minHeight: 52,
                  }}
                  onClick={finalizarVenda}
                  disabled={finalizando}
                >
                  {finalizando
                    ? 'Finalizando...'
                    : 'Finalizar venda 🎉'}
                </button>
              </>
            )}

            {mensagem && (
              <div className="message">
                {mensagem}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}