import { useState, useEffect } from 'react';
import { SITE_DATA, LOGO_URL } from '../../lib/constants';
import { LazyImage, Icon, ModalPortal, AboutSkeleton, ContactSkeleton } from './Shared';

/* ══════════════════════════════════════════
   Validation helpers
══════════════════════════════════════════ */
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const validators = {
  name:    (v) => v.trim().length >= 2    ? '' : 'Name must be at least 2 characters.',
  email:   (v) => RE_EMAIL.test(v.trim()) ? '' : 'Please enter a valid email address.',
  message: (v) => v.trim().length >= 10  ? '' : 'Message must be at least 10 characters.',
};
const FieldError = ({ msg }) =>
  msg ? (
    <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </p>
  ) : null;

/* ══════════════════════════════════════════
   About
══════════════════════════════════════════ */
export const About = () => {
  const galleryImages = SITE_DATA.galleryImages;
  const team          = SITE_DATA.team;
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 350); return () => clearTimeout(t); }, []);
  if (!ready) return <AboutSkeleton />;

  return (
    <div className="page-enter pt-24">
      <section className="px-4 py-4" style={{ background: 'var(--c-cream)' }}>
        <div className="relative h-[70vh] rounded-[40px] overflow-hidden flex items-center justify-center shadow-2xl">
          <LazyImage
            src="https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUsFirstImage.png?raw=true"
            className="absolute inset-0 w-full h-full object-cover"
            alt="About Crav'n"
            wrapperStyle={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }}
          />
        </div>
      </section>

      <section className="py-24 px-8" style={{ background: '#fff8f0' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
          <div className="sticky top-40">
            <span className="text-[10px] uppercase tracking-[0.4em] font-black mb-4 block" style={{ color: 'var(--c-caramel)' }}>High Quality Pastries and Desserts</span>
            <h2 className="text-4xl md:text-6xl font-bold serif italic mb-10 leading-tight" style={{ color: 'var(--c-dark)' }}>From Digital Vision<br />to Local Landmark</h2>
            <div className="space-y-6 text-lg leading-relaxed" style={{ color: '#7a5a3a' }}>
              <p><strong style={{ color: 'var(--c-dark)' }}>Cravn</strong> was born from a simple idea: premium baking shouldn't be a hassle. We set out to redefine the bakeshop experience by blending artisanal Filipino flavors with a frictionless, digital-first ordering process.</p>
              <p>Our journey reached its peak in 2026 with the completion of our flagship kitchen in <strong style={{ color: 'var(--c-caramel)' }}>Catalunan Grande, Davao City</strong>. Today, this modern space serves as the heart of our operations, where every recipe is tested and every loaf is baked fresh daily.</p>
              <p>Whether it's a daily pastry or a custom celebration cake, we are dedicated to delivering fresh, consistent bakes straight to your door, exactly on your schedule.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {galleryImages.map((img, idx) => (
              <div key={idx} className={`group relative overflow-hidden shadow-sm hover:-translate-y-2 transition-all duration-500 ${idx === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`} style={{ borderRadius: '24px', boxShadow: '0 2px 12px rgba(193,130,55,0.12)' }}>
                <LazyImage src={img} alt="Store Gallery" className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" wrapperClassName="w-full h-full" wrapperStyle={{ borderRadius: 'inherit' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-8 border-y" style={{ background: 'var(--c-cream)', borderColor: 'var(--c-border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[10px] uppercase tracking-[0.5em] font-black mb-4 block" style={{ color: 'var(--c-caramel)' }}>Our People</span>
            <h2 className="text-5xl md:text-6xl font-bold serif italic mb-8" style={{ color: 'var(--c-dark)' }}>Meet Our Team</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--c-text-muted)' }}>Our dedicated team of pastry enthusiasts blends precision with passion to bring you Davao's finest bakes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16">
            {team.map((person, i) => (
              <div key={i} className="group flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8 overflow-hidden rounded-full shadow-lg" style={{ border: '4px solid var(--c-custard)', background: 'var(--c-oat)' }}>
                  <LazyImage src={person.img} alt={person.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" wrapperClassName="w-full h-full" wrapperStyle={{ borderRadius: '9999px' }} />
                </div>
                <div className="text-center px-4">
                  <h4 className="text-2xl font-bold mb-1 serif italic" style={{ color: 'var(--c-dark)' }}>{person.name}</h4>
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black mb-4" style={{ color: 'var(--c-caramel)' }}>{person.role}</p>
                  <p className="text-sm leading-relaxed italic" style={{ color: 'var(--c-text-muted)' }}>"{person.desc}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ══════════════════════════════════════════
   FAQs
══════════════════════════════════════════ */
export const FAQs = () => (
  <div className="page-enter pt-40 pb-32" style={{ background: 'var(--c-cream)' }}>
    <div className="max-w-4xl mx-auto px-6">
      <div className="mb-16 text-center">
        <span className="text-[10px] uppercase tracking-[0.5em] font-black mb-4 block" style={{ color: 'var(--c-caramel)' }}>Help Center</span>
        <h2 className="text-5xl md:text-7xl font-bold serif italic" style={{ color: 'var(--c-dark)' }}>Frequently<br />Asked Questions</h2>
        <div className="caramel-rule mt-8"></div>
      </div>
      <div className="space-y-20">
        {SITE_DATA.faqSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs uppercase tracking-[0.3em] font-black mb-10 pb-4" style={{ color: 'var(--c-caramel)', borderBottom: '1px solid rgba(228,140,60,0.2)' }}>{section.title}</h3>
            <div className="space-y-12">
              {section.items.map((item, i) => (
                <div key={i} className="group">
                  <h4 className="text-xl md:text-2xl font-bold mb-4 serif italic leading-tight" style={{ color: 'var(--c-dark)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-caramel)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-dark)')}
                  >{item.q}</h4>
                  <div className="leading-relaxed text-lg whitespace-pre-line" style={{ color: 'var(--c-text-muted)' }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   Contact
══════════════════════════════════════════ */
export const Contact = () => {
  const [emailModal, setEmailModal] = useState(false);
  const [form,       setForm]       = useState({ name: '', email: '', message: '' });
  const [errors,     setErrors]     = useState({ name: '', email: '', message: '' });
  const [touched,    setTouched]    = useState({ name: false, email: false, message: false });
  const [sent,       setSent]       = useState(false);
  const [sending,    setSending]    = useState(false);
  const [ready,      setReady]      = useState(false);

  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validators[field](value) }));
  };
  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validators[field](form[field]) }));
  };
  const isValid = () => Object.keys(validators).every((k) => validators[k](form[k]) === '');

  const handleSend = () => {
    setTouched({ name: true, email: true, message: true });
    const ne = { name: validators.name(form.name), email: validators.email(form.email), message: validators.message(form.message) };
    setErrors(ne);
    if (Object.values(ne).some(Boolean)) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };
  const closeModal = () => {
    setEmailModal(false);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', message: '' });
      setErrors({ name: '', email: '', message: '' });
      setTouched({ name: false, email: false, message: false });
    }, 300);
  };

  const inputStyle = (field) => ({
    background: 'var(--c-oat)',
    border: `1.5px solid ${touched[field] && errors[field] ? '#dc2626' : touched[field] && !errors[field] ? '#15803d' : 'var(--c-border)'}`,
    transition: 'border-color 0.2s',
  });

  const hours = [
    { day: 'Monday',    time: '08:00 - 15:00' },
    { day: 'Tuesday',   time: '08:00 - 15:00' },
    { day: 'Wednesday', time: 'Closed', special: true },
    { day: 'Thursday',  time: '08:00 - 15:00' },
    { day: 'Friday',    time: '08:00 - 15:00' },
    { day: 'Saturday',  time: '08:00 - 11:00' },
    { day: 'Sunday',    time: 'Closed', special: true },
  ];

  if (!ready) return <ContactSkeleton />;

  return (
    <div className="page-enter pt-24">
      <section className="px-4 py-4" style={{ background: 'var(--c-cream)' }}>
        <div className="relative h-[70vh] rounded-[40px] overflow-hidden flex items-center justify-center shadow-2xl">
          <LazyImage
            src="https://github.com/HaGobbie/cravpastries/blob/main/CravnContactsHero.jpg?raw=true"
            className="absolute inset-0 w-full h-full object-cover"
            alt="Contact Crav'n"
            wrapperStyle={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }}
          />
        </div>
      </section>
      <section className="py-24 px-8" style={{ background: '#fff8f0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-8xl font-bold serif italic tracking-tight" style={{ color: 'var(--c-dark)' }}>Contact Us</h2>
            <div className="caramel-rule mt-8"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-20 items-stretch">
            <div className="flex flex-col h-full rounded-[40px] p-12" style={{ background: 'var(--c-stone)', border: '1px solid var(--c-border)' }}>
              <div className="mb-12">
                <h3 className="text-3xl font-bold serif italic mb-6" style={{ color: 'var(--c-dark)' }}>Location and Hours</h3>
                <div className="flex items-start gap-4 mb-8">
                  <div className="p-2 rounded-lg text-white" style={{ background: 'var(--c-caramel)' }}><Icon name="pin" size={20} stroke="white" /></div>
                  <p className="text-xl leading-relaxed font-medium" style={{ color: 'var(--c-text-muted)' }}>Catalunan Grande, Talomo,<br />Davao City, Davao del Sur</p>
                </div>
              </div>
              <div className="space-y-4">
                {hours.map((h, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b last:border-0" style={{ borderColor: 'var(--c-border)', opacity: h.special ? 0.5 : 1 }}>
                    <span className="font-bold" style={{ color: 'var(--c-dark)' }}>{h.day}</span>
                    <span className="font-medium" style={{ color: h.special ? 'var(--c-text-muted)' : 'var(--c-caramel)' }}>{h.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-12 flex gap-4">
                <button aria-label="Call us" className="btn-caramel flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Call Us</button>
                <button aria-label="Email us" className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                  style={{ background: 'none', border: '2px solid var(--c-border)', color: 'var(--c-text-muted)', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-caramel)'; e.currentTarget.style.color = 'var(--c-caramel)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
                  onClick={() => setEmailModal(true)}
                >Email Us</button>
              </div>
            </div>
            <div className="rounded-[40px] overflow-hidden shadow-2xl h-full min-h-[500px]" style={{ border: '4px solid var(--c-custard)' }}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d501.3170279951759!2d125.5423324481462!3d7.081216986211794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zN8KwMDQnNTIuNyJOIDEyNcKwMzInMzIuOSJF!5e0!3m2!1sen!2sph!4v1771847437304!5m2!1sen!2sph" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-full"></iframe>
            </div>
          </div>
        </div>
      </section>

      {emailModal && (
        <ModalPortal>
          <div className="modal-portal-backdrop" onClick={closeModal}>
            <div style={{ background: 'var(--c-cream)', borderRadius: 32, border: '1px solid var(--c-border)', boxShadow: '0 24px 64px rgba(43,24,13,0.35)', width: '100%', maxWidth: 480, padding: '32px', animation: 'slideUpIn 0.3s ease-out' }}
              onClick={(e) => e.stopPropagation()}>
              {!sent ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                      <p style={{ fontWeight: 900, fontSize: 20, color: 'var(--c-dark)', fontFamily: "'Playfair Display',serif", fontStyle: 'italic' }}>Send Us a Message</p>
                      <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>We'll get back to you as soon as possible.</p>
                    </div>
                    <button aria-label="Close" onClick={closeModal} style={{ background: 'var(--c-oat)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', flexShrink: 0 }}>
                      <Icon name="close" size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>Your Name *</label>
                      <input className="cravn-input" type="text" placeholder="e.g. Maria Santos" value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')}
                        aria-label="Your name" style={inputStyle('name')} />
                      <FieldError msg={touched.name && errors.name} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>Email Address *</label>
                      <input className="cravn-input" type="email" placeholder="e.g. maria@email.com" value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')}
                        aria-label="Your email address" style={inputStyle('email')} />
                      <FieldError msg={touched.email && errors.email} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-text-muted)', display: 'block', marginBottom: 6 }}>
                        Message * <span style={{ opacity: 0.5 }}>({form.message.trim().length}/10 min)</span>
                      </label>
                      <textarea className="cravn-input" rows={4} placeholder="Tell us about your inquiry…" value={form.message}
                        onChange={(e) => handleChange('message', e.target.value)} onBlur={() => handleBlur('message')}
                        aria-label="Your message" style={{ ...inputStyle('message'), resize: 'vertical', minHeight: '100px' }} />
                      <FieldError msg={touched.message && errors.message} />
                    </div>
                    <button aria-label="Send message" className="btn-caramel"
                      style={{ padding: '14px', borderRadius: 16, fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending || !isValid() ? 0.7 : 1, cursor: !isValid() ? 'not-allowed' : 'pointer' }}
                      onClick={handleSend} disabled={sending}>
                      {sending
                        ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></span> Sending…</>
                        : <><Icon name="mail" size={15} stroke="white" /> Send Message</>}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,200,100,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name="check" size={28} stroke="#3db85a" strokeWidth={2.5} />
                  </div>
                  <p style={{ fontWeight: 900, fontSize: 22, color: 'var(--c-dark)', fontFamily: "'Playfair Display',serif", fontStyle: 'italic', marginBottom: 8 }}>Message Sent!</p>
                  <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>Thank you, <strong style={{ color: 'var(--c-caramel)' }}>{form.name}</strong>! We've received your message and will reply to <strong>{form.email}</strong> soon.</p>
                  <button aria-label="Close" className="btn-caramel" style={{ padding: '12px 32px', borderRadius: 14, fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={closeModal}>Close</button>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

/* ── Footer ── */
export const Footer = () => (
  <footer className="pt-16 pb-12 mt-20" style={{ background: 'var(--c-syrup)', color: 'rgba(253,245,228,0.88)', borderTop: '3px solid var(--c-caramel)' }}>
    <div className="max-w-7xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_URL} alt="Crav'n Logo" className="h-10 w-auto" style={{ filter: 'drop-shadow(0 2px 8px rgba(253,245,228,0.25))', opacity: 0.92 }} />
            <span className="fredoka text-2xl tracking-tight" style={{ color: 'var(--c-caramel)' }}>Cravn</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs italic serif" style={{ color: 'rgba(253,245,228,0.45)' }}>Artisan pastries and premium cakes delivered fresh.</p>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6" style={{ color: 'var(--c-caramel)' }}>Hours</h4>
          <ul className="space-y-3 text-sm" style={{ color: 'rgba(253,245,228,0.6)' }}>
            {SITE_DATA.footerLinks.hours.map((h, i) => (
              <li key={i} className="flex justify-between"><span>{h.day}</span><span style={{ color: h.dim ? 'rgba(255,255,255,0.3)' : '#fff' }}>{h.time}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6" style={{ color: 'var(--c-caramel)' }}>Connect</h4>
          <div className="space-y-6" style={{ color: 'rgba(253,245,228,0.6)', fontSize: '14px' }}>
            <div><p className="text-[10px] uppercase font-bold mb-2" style={{ opacity: 0.4 }}>Social Media</p><a href="#" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={(e) => (e.target.style.color = 'var(--c-caramel)')} onMouseLeave={(e) => (e.target.style.color = 'rgba(253,245,228,0.6)')}>Facebook</a></div>
            <div><p className="text-[10px] uppercase font-bold mb-2" style={{ opacity: 0.4 }}>Contacts</p><div className="space-y-1"><div><a href="tel:298-3789" style={{ color: 'inherit', textDecoration: 'none' }}>298-3789</a></div><div><a href="mailto:cravnpastries@gmail.com" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>cravnpastries@gmail.com</a></div></div></div>
          </div>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6" style={{ color: 'var(--c-caramel)' }}>Visit</h4>
          <p className="text-sm leading-relaxed italic serif" style={{ color: '#fff' }}>Catalunan Grande Rd, Talomo,<br />Davao City, Davao del Sur</p>
          <div className="mt-8"><button aria-label="Get directions" className="text-[10px] uppercase font-black tracking-widest pb-1" style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--c-caramel)', color: 'var(--c-caramel)', cursor: 'pointer' }}>Get Directions</button></div>
        </div>
      </div>
      <div className="pt-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[9px] uppercase tracking-[0.4em] font-bold" style={{ opacity: 0.3 }}>&copy; 2026 DVCCravnPastriesGroup, Inc. &middot; PHILIPPINES</p>
      </div>
    </div>
  </footer>
);

export const AdminFAB = () => (
  <button className="admin-fab" aria-label="Open Admin Dashboard" onClick={() => window.open('/admin.html', '_blank')} title="Open Admin Dashboard">
    <Icon name="settings" size={12} stroke="currentColor" strokeWidth={2.5} />
    Admin
  </button>
);
