export function openWhatsApp(phone: string, text?: string): void {
  // Normalizar número boliviano: eliminar +, espacios, guiones
  const clean = phone.replace(/[\s\-+]/g, '')
  const encoded = text ? `?text=${encodeURIComponent(text)}` : ''
  window.open(`https://wa.me/${clean}${encoded}`, '_blank', 'noopener')
}
