export function buildRouteUrl(from: string, to: string): string {
  const params = new URLSearchParams({ from, to });
  return `${window.location.origin}/?${params.toString()}`;
}

export function shareOnWhatsApp(fromName: string, toName: string, url: string) {
  const text = encodeURIComponent(
    `Delhi Metro Route: ${fromName} → ${toName}\n\nView visual route: ${url}`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
