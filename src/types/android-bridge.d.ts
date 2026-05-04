// Android WebView JavaScript Bridge declarations
declare global {
  interface Window {
    AndroidDevice?: {
      getDeviceId(): string;
    };
  }
}

export {};
