import { Icon } from "@/components/Icon";

export function WhatsAppButton({ number }: { number: string }) {
  const href = `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent("Hello Tabis Pork Palace, I need help with an order.")}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-print fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-[#1fa855] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#188c46] md:bottom-6 md:right-6"
      aria-label="Chat with Tabis on WhatsApp"
    >
      <Icon name="chat" className="h-5 w-5" fill />
      <span className="hidden sm:inline">Need help? Chat with Tabis</span>
    </a>
  );
}
