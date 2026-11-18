"use client";
import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  onDetected: (codigo: string) => void;
  onClose: () => void;
  /** Texto mostrado sobre a câmera (ex.: "Arroz adicionado"). */
  mensagem?: string;
};

// Só os formatos de produto de mercado: o leitor tenta menos tipos por foto e fica mais rápido.
const hints = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128],
  ],
]);

export default function BarcodeScanner({ onDetected, onClose, mensagem }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ultimo = useRef<{ codigo: string; t: number }>({ codigo: "", t: 0 });
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;

  useEffect(() => {
    // Por padrão a biblioteca tenta ler só 1 vez a cada 500 ms; aqui tenta a cada 100 ms.
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 100,
      delayBetweenScanSuccess: 500,
    });
    let controls: IScannerControls | undefined;
    let cancelado = false;

    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: "continuous" }], // foco automático contínuo (onde o celular permite)
      },
    } as unknown as MediaStreamConstraints;

    reader
      .decodeFromConstraints(constraints, videoRef.current!, (result) => {
        if (!result) return;
        const codigo = result.getText();
        const agora = Date.now();
        // evita ler o mesmo código várias vezes seguidas
        if (codigo === ultimo.current.codigo && agora - ultimo.current.t < 2000) return;
        ultimo.current = { codigo, t: agora };
        navigator.vibrate?.(100);
        callbackRef.current(codigo);
      })
      .then((c) => {
        if (cancelado) c.stop();
        else controls = c;
      })
      .catch(() =>
        alert("Não consegui acessar a câmera. Verifique a permissão do navegador (e use HTTPS).")
      );

    return () => {
      cancelado = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {/* faixas escuras em cima e embaixo: o código deve ficar na faixa do meio */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34%] bg-black/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-black/70" />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-red-500" />
      </div>
      <div className="px-4 pt-3 text-center text-white">
        <p className="text-sm">Deixe o código de barras na faixa do meio, de lado a lado</p>
        {mensagem && <p className="mt-2 rounded bg-white/20 p-2 text-base font-bold">{mensagem}</p>}
      </div>
      <button onClick={onClose} className="m-4 rounded bg-white py-3 font-semibold">
        Fechar
      </button>
    </div>
  );
}
