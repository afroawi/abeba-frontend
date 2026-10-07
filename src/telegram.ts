type TelegramApp = {
  initData: string;
  ready(): void;
  expand(): void;
  colorScheme?: string;
  onEvent(name: string, cb: () => void): void;
  offEvent(name: string, cb: () => void): void;
  BackButton: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  close(): void;
};
declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramApp };
  }
}
let loading: Promise<TelegramApp | undefined> | undefined;
export function loadTelegram() {
  return (loading ??= new Promise<TelegramApp | undefined>(
    (resolve, reject) => {
      if (window.Telegram?.WebApp) return resolve(window.Telegram.WebApp);
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-web-app.js";
      script.onload = () => resolve(window.Telegram?.WebApp);
      script.onerror = () =>
        reject(
          new Error("Could not load Telegram. Close and reopen the chat app."),
        );
      document.head.appendChild(script);
    },
  ));
}
