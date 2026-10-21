// Aplica a máscara (11) 98765-4321 enquanto o telefone é digitado
export function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Formata o telefone salvo no banco ("5511987654321") para exibição
export function formatarTelefone(telefone: string | null | undefined) {
  const d = String(telefone || '').replace(/\D/g, '')
  return mascararTelefone(d.startsWith('55') && d.length >= 12 ? d.slice(2) : d)
}
