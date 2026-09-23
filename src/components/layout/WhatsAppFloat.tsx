import { SITE } from "@/lib/site";

export function WhatsAppFloat() {
  return (
    <a
      href={SITE.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Lumina Hub on WhatsApp"
      className="fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ink)]"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.82c0 1.96.57 3.78 1.56 5.33L2 22l5.05-1.64a9.9 9.9 0 0 0 4.99 1.34h.01c5.46 0 9.89-4.4 9.89-9.82C21.94 6.4 17.5 2 12.04 2zm5.76 13.99c-.24.67-1.4 1.23-1.93 1.31-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.61-2.89-1.25-4.77-4.15-4.92-4.34-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.17 0 .4-.07.62.48.24.58.8 2 .87 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.29.29-.12.57.17.28.75 1.23 1.61 2 .99.88 1.83 1.15 2.11 1.28.28.14.44.12.6-.07.17-.19.7-.81.89-1.09.19-.28.38-.23.64-.14.26.1 1.66.78 1.95.92.28.14.47.21.54.33.07.12.07.7-.17 1.37z" />
      </svg>
    </a>
  );
}
