import { useState, useEffect } from 'react';
import { CartProvider } from './CartContext';
import { LoadingScreen } from './Shared';
import Navigation from './Navigation';
import Home from './Home';
import Desserts from './Desserts';
import { About, FAQs, Contact, Footer, AdminFAB } from './Pages';

const App = () => {
  const [page,      setPage]      = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) window.scrollTo(0, 0);
  }, [page, isLoading]);

  if (isLoading) return <LoadingScreen />;

  return (
    <CartProvider>
      <div className="min-h-screen selection:bg-flan-caramel selection:text-white">
        <Navigation setPage={setPage} currentPage={page} />
        {page === 'home'     && <Home setPage={setPage} />}
        {page === 'about'    && <About />}
        {page === 'desserts' && <Desserts />}
        {page === 'faqs'     && <FAQs />}
        {page === 'contact'  && <Contact />}
        <Footer />
        <AdminFAB />
      </div>
    </CartProvider>
  );
};

export default App;
