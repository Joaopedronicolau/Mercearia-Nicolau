"use client";
import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type Props = {
  onDetected: (codigo: string) => void;
  onClose: () => void;
  /** Texto mostrado sobre a câmera (ex.: "Arroz adicionado"). */
  mensagem?: string;
};

export default function BarcodeScanner({ onDetected, onClose, mensagem }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ultimo = useRef<{ codigo: string; t: number }>({ codigo: "", t: 0 });
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | undefined;
    let cancelado = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current!,
        (result) => {
          if (!result) return;
          const codigo = result.getText();
          const agora = Date.now();
          // evita ler o mesmo código várias vezes seguidas
          if (codigo === ultimo.current.codigo && agora - ultimo.current.t < 2000) return;
          ultimo.current = { codigo, t: agora };
          navigator.vibrate?.(100);
          callbackRef.current(codigo);
        }
      )
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
      <video ref={videoRef} className="flex-1 object-cover" muted playsInline />
      <div className="px-4 pt-3 text-center text-white">
        <p className="text-sm">Aponte a câmera para o código de barras</p>
        {mensagem && <p className="mt-2 rounded bg-white/20 p-2 text-base font-bold">{mensagem}</p>}
      </div>
      <button onClick={onClose} className="m-4 rounded bg-white py-3 font-semibold">
        Fechar
      </button>
    </div>
  );
}
