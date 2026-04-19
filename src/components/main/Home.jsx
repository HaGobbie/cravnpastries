import { SITE_DATA, LOGO_URL } from '../../lib/constants';
import { LazyImage } from './Shared';

const Home = ({ setPage }) => (
  <div className="page-enter pt-24">
    {/* Hero */}
    <section className="px-4 py-4" style={{ background: 'var(--c-cream)' }}>
      <div className="relative h-[85vh] rounded-[40px] overflow-hidden flex items-center justify-center text-center text-white shadow-2xl" style={{ background: '#1a0d06' }}>
        {/*
          FIX: position + inset moved from wrapperClassName into wrapperStyle so
          they are applied as inline styles and cannot be overridden by the
          .img-wrapper CSS class (which comes after @tailwind utilities in the
          cascade and would otherwise force position: relative, collapsing the
          wrapper to zero height and hiding the image).
        */}
        <LazyImage
          src="https://github.com/HaGobbie/cravpastries/blob/main/CravnHomeEntranceImage.png?raw=true"
          alt="Artisan Pastries Entrance"
          className="absolute inset-0 w-full h-full object-cover"
          wrapperStyle={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }}
        />
        <div className="caramel-overlay absolute inset-0"></div>
        <div className="relative z-10 max-w-4xl px-6">
          <h2 className="text-5xl md:text-8xl font-bold serif italic mb-8 leading-tight tracking-tight" style={{ textShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
            Satisfy Your Daily <br className="hidden md:block" />
            <span style={{ color: 'var(--c-caramel)', textShadow: '0 2px 20px rgba(228,140,60,0.5)' }}>Cravings.</span>
          </h2>
          <p className="text-lg md:text-2xl font-semibold mb-12 max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.6)' }}>
            Premium cakes and artisan pastries, crafted for your schedule. Order online, customize your treat, and enjoy hassle-free pickup.
          </p>
          <button onClick={() => setPage('desserts')} aria-label="Explore our pastry menu" className="btn-caramel px-14 py-5 rounded-full font-bold uppercase tracking-widest text-sm" style={{ boxShadow: '0 20px 40px rgba(228,140,60,0.35)' }}>
            Explore Menu
          </button>
        </div>
      </div>
    </section>

    {/* Trust Bar */}
    <section className="border-b py-6" style={{ background: '#fff8f0', borderColor: 'var(--c-border)' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex items-center gap-4">
          <div className="flex gap-1 text-xl" style={{ color: 'var(--c-caramel)' }}>
            <span>★</span><span>★</span><span>★</span><span>★</span><span style={{ color: 'var(--c-stone)' }}>★</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg" style={{ color: 'var(--c-dark)' }}>4/5 Rating</span>
            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--c-text-muted)' }}>Based on 379 Google Reviews</span>
          </div>
        </div>
        <div className="h-10 w-px hidden md:block" style={{ background: 'var(--c-border)' }}></div>
        <div className="flex flex-col items-center md:items-start">
          <h4 className="serif italic text-2xl" style={{ color: 'var(--c-dark)' }}>High Quality Pastries and Desserts</h4>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: 'var(--c-caramel)' }}>Local Favorites in Davao City</p>
        </div>
        <div className="flex gap-8 items-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/120px-Google_Maps_icon_%282020%29.svg.png" alt="Google" className="h-5 opacity-40 grayscale hover:grayscale-0 transition-all cursor-pointer" />
        </div>
      </div>
    </section>

    {/* Info Section 1 */}
    <section className="py-24 px-8 border-y" style={{ background: 'var(--c-stone)', borderColor: 'var(--c-border)' }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div className="order-2 md:order-1">
          <h3 className="text-4xl md:text-5xl font-bold mb-8 serif italic" style={{ color: 'var(--c-dark)' }}>Baking with Intention.</h3>
          <p className="text-lg leading-relaxed mb-8" style={{ color: '#7a5a3a' }}>
            <strong className="fredoka" style={{ color: 'var(--c-caramel)' }}>Cravn</strong> is a digital-first bakeshop focused on quality and convenience. We combine premium ingredients with a frictionless ordering process to provide fresh, artisan bakes that fit your daily schedule.
          </p>
          <button onClick={() => setPage('about')} aria-label="Learn more about us" className="text-xs font-bold uppercase tracking-[0.3em] pb-1 transition"
            style={{ background: 'none', border: 'none', borderBottom: '2px solid var(--c-caramel)', color: 'var(--c-caramel)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--c-dark)'; e.currentTarget.style.borderColor = 'var(--c-dark)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--c-caramel)'; e.currentTarget.style.borderColor = 'var(--c-caramel)'; }}
          >More About Us</button>
        </div>
        <div className="order-1 md:order-2 flex justify-center">
          <LazyImage src="https://github.com/HaGobbie/cravpastries/blob/main/CravnHome1.png?raw=true" className="w-full h-auto max-w-[500px] png-shadow" alt="Artisan Bakes" wrapperClassName="flex justify-center" />
        </div>
      </div>
    </section>

    {/* Info Section 2 */}
    <section className="py-24 px-8 md:px-20 border-b" style={{ background: 'var(--c-oat)', borderColor: 'var(--c-border)' }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="flex justify-center">
          <LazyImage src="https://github.com/HaGobbie/cravpastries/blob/main/CravnHome2.png?raw=true" className="w-full h-auto max-w-[500px] png-shadow" alt="Fresh Delivery" wrapperClassName="flex justify-center" />
        </div>
        <div>
          <h3 className="text-4xl md:text-5xl font-bold mb-8 serif italic" style={{ color: 'var(--c-dark)' }}>Pastries Ready Right at Your Doorstep</h3>
          <p className="text-lg leading-relaxed mb-10" style={{ color: '#7a5a3a' }}>
            Explore a curated selection of consistent, high-quality pastries and cakes. Every item is crafted for excellence and ready for pickup. We ensure your order is handled with the same care we put into baking it.
          </p>
          <button onClick={() => setPage('desserts')} aria-label="Shop all pastries" className="btn-dark px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs" style={{ boxShadow: '0 8px 24px rgba(74,44,26,0.2)' }}>
            Shop All Pastries
          </button>
        </div>
      </div>
    </section>

    {/* Booking Steps */}
    <section className="py-24 px-8" style={{ background: '#fff8f0' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold serif italic" style={{ color: 'var(--c-dark)' }}>Quick and Easy Booking!</h3>
          <div className="caramel-rule mt-6"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {SITE_DATA.bookingSteps.map(({ img, step, label, desc }) => (
            <div key={step} className="text-center group">
              <LazyImage src={img} className="h-40 w-auto png-shadow group-hover:scale-105 transition-transform duration-500" alt={label} wrapperClassName="flex justify-center mb-6" />
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ background: 'var(--c-caramel)' }}>{step}</span>
                <h4 className="text-xl font-bold" style={{ color: 'var(--c-dark)' }}>{label}</h4>
              </div>
              <p className="text-sm leading-relaxed px-4" style={{ color: 'var(--c-text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Quality Assurance */}
    <section className="py-24 px-8 overflow-hidden" style={{ background: 'var(--c-cream)', borderTop: '1px solid var(--c-border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-bold serif italic mb-4" style={{ color: 'var(--c-dark)' }}>Quality You Can Trust: Guaranteed Fresh!</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>We maintain high standards across all our processes to ensure your satisfaction every time you order.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {SITE_DATA.qualityCards.map((item, i) => (
            <div key={i} className="flan-card p-8 flex flex-col items-center text-center group" style={{ boxShadow: '0 1px 8px rgba(193,130,55,0.08)' }}>
              <LazyImage src={item.img} className="h-32 w-auto png-shadow group-hover:scale-105 transition-transform" alt={item.title} wrapperClassName="mb-6" />
              <h4 className="text-xl font-bold mb-3 serif italic" style={{ color: 'var(--c-dark)' }}>{item.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default Home;
