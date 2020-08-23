export function dateString(epoch: string) {
  const date = new Date()
  date.setTime(parseInt(epoch) * 1000)
  return date.toLocaleString()
}
