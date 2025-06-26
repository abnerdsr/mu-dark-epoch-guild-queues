// Função simples de hash para senhas
export function hashPassword(password: string): string {
  let hash = 0
  if (password.length === 0) return hash.toString()

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Adicionar salt simples baseado no comprimento
  const salt = password.length * 7
  hash = hash + salt

  return Math.abs(hash).toString(16)
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword
}
