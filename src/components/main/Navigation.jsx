import { useState } from 'react';
import { LOGO_URL } from '../../lib/constants';

const Navigation = ({ setPage, currentPage }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pages = ['home', 'about', 'desserts', 'faqs', 'contact'];

  return (
    <nav className="fixed top-0 w-full backdrop-blur-md z-50" style={{ background: 'rgba(253,245,228,0.97)', borderBottom: '1px solid rgba(193,130,55,0.18)' }}>
      <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPage('home')}>
            <img src={LOGO_URL} alt="Crav'n Logo" className="h-14 w-auto transition-all duration-300" style={{ filter: 'drop-shadow(0 2px 8px rgba(228,140,60,0.2))' }} />
            <span className="fredoka text-3xl tracking-tighter" style={{ color: 'var(--c-caramel)' }}>Cravn</span>
          </div>
          <div className="hidden md:flex gap-10 text-[13px] uppercase tracking-[0.25em] font-extrabold" style={{ color: 'var(--c-text-muted)' }}>
            {pages.map((p) => (
              <button key={p} onClick={() => setPage(p)}
                aria-label={`Go to ${p}`}
                className={currentPage === p ? 'nav-active' : ''}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', padding: '8px 0', color: currentPage === p ? 'var(--c-caramel)' : 'var(--c-text-muted)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--c-caramel)')}
                onMouseLeave={(e) => (e.target.style.color = currentPage === p ? 'var(--c-caramel)' : 'var(--c-text-muted)')}
              >{p}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Order Now"
            className="btn-caramel hidden md:block px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ boxShadow: '0 8px 24px rgba(228,140,60,0.3)' }}
            onClick={() => setPage('desserts')}
          >Order Now</button>
          <button
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl transition-all"
            style={{ background: mobileOpen ? 'var(--c-caramel)' : 'var(--c-oat)', border: 'none', cursor: 'pointer', gap: '5px', padding: '8px' }}
            onClick={() => setMobileOpen((p) => !p)}
          >
            <span style={{ display: 'block', width: '18px', height: '2px', background: mobileOpen ? '#fff' : 'var(--c-dark)', borderRadius: '2px', transition: 'all 0.3s', transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none' }}></span>
            <span style={{ display: 'block', width: '18px', height: '2px', background: mobileOpen ? '#fff' : 'var(--c-dark)', borderRadius: '2px', transition: 'all 0.3s', opacity: mobileOpen ? 0 : 1 }}></span>
            <span style={{ display: 'block', width: '18px', height: '2px', background: mobileOpen ? '#fff' : 'var(--c-dark)', borderRadius: '2px', transition: 'all 0.3s', transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }}></span>
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <div style={{ overflow: 'hidden', maxHeight: mobileOpen ? '420px' : '0', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)', background: 'rgba(253,245,228,0.99)', borderTop: mobileOpen ? '1px solid rgba(193,130,55,0.18)' : 'none' }}>
        <div className="px-6 py-6 flex flex-col gap-1">
          {pages.map((p) => (
            <button key={p} onClick={() => { setPage(p); setMobileOpen(false); }}
              aria-label={`Go to ${p}`}
              style={{ background: currentPage === p ? 'rgba(228,140,60,0.08)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', padding: '14px 16px', borderRadius: '12px', color: currentPage === p ? 'var(--c-caramel)' : 'var(--c-text-muted)', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}
            >{p}</button>
          ))}
          <button aria-label="Order Now"
            className="btn-caramel mt-2 py-4 rounded-full text-xs font-black uppercase tracking-widest"
            onClick={() => { setPage('desserts'); setMobileOpen(false); }}
          >Order Now</button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
