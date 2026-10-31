import { CategoryType, Profile, Goal, Transaction } from '../types';

export const MERCHANT_DOMAIN_MAP: Record<string, string> = {
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  uber: 'uber.com',
  ola: 'olacabs.com',
  netflix: 'netflix.com',
  spotify: 'spotify.com',
  amazon: 'amazon.in',
  flipkart: 'flipkart.com',
  bigbasket: 'bigbasket.com',
  blinkit: 'blinkit.com',
  zepto: 'zepto.com',
  jio: 'jio.com',
  airtel: 'airtel.in',
  cultfit: 'cult.fit',
  'cult.fit': 'cult.fit',
  tatapower: 'tatapower.com',
  'tata power': 'tatapower.com',
  cred: 'cred.club',
  apple: 'apple.com',
  google: 'google.com',
  starbucks: 'starbucks.in',
  'blue tokai': 'bluetokaicoffee.com',
  myntra: 'myntra.com',
  makemytrip: 'makemytrip.com',
  bookmyshow: 'bookmyshow.com',
  irctc: 'irctc.co.in',
  nykaa: 'nykaa.com',
  urbancompany: 'urbancompany.com',
};

export const CATEGORIES: CategoryType[] = [
  'Food & Dining',
  'Housing & Rent',
  'Groceries',
  'Transport',
  'Shopping',
  'Subscriptions & Media',
  'Bills & Utilities',
  'Health & Fitness',
  'Travel',
  'Investments & Savings',
  'Uncategorized',
  'Other',
];

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  'Food & Dining': '#C8F03C',
  'Housing & Rent': '#2FB4E8',
  Groceries: '#6BE3A0',
  Transport: '#FFB800',
  Shopping: '#F087FF',
  'Subscriptions & Media': '#A78BFA',
  'Bills & Utilities': '#38BDF8',
  'Health & Fitness': '#4ADE80',
  Travel: '#FB923C',
  'Investments & Savings': '#34D399',
  Uncategorized: '#FF7A59',
  Other: '#94A3B8',
};

export const SAMPLE_BANK_SMS: string[] = [
  "HDFC Bank: Rs 450.00 debited from a/c **3421 on 28-OCT-26 to SWIGGY. Bal: Rs 34,250.00. Not you? Call 18002583838",
  "Sent Rs.22,000.00 from HDFC Bank A/c *3421 to UPI-RAHUL KUMAR-9876@ybl on 01-OCT-26. Ref: 627192849182",
  "ICICI Bank: Acct XX892 debited for INR 649.00 on 14-OCT-26 by NETFLIX INDIA. UPI Ref 382910482910",
  "SBI: INR 380.00 debited from A/C *5541 at ZOMATO ORDER via UPI on 29-OCT-26. Avail Bal: Rs 28,140.00",
  "Axis Bank: Rs 1,750.00 spent on your Card ending 1092 at CULT FIT HEALTH on 05-OCT-26. Avail Limit: Rs 82,000",
  "HDFC Bank: Rs 2,499.00 debited from a/c **3421 on 24-OCT-26 to AMAZON INDIA. Bal: Rs 29,840.00",
  "Sent Rs.4,500.00 from HDFC Bank A/c *3421 to UPI-ANITA SHARMA-5432@okaxis on 02-OCT-26. Ref: 839201948271",
  "Paid Rs.340.00 to UBER RIDES via Paytm UPI on 27-OCT-26 09:42 AM. Ref no 503928172910",
  "ICICI Bank: Acct XX892 debited for INR 1,120.00 on 22-OCT-26 by BIGBASKET. UPI Ref 928401928401",
  "SBI: INR 999.00 debited from A/C *5541 for JIO FIBRE BILL on 10-OCT-26. Avail Bal: Rs 31,450.00",
  "HDFC Bank: Rs 119.00 debited from a/c **3421 on 18-OCT-26 to SPOTIFY INDIA. Bal: Rs 27,820.00",
  "Axis Bank: Rs 1,850.00 debited on 12-OCT-26 for TATA POWER ELECTRICITY. Ref: 2840192840",
  "Paid Rs.280.00 to BLUE TOKAI COFFEE via GPay on 26-OCT-26. UPI Ref 19284019284",
  "HDFC Bank: Rs 680.00 debited from a/c **3421 on 21-OCT-26 to BLINKIT GROCERY. Bal: Rs 25,600.00",
  "Sent Rs.520.00 to ZEPTO QUICK via PhonePe UPI on 25-OCT-26. Ref no 729104829102"
];

