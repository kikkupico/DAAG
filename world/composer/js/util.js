const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Text made safe to put inside innerHTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

/**
 * Copy text to clipboard across secure (HTTPS / localhost) and non-secure (LAN HTTP) contexts.
 * Returns true if copying succeeded, false otherwise.
 */
export async function copyTextToClipboard(text) {
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text) return false;

  // 1. Try modern Async Clipboard API first (requires secure context in most browsers)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback:', err);
    }
  }

  // 2. Fallback using document.execCommand('copy') with an offscreen textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (successful) return true;
  } catch (err) {
    console.warn('document.execCommand copy fallback failed:', err);
  }

  return false;
}

