import { SiteConfig } from "@/lib/blazeblog";

function mdToHtml(md?: string): string {
  if (!md) return '';
  let src = md
    .replace(/\u258C/g, '')
    .replace(/<[^>]+>/g, '');

  let html = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.*?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1<\/a>');
  html = html.split(/\n{2,}/).map(block => {
    if (/^<h[1-6]>/.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');
  return html;
}

export default function HeroSegment({ config }: { config: SiteConfig }) {
  const hs: any = config?.siteConfig?.heroSettings;
  // Fallback to legacy heroSegment if present
  const legacy: any = (config as any)?.siteConfig?.heroSegment;
  const hero = hs || legacy;
  if (!hero || hero.enabled === false) return null;

  const align: 'left' | 'center' | 'right' = hero.align || 'center';
  const alignCls = align === 'left' ? 'text-left items-start' : align === 'right' ? 'text-right items-end' : 'text-center items-center';
  const html = mdToHtml(hero.contentMd || hero.content || '');
  const ctaText = hero.ctaText || hero.ctaLabel;

  if (!html && !ctaText) return null;

  return (
    <section className="mb-12">
      <div className={`flex flex-col ${alignCls} gap-4 w-full` }>
        {html && (
          <div
            className={`hero-prose ${align === 'center' ? 'mx-auto' : ''} max-w-4xl text-base-content`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {ctaText && hero.ctaUrl && (
          <div>
            <a href={hero.ctaUrl} className="btn btn-primary btn-lg font-semibold shadow-lg">
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
