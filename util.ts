export function dateString(epoch: string) {
  const date = new Date()
  date.setTime(parseInt(epoch) * 1000)
  return date.toLocaleString()
}

export function dateStringISO(epoch: string) {
  const date = new Date()
  date.setTime(parseInt(epoch) * 1000)
  return date.toISOString().replace(/\.000Z$/, "Z")
}