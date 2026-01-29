import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Declare PayMe global type
declare global {
  interface Window {
    PayMe: {
      create: (apiKey: string, options: { testMode: boolean; language: string }) => Promise<PayMeInstance>;
      fields: {
        NUMBER: string;
        EXPIRATION: string;
        CVC: string;
      };
      validators: Record<string, { test: (value: string) => { required?: boolean; invalid?: boolean } | null }>;
    };
  }
}

interface PayMeInstance {
  hostedFields: () => HostedFieldsManager;
  tokenize: (data: TokenizeData) => Promise<TokenizeResult>;
}

interface HostedFieldsManager {
  create: (fieldType: string, options?: FieldOptions) => HostedField;
}

interface HostedField {
  mount: (selector: string) => Promise<void>;
  on: (event: string, callback: (e: FieldEvent) => void) => void;
}

interface FieldOptions {
  placeholder?: string;
  messages?: {
    required?: string;
    invalid?: string;
  };
  styles?: {
    base?: Record<string, string | Record<string, string>>;
    invalid?: Record<string, string>;
    valid?: Record<string, string>;
  };
}

interface FieldEvent {
  type: string;
  event: string;
  field: string;
  isValid: boolean;
  message?: string;
  cardType?: string;
}

interface TokenizeData {
  payerFirstName: string;
  payerLastName: string;
  payerEmail: string;
  payerPhone: string;
  payerSocialId?: string;
  total: {
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  };
}

interface TokenizeResult {
  type: string;
  token: string;
  testMode: boolean;
  card: {
    cardMask: string;
    cardholderName: string;
    expiry: string;
  };
  payerEmail: string;
  payerName: string;
  payerPhone: string;
}

interface PayMeHostedFieldsProps {
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

export default function PayMeHostedFields({
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
}: PayMeHostedFieldsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);
  const [fieldStates, setFieldStates] = useState({
    cardNumber: { isValid: false, isFocused: false, hasValue: false },
    cardExpiration: { isValid: false, isFocused: false, hasValue: false },
    cvc: { isValid: false, isFocused: false, hasValue: false },
  });
  const [error, setError] = useState<string | null>(null);

  const instanceRef = useRef<PayMeInstance | null>(null);
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if form is valid
  const isFormValid = fieldStates.cardNumber.isValid && 
                      fieldStates.cardExpiration.isValid && 
                      fieldStates.cvc.isValid;

  // Field styling for hosted fields
  const fieldStyles = {
    base: {
      'color': '#051839',
      'font-size': '16px',
      'text-align': 'right',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
    invalid: {
      'color': '#DC2626',
    },
    valid: {
      'color': '#059669',
    },
  };

  // Load PayMe SDK script
  useEffect(() => {
    if (sdkLoaded || !apiKey) return;

    const loadScript = async () => {
      try {
        if (!window.PayMe) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.payme.io/hf/v1/hostedfields.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PayMe SDK'));
            document.head.appendChild(script);
          });
        }

        // Wait for SDK to be fully initialized
        let attempts = 0;
        while (!window.PayMe?.create && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.PayMe?.create) {
          throw new Error('PayMe SDK not available after loading');
        }

        setSdkLoaded(true);
      } catch (err) {
        console.error('Failed to load PayMe SDK:', err);
        setError('שגיאה בטעינת מערכת התשלום');
        setIsLoading(false);
      }
    };

