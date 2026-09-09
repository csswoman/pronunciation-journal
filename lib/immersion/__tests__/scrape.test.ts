import { describe, it, expect } from 'vitest'
import {
  buildStudyCheckpoints,
  extractSlug,
  IMMERSION_LEVELS,
  isImmersionLevel,
  normalizeLevel,
  normalizeTopic,
  parseArchivePosts,
  parseCategories,
  parseDurationSeconds,
  parseLessonPage,
  teacherFromChannelTitle,
} from '../scrape'

const SIDEBAR = `<a href="https://www.engvid.com/english-teacher/adam/">Adam</a>
<a href="https://www.engvid.com/english-teacher/alex/">Alex</a>`

const PAGE = `<html><head><title>How to talk about friends in English &middot; engVid</title></head><body>
${SIDEBAR}
<div class="featured_category_list"> &bull; <a href="/level/intermediate/">2-Intermediate</a><br />&bull; <a href="/topic/pronunciation/">pronunciation</a><br /> </div>
<h1 class="posttitle"><a href="#" rel="bookmark">How to talk about friends in English</a></h1>
<span class="featured_description">Learn how to describe your &#8220;best friend&#8221; naturally.</span>
<div class="entry"><iframe class="vidembed" src="https://www.youtube.com/embed/ChZJ1Q3GSuI?rel=0"></iframe></div>
</body></html>`

describe('parseLessonPage', () => {
  it('extracts video id, title, decoded description and categories', () => {
    const page = parseLessonPage(PAGE, 'https://www.engvid.com/how-to-talk-about-friends-in-english/')
    expect(page).not.toBeNull()
    expect(page!.youtubeVideoId).toBe('ChZJ1Q3GSuI')
    expect(page!.slug).toBe('how-to-talk-about-friends-in-english')
    expect(page!.title).toBe('How to talk about friends in English')
    expect(page!.description).toContain('“best friend”')
    expect(page!.categories).toEqual(['2-intermediate', 'pronunciation'])
  })

  it('returns null when the page has no YouTube embed', () => {
    expect(parseLessonPage('<html><body>no video</body></html>', 'https://x/y/')).toBeNull()
  })
})

describe('teacherFromChannelTitle', () => {
  it('reads the real teacher from the YouTube channel title', () => {
    expect(teacherFromChannelTitle('English with Alex · engVid')).toBe('Alex')
    expect(teacherFromChannelTitle('Adam’s English Lessons · engVid')).toBe('Adam')
    expect(teacherFromChannelTitle('English with Emma · engVid')).toBe('Emma')
  })

  it('returns null for a channel that names no known teacher', () => {
    expect(teacherFromChannelTitle('Some Random Channel')).toBeNull()
  })
})

describe('parseCategories / normalizeLevel / normalizeTopic', () => {
  it('maps engVid three published levels to CEFR', () => {
    expect(normalizeLevel(['1-beginner'])).toBe('A2')
    expect(normalizeLevel(['2-intermediate'])).toBe('B1')
    expect(normalizeLevel(['3-advanced'])).toBe('C1')
    expect(normalizeLevel([])).toBe('B1')
  })

  it('picks the highest level when engVid files a lesson under two', () => {
    // engVid publica algunas lecciones en intermedio y avanzado a la vez.
    expect(normalizeLevel(['2-intermediate', '3-advanced'])).toBe('C1')
    expect(normalizeLevel(['1-beginner', '2-intermediate'])).toBe('B1')
  })

  it('only recognises the three levels engVid actually publishes', () => {
    expect(IMMERSION_LEVELS).toEqual(['A2', 'B1', 'C1'])
    expect(isImmersionLevel('B1')).toBe(true)
    expect(isImmersionLevel('B2')).toBe(false)
    expect(isImmersionLevel('C2')).toBe(false)
  })

  it('prefers the published category over the title when picking a topic', () => {
    expect(normalizeTopic(['pronunciation'], 'Ten new words')).toBe('pronunciation')
    expect(normalizeTopic([], '10 idioms for work')).toBe('vocabulary')
  })

  it('returns an empty list when no category block exists', () => {
    expect(parseCategories('<html></html>')).toEqual([])
  })
})

describe('extractSlug', () => {
  it('handles trailing slashes', () => {
    expect(extractSlug('https://www.engvid.com/abc-def/')).toBe('abc-def')
    expect(extractSlug('https://www.engvid.com/abc-def')).toBe('abc-def')
  })
})

describe('parseArchivePosts', () => {
  it('keeps entries that carry both slug and link', () => {
    const posts = parseArchivePosts([
      { slug: 'a-lesson', link: 'https://www.engvid.com/a-lesson/' },
      { slug: 'b-lesson', link: 'https://www.engvid.com/b-lesson/' },
    ])
    expect(posts).toHaveLength(2)
    expect(posts[0].slug).toBe('a-lesson')
  })

  it('drops malformed entries instead of throwing', () => {
    expect(parseArchivePosts([{ slug: 'x' }, { link: 'y' }, null, 'nope'])).toEqual([])
  })

  it('returns an empty list when the API returns an error object', () => {
    expect(parseArchivePosts({ code: 'rest_post_invalid_page_number' })).toEqual([])
  })
})

describe('parseDurationSeconds', () => {
  it('reads lengthSeconds from a player response', () => {
    expect(parseDurationSeconds('{"videoDetails":{"lengthSeconds":"495"}}')).toBe(495)
  })

  it('falls back to approxDurationMs in milliseconds', () => {
    expect(parseDurationSeconds('{"approxDurationMs":"600000"}')).toBe(600)
  })

  it('returns null when YouTube gates the response', () => {
    expect(parseDurationSeconds('{"playabilityStatus":{"status":"LOGIN_REQUIRED"}}')).toBeNull()
    expect(parseDurationSeconds('')).toBeNull()
  })

  it('rejects an implausibly long duration parsed from the page shell', () => {
    expect(parseDurationSeconds('{"lengthSeconds":"999999"}')).toBeNull()
  })
})

describe('buildStudyCheckpoints', () => {
  it('spaces checkpoints across the real duration', () => {
    const points = buildStudyCheckpoints(8)
    expect(points).toHaveLength(4)
    expect(points[0].seconds).toBe(0)
    expect(points[points.length - 1].seconds).toBeLessThan(8 * 60)
    expect(points.every((p) => p.label.length > 0)).toBe(true)
  })

  it('never emits a checkpoint past a very short video', () => {
    const points = buildStudyCheckpoints(1)
    expect(points.every((p) => p.seconds < 60)).toBe(true)
  })
})
