export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
}) => {
  const tags: Array<{ title?: string; name?: string; content?: string }> = [
    { title },
    { name: 'twitter:title', content: title },
    { name: 'twitter:creator', content: '@tannerlinsley' },
    { name: 'twitter:site', content: '@tannerlinsley' },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
  ]

  // Only add tags with defined content to avoid React key warnings
  if (description) {
    tags.push({ name: 'description', content: description })
    tags.push({ name: 'twitter:description', content: description })
    tags.push({ name: 'og:description', content: description })
  }

  if (keywords) {
    tags.push({ name: 'keywords', content: keywords })
  }

  if (image) {
    tags.push({ name: 'twitter:image', content: image })
    tags.push({ name: 'twitter:card', content: 'summary_large_image' })
    tags.push({ name: 'og:image', content: image })
  }

  return tags
}
