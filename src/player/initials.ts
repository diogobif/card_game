/** Two letters for an avatar: first letters of the first two words, or the first two letters. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase()
}
