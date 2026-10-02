/** Let the browser provide the multipart boundary; never set Content-Type manually. */
export function transcriptionForm(blob: Blob, targetWord?: string): FormData {
  const form = new FormData()
  form.append('audio', blob, 'recording')
  if (targetWord) form.append('targetWord', targetWord)
  return form
}
