import { useState } from 'react';
import { shareOnWhatsApp, copyToClipboard } from '../utils/routeUrl';

interface Props {
  fromName: string;
  toName: string;
  url: string;
}

export default function ShareButton({ fromName, toName, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      prompt('Copy this link:', url);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => shareOnWhatsApp(fromName, toName, url)}
        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium
                   active:scale-[0.98] transition flex items-center justify-center gap-1.5"
      >
        📤 Share on WhatsApp
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-medium
                   active:scale-[0.98] transition flex items-center justify-center gap-1.5 border border-slate-200"
      >
        {copied ? '✓ Copied' : '🔗 Copy Link'}
      </button>
    </div>
  );
}
