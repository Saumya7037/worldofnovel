import type { TipTapNode, NovelDetail, Chapter } from './types'

export function renderTipTapNode(node: TipTapNode): string {
    if (node.type === 'text') {
        let result = node.text || ''
        if (node.marks && Array.isArray(node.marks)) {
            for (const mark of node.marks) {
                if (mark.type === 'bold') result = `<strong>${result}</strong>`
                if (mark.type === 'italic') result = `<em>${result}</em>`
                if (mark.type === 'underline') result = `<u>${result}</u>`
            }
        }
        return result
    }

    const content = (node.content || []).map(renderTipTapNode).join('')
    const level = (node.attrs as any)?.level || 1

    if (node.type === 'paragraph') return `<p>${content || '&nbsp;'}</p>`
    if (node.type === 'heading') return `<h${level}>${content}</h${level}>`
    if (node.type === 'bulletList') return `<ul>${content}</ul>`
    if (node.type === 'orderedList') return `<ol>${content}</ol>`
    if (node.type === 'listItem') return `<li>${content}</li>`
    if (node.type === 'hardBreak') return `<br />`
    if (node.type === 'blockquote') return `<blockquote>${content}</blockquote>`
    if (node.type === 'doc') return content

    return content || ''
}

export function downloadAsDoc(htmlContent: string, filename: string) {
    const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${filename}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm; }
          h1 { text-align: center; font-size: 24pt; margin-bottom: 24pt; }
          h2 { font-size: 18pt; margin-top: 18pt; margin-bottom: 12pt; }
          p { margin-bottom: 10pt; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function downloadNovelAsDoc(novel: NovelDetail, chapters: Chapter[]) {
    let content = `<h1>${novel.title}</h1>`
    if (novel.authorName) content += `<p style="text-align:center">by ${novel.authorName}</p>`

    content += `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`

    for (const chapter of chapters) {
        content += `<h2>${chapter.title}</h2>`
        if (chapter.content) {
            content += renderTipTapNode(chapter.content)
        }
        content += `<br clear=all style='mso-special-character:line-break;page-break-before:always'>`
    }

    downloadAsDoc(content, novel.title || 'Novel')
}

export function downloadChapterAsDoc(novelTitle: string, chapter: Chapter) {
    let content = `<h1>${chapter.title}</h1>`
    if (chapter.content) {
        content += renderTipTapNode(chapter.content)
    }
    downloadAsDoc(content, `${novelTitle} - ${chapter.title}`)
}
