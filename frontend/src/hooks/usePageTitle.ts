import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    const full = title ? `${title} · WorldofNovel` : 'WorldofNovel'
    if (document.title !== full) document.title = full
  }, [title])
}