    loadScript();
  }, [apiKey, sdkLoaded]);

  // Initialize fields after SDK loaded and DOM is ready
  useEffect(() => {
    if (!sdkLoaded || !apiKey || mountedRef.current || !containerRef.current) return;
    
    // Check if containers exist in DOM
    const cardNumberContainer = document.getElementById('payme-card-number');
    const expirationContainer = document.getElementById('payme-card-expiration');
    const cvcContainer = document.getElementById('payme-card-cvc');
    
    if (!cardNumberContainer || !expirationContainer || !cvcContainer) {
      console.log('Waiting for containers...');
      return;
    }
    
    mountedRef.current = true;

    const initializeFields = async () => {
      try {
        // Create PayMe instance
        const instance = await window.PayMe.create(apiKey, {
          testMode,
          language: 'he',
        });

        instanceRef.current = instance;

        // Get hosted fields manager
        const fields = instance.hostedFields();

        // Create fields
        const cardNumber = fields.create('cardNumber', {
          placeholder: 'מספר כרטיס',
          messages: {
            required: 'שדה חובה',
            invalid: 'מספר כרטיס לא תקין',
          },
          styles: fieldStyles,
        });

        const cardExpiration = fields.create('cardExpiration', {
          placeholder: 'MM/YY',
          messages: {
            required: 'שדה חובה',
            invalid: 'תאריך לא תקין',
          },
          styles: fieldStyles,
        });

        const cvc = fields.create('cvc', {
          placeholder: 'CVV',
          messages: {
            required: 'שדה חובה',
            invalid: 'CVV לא תקין',
          },
          styles: fieldStyles,
        });

        // Setup event listeners
        const setupFieldEvents = (field: HostedField, fieldName: keyof typeof fieldStates) => {
          field.on('focus', () => {
            setFieldStates(prev => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], isFocused: true },
            }));
          });

          field.on('blur', () => {
            setFieldStates(prev => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], isFocused: false },
            }));
          });

          field.on('validity-changed', (e: FieldEvent) => {
            setFieldStates(prev => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], isValid: e.isValid, hasValue: true },
            }));
          });

          field.on('keyup', () => {
            setFieldStates(prev => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], hasValue: true },
            }));
          });
        };

        setupFieldEvents(cardNumber, 'cardNumber');
        setupFieldEvents(cardExpiration, 'cardExpiration');
        setupFieldEvents(cvc, 'cvc');

        // Listen for card type changes
        cardNumber.on('card-type-changed', (e: FieldEvent) => {
          setCardType(e.cardType || null);
        });

        // Mount fields to containers
        await Promise.all([
          cardNumber.mount('#payme-card-number'),
          cardExpiration.mount('#payme-card-expiration'),
          cvc.mount('#payme-card-cvc'),
        ]);

        setFieldsReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error('PayMe SDK initialization error:', err);
        setError('שגיאה בטעינת מערכת התשלום');
        setIsLoading(false);
      }
    };

    initializeFields();

    return () => {
      mountedRef.current = false;
    };
  }, [sdkLoaded, apiKey, testMode, fieldStyles]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!instanceRef.current || !isFormValid || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Split payer name into first and last
      const nameParts = payerName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const tokenizeData: TokenizeData = {
        payerFirstName: firstName,
        payerLastName: lastName,
        payerEmail: payerEmail || 'guest@example.com',
        payerPhone: payerPhone || '',
        total: {
          label: productLabel,
          amount: {
            currency: 'ILS',
            value: amount.toFixed(2),
          },
        },
      };

      const result = await instanceRef.current.tokenize(tokenizeData);

      if (result.type === 'tokenize-success' && result.token) {
        onTokenize(result.token, {
          cardMask: result.card.cardMask,
          expiry: result.card.expiry,
        });
      } else {
        throw new Error('Tokenization failed');
      }
    } catch (err: any) {
      console.error('Tokenization error:', err);
      const errorMessage = err?.errors 
        ? Object.values(err.errors).join(', ')
        : 'שגיאה בעיבוד התשלום';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [isFormValid, isProcessing, payerName, payerEmail, payerPhone, productLabel, amount, onTokenize, onError]);

  // Get card brand icon
  const getCardIcon = () => {
    switch (cardType) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 Amex';
      case 'diners':
        return '💳 Diners';
      default:
        return null;
    }
  };

  // Always render containers - show loading overlay when not ready
  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-[#C4A35A] animate-spin" />
          <p className="text-[#5A4A2A]">טוען מערכת תשלום מאובטחת...</p>
        </div>
      )}

      {/* Test Mode Badge */}
      {!isLoading && testMode && (
        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center justify-center gap-2">
          <span className="text-amber-800 font-semibold text-sm">🧪 TEST MODE IS ON</span>
          <span className="text-amber-600 text-xs">- לא יתבצעו חיובים אמיתיים</span>
        </div>
      )}

      {/* Security Badge - only show when loaded */}
      {!isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>תשלום מאובטח SSL</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Card Fields - always in DOM but hidden during loading */}
      <div className={cn("space-y-4", isLoading && "opacity-0 h-0 overflow-hidden")}>
        {/* Card Number */}
        <div>
          <Label className="text-[#051839] font-medium flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            מספר כרטיס
            {cardType && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                {getCardIcon()}
              </span>
            )}
          </Label>
          <div
            id="payme-card-number"
            className={cn(
              "mt-1 h-12 rounded-xl border-2 transition-colors px-4 flex items-center bg-white",
              fieldStates.cardNumber.isFocused
                ? "border-[#C4A35A] ring-2 ring-[#C4A35A]/20"
                : fieldStates.cardNumber.hasValue && !fieldStates.cardNumber.isValid
                ? "border-red-300"
                : fieldStates.cardNumber.isValid
                ? "border-green-300"
                : "border-gray-200"
            )}
          />
        </div>

        {/* Expiration & CVV Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#051839] font-medium">תוקף</Label>
            <div
              id="payme-card-expiration"
              className={cn(
                "mt-1 h-12 rounded-xl border-2 transition-colors px-4 flex items-center bg-white",
                fieldStates.cardExpiration.isFocused
                  ? "border-[#C4A35A] ring-2 ring-[#C4A35A]/20"
                  : fieldStates.cardExpiration.hasValue && !fieldStates.cardExpiration.isValid
                  ? "border-red-300"
                  : fieldStates.cardExpiration.isValid
                  ? "border-green-300"
                  : "border-gray-200"
              )}
            />
          </div>
          <div>
            <Label className="text-[#051839] font-medium">CVV</Label>
            <div
              id="payme-card-cvc"
              className={cn(
                "mt-1 h-12 rounded-xl border-2 transition-colors px-4 flex items-center bg-white",
                fieldStates.cvc.isFocused
                  ? "border-[#C4A35A] ring-2 ring-[#C4A35A]/20"
                  : fieldStates.cvc.hasValue && !fieldStates.cvc.isValid
                  ? "border-red-300"
                  : fieldStates.cvc.isValid
                  ? "border-green-300"
                  : "border-gray-200"
              )}
            />
          </div>
        </div>
      </div>

      {/* Submit Button - only show when loaded */}
      {!isLoading && (
        <>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isProcessing || disabled}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#C4A35A] to-[#D4B36A] hover:from-[#B4943A] hover:to-[#C4A35A] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                מעבד תשלום...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                שלם ₪{amount.toLocaleString()}
              </>
            )}
          </Button>

          {/* PayMe Branding */}
          <div className="text-center text-xs text-gray-400">
            מאובטח על ידי PayMe
          </div>
        </>
      )}
    </div>
  );
}