export const INITIAL_PROFILE: Profile = {
  name: 'Aryan',
  monthlySalary: 60000,
  emergencyFundAmount: 150000,
  payDay: 1,
  currency: 'INR',
  hasOnboarded: true,
  fixedCosts: [
    { id: 'fc-1', name: 'Rent (Rahul)', amount: 22000, category: 'Housing & Rent', dueDay: 1 },
    { id: 'fc-2', name: 'Househelp (Anita)', amount: 4500, category: 'Housing & Rent', dueDay: 2 },
    { id: 'fc-3', name: 'Cult.fit Gym', amount: 1750, category: 'Health & Fitness', dueDay: 5 },
    { id: 'fc-4', name: 'Jio Fiber', amount: 999, category: 'Bills & Utilities', dueDay: 10 },
    { id: 'fc-5', name: 'Tata Power Electricity', amount: 1850, category: 'Bills & Utilities', dueDay: 12 },
    { id: 'fc-6', name: 'Netflix', amount: 649, category: 'Subscriptions & Media', dueDay: 14 },
    { id: 'fc-7', name: 'Spotify Premium', amount: 119, category: 'Subscriptions & Media', dueDay: 18 },
  ],
};

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-goa',
    title: 'Goa Trip with Friends',
    targetAmount: 80000,
    currentAmount: 32000,
    deadline: '2027-03-31',
    category: 'Travel',
    createdAt: '2026-08-01',
  },
  {
    id: 'goal-emergency',
    title: '6-Month Emergency Runway',
    targetAmount: 200000,
    currentAmount: 150000,
    deadline: '2027-06-30',
    category: 'Investments & Savings',
    createdAt: '2026-07-01',
  },
];

