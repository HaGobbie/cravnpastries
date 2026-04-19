/**
 * ─────────────────────────────────────────────────────────────
 * IMAGE OPTIMIZATION STRATEGY
 * ─────────────────────────────────────────────────────────────
 * Current: Raw GitHub URLs (?raw=true)
 *   Problems:
 *   • No CDN edge caching — every request hits GitHub origin
 *   • No automatic WebP/AVIF negotiation → larger file sizes
 *   • No on-the-fly resizing — mobile gets full desktop images
 *   • GitHub rate-limits raw requests at scale
 *
 * Recommended migration (in priority order):
 *
 * 1. Supabase Storage  (easiest — you're already on Supabase)
 *    • Upload images to a public bucket ("desserts", "site")
 *    • Transform API: ?width=800&quality=80&format=webp
 *    • URL pattern:
 *        https://<project>.supabase.co/storage/v1/object/public/<bucket>/image.jpg
 *    • Free on Pro plan; CDN-backed via Cloudflare
 *
 * 2. Cloudflare Images  (best performance, $5/mo)
 *    • Auto WebP/AVIF conversion, URL-based resizing
 *    • Global CDN with <50ms cache hit latency
 *
 * 3. Cloudinary  (most features, generous free tier)
 *    • Auto-format (f_auto), auto-quality (q_auto)
 *    • Smart cropping, focal-point detection
 *
 * Migration steps:
 *   1. Upload existing GitHub images to chosen provider
 *   2. Update SITE_DATA image URLs in lib/constants.js
 *   3. Update dessert image_url values in Supabase dashboard
 *   4. Swap lib/github.js uploadImageToGitHub to the new provider
 *
 * Using LazyImage with webpSrc once migrated:
 *   <LazyImage
 *     src="https://cdn.example.com/image.jpg"
 *     webpSrc="https://cdn.example.com/image.webp"
 *     alt="..."
 *   />
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { LOGO_URL } from '../../lib/constants';

/* ── SVG Icon ── */
export const Icon = ({ name, size = 20, stroke = 'currentColor', strokeWidth = 2 }) => {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    close:    <><path d="M18 6 6 18M6 6l12 12" /></>,
    chevronL: <><polyline points="15 18 9 12 15 6" /></>,
    chevronR: <><polyline points="9 18 15 12 9 6" /></>,
    chevronD: <><polyline points="6 9 12 15 18 9" /></>,
    cart:     <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
    pin:      <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    doc:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
    mail:     <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
    menu:     <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>,
    check:    <><polyline points="20 6 9 17 4 12" /></>,
  };
  return <svg {...s}>{paths[name]}</svg>;
};

/* ── LazyImage ──────────────────────────────────────────────────
 *
 * Props:
 *   src              – primary image URL (jpg/png/webp fallback)
 *   webpSrc          – optional WebP URL; when provided, a <picture>
 *                      element is used so modern browsers get the
 *                      lighter format automatically
 *   alt, className, style
 *   wrapperClassName – class string for the wrapper <div>
 *   wrapperStyle     – inline styles for the wrapper <div>
 *                      Merged with defaults: position+overflow are
 *                      set here as inline styles (not CSS class) so
 *                      they cannot be overridden by the stylesheet.
 *
 * FIX: .img-wrapper in index.css no longer sets position/overflow
 * (see index.css). They live here as inline style defaults, which
 * always beat class-based styles, preventing hero image wrappers
 * from collapsing when Tailwind's `absolute` is also applied.
 * ─────────────────────────────────────────────────────────────── */
export const LazyImage = ({
  src,
  alt,
  className        = '',
  style            = {},
  wrapperClassName = '',
  wrapperStyle     = {},
  webpSrc          = null,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  const mergedWrapperStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...wrapperStyle,
  };

  const imgProps = {
    src,
    alt,
    className: `lazy-img ${loaded ? 'img-loaded' : ''} ${className}`,
    style,
    onLoad:  () => setLoaded(true),
    onError: () => { setLoaded(true); setError(true); },
  };

  return (
    <div className={wrapperClassName} style={mergedWrapperStyle}>
      {!loaded && !error && (
        <div className="img-skeleton">
          <div className="img-skeleton-bar"></div>
        </div>
      )}
      {webpSrc ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img {...imgProps} />
        </picture>
      ) : (
        <img {...imgProps} />
      )}
    </div>
  );
};

