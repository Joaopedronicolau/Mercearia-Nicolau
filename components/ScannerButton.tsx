"use client";
import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

type Props = {
  /** Chamado a cada código lido. Se devolver um texto, ele aparece sobre a câmera. */
  onCodigo: (codigo: string) => string | void | Promise<string | void>;
  /** true = fecha a câmera após a 1ª leitura (cadastro/busca). false = continua lendo (vendas). */
  fecharAoLer?: boolean;
  label?: string;
};

export default function ScannerButton({ onCodigo, fecharAoLer = false, label = "📷 Escanear" }: Props) {
  const [aberto, setAberto] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <>
      <button
        type="button"
        className="btn btn-g btn-p"
        onClick={() => {
          setMsg("");
          setAberto(true);
        }}
      >
        {label}
      </button>
      {aberto && (
        <BarcodeScanner
          mensagem={msg}
          onClose={() => setAberto(false)}
          onDetected={async (codigo) => {
            const r = await onCodigo(codigo);
            if (typeof r === "string") setMsg(r);
            if (fecharAoLer) setAberto(false);
          }}
        />
      )}
    </>
  );
}
