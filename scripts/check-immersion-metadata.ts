import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return
  const supabase = createClient(url, key)

  const { data, error } = await supabase
    .from('immersion_lessons')
    .select('id, slug, title, metadata')

  if (error) {
    console.error(error)
    return
  }

  console.log(`Total lecciones en DB: ${data.length}`)
  data.forEach((l: { slug: string; title: string; metadata?: Record<string, unknown> }) => {
    console.log(`- ${l.slug}: metadata =`, JSON.stringify(l.metadata))
  })
}

main().catch(console.error)