/* ── Loading Screen ── */
export const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: 'var(--c-cream)' }}>
    <div className="relative flex flex-col items-center">
      <img src={LOGO_URL} alt="Crav'n Loading" className="h-24 w-auto logo-pulse mb-6" />
      <span className="fredoka text-3xl tracking-tight" style={{ color: 'var(--c-caramel)' }}>Cravn</span>
      <div className="mt-8 rounded-full overflow-hidden" style={{ width: '128px', height: '3px', background: 'var(--c-stone)' }}>
        <div style={{ height: '100%', background: 'var(--c-caramel)', animation: 'loading 2s ease-in-out infinite' }}></div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] font-bold" style={{ color: 'var(--c-text-muted)' }}>Preparing your pastries…</p>
    </div>
  </div>
);

/* ── Modal Portal ── */
export const ModalPortal = ({ children }) => {
  const el = useRef(document.createElement('div'));
  useEffect(() => {
    const portal = el.current;
    document.body.appendChild(portal);
    return () => document.body.removeChild(portal);
  }, []);
  return ReactDOM.createPortal(children, el.current);
};

/* ── Skeleton Card (used on Desserts page) ── */
export const SkeletonCard = () => (
  <div className="cursor-default">
    <div className="aspect-square mb-6 overflow-hidden relative" style={{ borderRadius: '30px', background: 'var(--c-stone)' }}>
      <div className="img-skeleton w-full h-full" style={{ borderRadius: 'inherit' }}>
        <div className="img-skeleton-bar"></div>
      </div>
    </div>
    <div style={{ height: '10px', width: '60px', background: 'var(--c-stone)', borderRadius: '999px', marginBottom: '10px' }}></div>
    <div style={{ height: '20px', width: '75%', background: 'var(--c-oat)', borderRadius: '999px', marginBottom: '10px' }}></div>
    <div style={{ height: '14px', width: '90%', background: 'var(--c-stone)', borderRadius: '999px', marginBottom: '6px' }}></div>
    <div style={{ height: '18px', width: '70px', background: 'var(--c-oat)', borderRadius: '999px' }}></div>
  </div>
);

/* ── About Page Skeleton ────────────────────────────────────────
   Shown on first mount while JS hydrates and images are requested.
   Mirrors the real layout: hero → two-column story+gallery → team.
────────────────────────────────────────────────────────────── */
export const AboutSkeleton = () => (
  <div className="page-enter pt-24">
    <section className="px-4 py-4">
      <div className="skeleton" style={{ height: '70vh', borderRadius: '40px' }} />
    </section>
    <section className="py-24 px-8" style={{ background: '#fff8f0' }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
        <div>
          <div className="skeleton" style={{ height: 12, width: 180, borderRadius: 999, marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 52, width: '85%', borderRadius: 12, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 52, width: '60%', borderRadius: 12, marginBottom: 32 }} />
          {[100, 90, 85, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 13, width: `${w}%`, borderRadius: 999, marginBottom: 10 }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton col-span-2" style={{ aspectRatio: '16/9', borderRadius: 24 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-square" style={{ borderRadius: 24 }} />
          ))}
        </div>
      </div>
    </section>
    <section className="py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="skeleton mx-auto" style={{ height: 12, width: 80, borderRadius: 999, marginBottom: 16 }} />
          <div className="skeleton mx-auto" style={{ height: 52, width: 320, borderRadius: 12, marginBottom: 10 }} />
        </div>
        <div className="grid md:grid-cols-3 gap-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="skeleton" style={{ width: 128, height: 128, borderRadius: '9999px', marginBottom: 24 }} />
              <div className="skeleton" style={{ height: 24, width: '70%', borderRadius: 8, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 999, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 11, width: '90%', borderRadius: 999 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

/* ── Contact Page Skeleton ──────────────────────────────────────
   Mirrors: hero → heading → info card + map grid.
────────────────────────────────────────────────────────────── */
export const ContactSkeleton = () => (
  <div className="page-enter pt-24">
    <section className="px-4 py-4">
      <div className="skeleton" style={{ height: '70vh', borderRadius: '40px' }} />
    </section>
    <section className="py-24 px-8" style={{ background: '#fff8f0' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="skeleton mx-auto" style={{ height: 72, width: 360, borderRadius: 16, marginBottom: 16 }} />
          <div className="skeleton mx-auto" style={{ height: 4, width: 96, borderRadius: 999 }} />
        </div>
        <div className="grid lg:grid-cols-2 gap-20">
          <div style={{ borderRadius: 40, padding: 48, background: 'var(--c-stone)', border: '1px solid var(--c-border)' }}>
            <div className="skeleton" style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 36 }} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--c-border)', padding: '16px 0' }}>
                <div className="skeleton" style={{ height: 13, width: 80, borderRadius: 999 }} />
                <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 999 }} />
              </div>
            ))}
          </div>
          <div className="skeleton" style={{ borderRadius: 40, minHeight: 500 }} />
        </div>
      </div>
    </section>
  </div>
);
