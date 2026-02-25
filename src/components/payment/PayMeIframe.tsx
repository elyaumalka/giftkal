import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface PayMeIframeProps {
  apiKey: string;
  testMode?: boolean;
  amount: number;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  productLabel: string;
  onTokenize: (token: string, cardInfo: { cardMask: string; expiry: string }) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function PayMeIframe({
  apiKey,
  testMode = false,
  amount,
  payerName,
  payerEmail = "",
  payerPhone = "",
  productLabel,
  onTokenize,
  onError,
  disabled = false,
}: PayMeIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initSentRef = useRef(false);

  // Send init config to iframe once it signals it's loaded
  const sendInit = useCallback(() => {
    if (!iframeRef.current?.contentWindow || initSentRef.current) return;
    initSentRef.current = true;
    
    iframeRef.current.contentWindow.postMessage({
      type: 'init',
      config: {
        apiKey,
        testMode,
        amount,
        payerName,
        payerEmail,
        payerPhone,
        productLabel,
      },
    }, '*');
  }, [apiKey, testMode, amount, payerName, payerEmail, payerPhone, productLabel]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.source !== 'payme-iframe') return;

      switch (e.data.type) {
        case 'loaded':
          // iframe HTML loaded, send init
          sendInit();
          break;
        case 'ready':
          // PayMe fields mounted successfully
          setIsLoading(false);
          setIframeReady(true);
          break;
        case 'tokenize':
          onTokenize(e.data.token, {
            cardMask: e.data.cardMask || '',
            expiry: e.data.expiry || '',
          });
          break;
        case 'error':
          onError(e.data.message || 'שגיאה בתשלום');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sendInit, onTokenize, onError]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-[#C4A35A] animate-spin" />
          <p className="text-[#5A4A2A]">טוען מערכת תשלום מאובטחת...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/payme-iframe.html"
        style={{
          width: '100%',
          height: iframeReady ? 320 : 0,
          border: 'none',
          overflow: 'hidden',
          opacity: iframeReady ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="PayMe Secure Payment"
      />
    </div>
  );
}