// Helper to generate 90 days of transactions ending near 2026-10-31
export function generateSampleTransactions(): Transaction[] {
  const list: Transaction[] = [];

  // Helper date function
  const getDate = (daysAgo: number): string => {
    const d = new Date(2026, 9, 31); // 31 Oct 2026
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // Salary credits (Aug 1, Sep 1, Oct 1)
  list.push({
    id: 'tx-sal-oct',
    date: '2026-10-01',
    amount: 60000,
    merchant: 'Salary Credit - TechCorp',
    normalizedMerchant: 'techcorp salary',
    category: 'Investments & Savings',
    type: 'credit',
    status: 'confirmed',
    confidence: 1,
  });
  list.push({
    id: 'tx-sal-sep',
    date: '2026-09-01',
    amount: 60000,
    merchant: 'Salary Credit - TechCorp',
    normalizedMerchant: 'techcorp salary',
    category: 'Investments & Savings',
    type: 'credit',
    status: 'confirmed',
    confidence: 1,
  });
  list.push({
    id: 'tx-sal-aug',
    date: '2026-08-01',
    amount: 60000,
    merchant: 'Salary Credit - TechCorp',
    normalizedMerchant: 'techcorp salary',
    category: 'Investments & Savings',
    type: 'credit',
    status: 'confirmed',
    confidence: 1,
  });

  // Messy UPI references that start Uncategorized to demo the correction loop
  list.push({
    id: 'tx-uncat-1',
    date: '2026-10-01',
    amount: 22000,
    merchant: 'UPI-RAHUL KUMAR-9876@ybl',
    normalizedMerchant: 'rahul kumar',
    category: 'Uncategorized',
    confidence: 0.45,
    rawText: 'Sent Rs.22,000.00 from HDFC Bank to UPI-RAHUL KUMAR-9876@ybl',
    note: 'Landlord monthly rent transfer',
    status: 'confirmed',
  });
  list.push({
    id: 'tx-uncat-2',
    date: '2026-09-01',
    amount: 22000,
    merchant: 'UPI-RAHUL KUMAR-9876@ybl',
    normalizedMerchant: 'rahul kumar',
    category: 'Uncategorized',
    confidence: 0.45,
    rawText: 'Sent Rs.22,000.00 to UPI-RAHUL KUMAR-9876@ybl Ref: 512938491029',
    status: 'confirmed',
  });
  list.push({
    id: 'tx-uncat-3',
    date: '2026-08-01',
    amount: 22000,
    merchant: 'UPI-RAHUL KUMAR-9876@ybl',
    normalizedMerchant: 'rahul kumar',
    category: 'Uncategorized',
    confidence: 0.45,
    rawText: 'UPI-RAHUL KUMAR-9876@ybl Rs.22,000 rent payment',
    status: 'confirmed',
  });

  // Househelp / Cook UPI
  list.push({
    id: 'tx-uncat-anita-1',
    date: '2026-10-02',
    amount: 4500,
    merchant: 'UPI-ANITA SHARMA-5432@okaxis',
    normalizedMerchant: 'anita sharma',
    category: 'Uncategorized',
    confidence: 0.5,
    rawText: 'Sent Rs.4,500.00 to UPI-ANITA SHARMA-5432@okaxis',
    note: 'Househelp salary',
    status: 'confirmed',
  });
  list.push({
    id: 'tx-uncat-anita-2',
    date: '2026-09-02',
    amount: 4500,
    merchant: 'UPI-ANITA SHARMA-5432@okaxis',
    normalizedMerchant: 'anita sharma',
    category: 'Uncategorized',
    confidence: 0.5,
    status: 'confirmed',
  });

  // Netflix with price hike (₹499 -> ₹649)
  list.push({
    id: 'tx-netflix-oct',
    date: '2026-10-14',
    amount: 649,
    previousAmount: 499,
    isPriceHike: true,
    isRecurring: true,
    merchant: 'Netflix',
    normalizedMerchant: 'netflix',
    category: 'Subscriptions & Media',
    confidence: 0.99,
    status: 'confirmed',
  });
  list.push({
    id: 'tx-netflix-sep',
    date: '2026-09-14',
    amount: 499,
    isRecurring: true,
    merchant: 'Netflix',
    normalizedMerchant: 'netflix',
    category: 'Subscriptions & Media',
    confidence: 0.99,
    status: 'confirmed',
  });
  list.push({
    id: 'tx-netflix-aug',
    date: '2026-08-14',
    amount: 499,
    isRecurring: true,
    merchant: 'Netflix',
    normalizedMerchant: 'netflix',
    category: 'Subscriptions & Media',
    confidence: 0.99,
    status: 'confirmed',
  });

  // Spotify
  ['2026-10-18', '2026-09-18', '2026-08-18'].forEach((date, i) => {
    list.push({
      id: `tx-spotify-${i}`,
      date,
      amount: 119,
      isRecurring: true,
      merchant: 'Spotify',
      normalizedMerchant: 'spotify',
      category: 'Subscriptions & Media',
      confidence: 0.99,
      status: 'confirmed',
    });
  });

  // Cult.fit gym
  ['2026-10-05', '2026-09-05', '2026-08-05'].forEach((date, i) => {
    list.push({
      id: `tx-cult-${i}`,
      date,
      amount: 1750,
      isRecurring: true,
      merchant: 'Cult.fit',
      normalizedMerchant: 'cultfit',
      category: 'Health & Fitness',
      confidence: 0.98,
      status: 'confirmed',
    });
  });

  // Jio Fiber
  ['2026-10-10', '2026-09-10', '2026-08-10'].forEach((date, i) => {
    list.push({
      id: `tx-jio-${i}`,
      date,
      amount: 999,
      isRecurring: true,
      merchant: 'Jio',
      normalizedMerchant: 'jio',
      category: 'Bills & Utilities',
      confidence: 0.95,
      status: 'confirmed',
    });
  });

  // Tata Power Electricity
  ['2026-10-12', '2026-09-12', '2026-08-12'].forEach((date, i) => {
    list.push({
      id: `tx-tata-${i}`,
      date,
      amount: 1850 + (i * 80),
      isRecurring: true,
      merchant: 'Tata Power',
      normalizedMerchant: 'tata power',
      category: 'Bills & Utilities',
      confidence: 0.95,
      status: 'confirmed',
    });
  });

  // Variable transactions (Swiggy, Zomato, Uber, Amazon, BigBasket, Zepto, Blinkit, Blue Tokai, etc.)
  const variableData = [
    { daysAgo: 1, amount: 450, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 2, amount: 380, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    { daysAgo: 3, amount: 340, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 4, amount: 2499, merchant: 'Amazon', category: 'Shopping' as CategoryType },
    { daysAgo: 5, amount: 520, merchant: 'Zepto', category: 'Groceries' as CategoryType },
    { daysAgo: 6, amount: 280, merchant: 'Blue Tokai', category: 'Food & Dining' as CategoryType },
    { daysAgo: 7, amount: 680, merchant: 'Blinkit', category: 'Groceries' as CategoryType },
    { daysAgo: 8, amount: 1120, merchant: 'BigBasket', category: 'Groceries' as CategoryType },
    { daysAgo: 9, amount: 490, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 11, amount: 220, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 12, amount: 650, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    { daysAgo: 13, amount: 1850, merchant: 'Myntra', category: 'Shopping' as CategoryType },
    { daysAgo: 15, amount: 390, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 16, amount: 840, merchant: 'BigBasket', category: 'Groceries' as CategoryType },
    { daysAgo: 17, amount: 410, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 19, amount: 550, merchant: 'Starbucks', category: 'Food & Dining' as CategoryType },
    { daysAgo: 20, amount: 920, merchant: 'Blinkit', category: 'Groceries' as CategoryType },
    { daysAgo: 22, amount: 780, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 23, amount: 310, merchant: 'Ola', category: 'Transport' as CategoryType },
    { daysAgo: 24, amount: 1200, merchant: 'BookMyShow', category: 'Subscriptions & Media' as CategoryType },
    { daysAgo: 25, amount: 430, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    // September transactions
    { daysAgo: 32, amount: 420, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 34, amount: 360, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 36, amount: 1450, merchant: 'BigBasket', category: 'Groceries' as CategoryType },
    { daysAgo: 38, amount: 580, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    { daysAgo: 40, amount: 3200, merchant: 'Amazon', category: 'Shopping' as CategoryType },
    { daysAgo: 43, amount: 480, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 46, amount: 720, merchant: 'Zepto', category: 'Groceries' as CategoryType },
    { daysAgo: 49, amount: 260, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 52, amount: 890, merchant: 'BigBasket', category: 'Groceries' as CategoryType },
    { daysAgo: 55, amount: 620, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    // August transactions
    { daysAgo: 63, amount: 440, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 66, amount: 1600, merchant: 'BigBasket', category: 'Groceries' as CategoryType },
    { daysAgo: 69, amount: 290, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 72, amount: 510, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
    { daysAgo: 75, amount: 2100, merchant: 'Amazon', category: 'Shopping' as CategoryType },
    { daysAgo: 78, amount: 460, merchant: 'Swiggy', category: 'Food & Dining' as CategoryType },
    { daysAgo: 82, amount: 750, merchant: 'Blinkit', category: 'Groceries' as CategoryType },
    { daysAgo: 86, amount: 330, merchant: 'Uber', category: 'Transport' as CategoryType },
    { daysAgo: 88, amount: 540, merchant: 'Zomato', category: 'Food & Dining' as CategoryType },
  ];

  variableData.forEach((v, index) => {
    list.push({
      id: `tx-var-${index}`,
      date: getDate(v.daysAgo),
      amount: v.amount,
      merchant: v.merchant,
      normalizedMerchant: v.merchant.toLowerCase().replace(/[^a-z0-9]/g, ''),
      category: v.category,
      confidence: 0.95,
      status: 'confirmed',
    });
  });

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
