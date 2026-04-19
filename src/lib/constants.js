export const LOGO_URL = 'https://github.com/HaGobbie/cravpastries/blob/main/CravnLogoCroppedOfficial.png?raw=true';

export const ADMIN_CONFIG = {
  nav: [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'orders',    label: 'Orders',    icon: 'orders'    },
    { key: 'desserts',  label: 'Desserts',  icon: 'desserts'  },
    { key: 'inventory', label: 'Inventory', icon: 'inventory' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics' }, // ← new
  ],
  statCards: (stats, fmt) => [
    { label: 'Total Orders',    value: stats.totalOrders,       icon: 'orders',   color: '#dbeafe', icolor: '#1d4ed8', trend: null },
    { label: 'Pending Orders',  value: stats.pendingOrders,     icon: 'clock',    color: '#fef3c7', icolor: '#b45309', trend: stats.pendingOrders > 0 ? 'warn' : 'up' },
    { label: 'Desserts Listed', value: stats.totalDesserts,     icon: 'desserts', color: '#dcfce7', icolor: '#15803d', trend: 'up'  },
    { label: 'Total Revenue',   value: fmt(stats.totalRevenue), icon: 'peso',     color: '#f3e8ff', icolor: '#7c3aed', trend: 'up'  },
  ],
  orderTableHeaders: ['Order ID', 'Customer', 'Phone', 'Pickup', 'Total', 'Status', 'Payment', 'GCash Ref', 'Date', ''],
  inventoryHeaders:  ['Dessert', 'Category', 'Status', 'Current Stock', 'Last Updated', 'Actions'],
  dessertCategories: ['cakes'],
  statusLabels: { pending: 'Pending', confirmed: 'Confirmed', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' },
  statusNext:   { pending: 'confirmed', confirmed: 'ready', ready: 'completed' },
  payLabels:    { pending: 'Unpaid', paid: 'Paid', failed: 'Failed' },
};

export const SITE_DATA = {
  team: [
    { name: 'Ren San Pedro',  role: 'The Operations Lead',  desc: 'The engine of Cravn, dedicated to providing a seamless experience and making sure our community feels right at home.', img: 'https://github.com/HaGobbie/cravpastries/blob/main/Person1Ren.png?raw=true' },
    { name: 'Jen Dela Cruz',  role: 'The Head Artisan',      desc: 'The creative force behind our recipes, ensuring every pastry meets our high standards of flavor and texture.',          img: 'https://github.com/HaGobbie/cravpastries/blob/main/Person2Jen.png?raw=true' },
    { name: 'Retchie Lopez',  role: 'The Creative Director', desc: 'The curator of the Cravn vibe, focusing on the design, aesthetic, and innovation that make our bakery unique.',         img: 'https://github.com/HaGobbie/cravpastries/blob/main/Person3Retch.png?raw=true' },
  ],
  galleryImages: [
    'https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUs1.png?raw=true',
    'https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUs2.png?raw=true',
    'https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUs3.png?raw=true',
    'https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUs4.png?raw=true',
    'https://github.com/HaGobbie/cravpastries/blob/main/CravnAboutUs5.png?raw=true',
  ],
  faqSections: [
    { title: 'General Information', items: [
      { q: 'What is Cravn?',         a: 'Cravn is a digital-first bakeshop in Davao City that specializes in high-quality, artisan cakes and pastries designed for a seamless, hassle-free ordering experience.' },
      { q: 'Where are you located?', a: 'Our flagship kitchen and pickup point is located in Catalunan Grande, Talomo, Davao City.' },
    ]},
    { title: 'Ordering & Payments', items: [
      { q: 'Do I need to create an account to order?', a: 'No. We prioritize speed and convenience, so we offer a guest checkout. You only need to provide your Full Name and Contact Number to place an order.' },
      { q: 'How do I pay for my order?',               a: 'We currently accept payments via GCash to ensure secure and instant transactions.' },
      { q: 'Is the stock shown on the website accurate?', a: 'Yes. Our system uses real-time inventory management. When an item is paid for, it is immediately deducted from our available stock.' },
    ]},
    { title: 'Pickup & Delivery', items: [
      { q: 'How do I collect my order?',        a: 'Once your GCash payment is confirmed, the website will generate a unique virtual receipt. Simply present this digital receipt at our shop during your scheduled pickup time.' },
      { q: 'Can I cancel my order?',            a: 'Orders can be managed by our Admin. If an order is canceled, the items are automatically added back to our digital inventory.' },
      { q: 'What should I bring for pickup?',   a: 'Please have your virtual receipt and the GCash Transaction ID ready for identification.' },
    ]},
    { title: 'Operating Hours', items: [
      { q: 'When is the shop open?', a: 'Our typical hours are:\n• Mon, Tue, Thu, Fri: 8:00 AM – 3:00 PM\n• Saturday: 8:00 AM – 11:00 AM\n• Wednesday & Sunday: Closed.' },
    ]},
  ],
  qualityCards: [
    { title: 'Premium Ingredients', desc: 'Using high-quality, fresh components from trusted local partners and international suppliers.',                    img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHomeDescPremiumIngredients.png?raw=true' },
    { title: 'Expertly Crafted',    desc: 'Each pastry is hand-made by skilled bakers with an obsession for detail and flavor balance.',                     img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHomeDescExpertlyCrafted.png?raw=true'   },
    { title: 'Secure Payments',     desc: 'Frictionless checkout with secure e-wallet and card options for your peace of mind.',                             img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHomeDescSecurePayment.png?raw=true'      },
  ],
  bookingSteps: [
    { img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHome3StepsSelect.png?raw=true', step: 1, label: 'Select Your Dessert', desc: 'Browse our curated menu of premium pastries and cakes.' },
    { img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHome3StepsBook.png?raw=true',   step: 2, label: 'Book Your Day',       desc: 'Choose your pickup date and checkout instantly online.' },
    { img: 'https://github.com/HaGobbie/cravpastries/blob/main/CravnHome3StepsRelax.png?raw=true',  step: 3, label: 'Pick it Up',           desc: 'Go to the shop and receive your desserts!'              },
  ],
  footerLinks: {
    hours: [
      { day: 'Mon - Fri', time: '8.00AM-3.00PM' },
      { day: 'Saturday',  time: '8.00AM-11.00AM' },
      { day: 'Sunday',    time: 'Closed', dim: true },
    ],
  },
};
