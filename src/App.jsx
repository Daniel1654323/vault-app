import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TRANSLATIONS } from './translations';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- לוגיקת התחברות חברתית (Google / Apple) ---
  const handleSocialLogin = async (provider) => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: { 
        redirectTo: window.location.origin 
      }
    });
    if (error) {
      setAuthError('שגיאה בהתחברות: ' + error.message);
    }
  };

  const [transactions, setTransactions] = useState([]);
  
  // שפת ממשק
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('vault_lang') || 'he';
  });

  const t = TRANSLATIONS[language] || TRANSLATIONS.he;

  // --- אמצעי תשלום דינמיים לפי שפה ---
  const PAYMENT_METHODS = [
    { id: 'credit_card', name: t.paymentMethods?.credit_card || 'כרטיס אשראי', icon: '💳' },
    { id: 'bit', name: t.paymentMethods?.bit || 'Bit', icon: '📱' },
    { id: 'paypal', name: t.paymentMethods?.paypal || 'PayPal', icon: '🅿️' },
    { id: 'cash', name: t.paymentMethods?.cash || 'מזומן', icon: '💵' },
    { id: 'bank_transfer', name: t.paymentMethods?.bank_transfer || 'העברה בנקאית', icon: '🏦' },
    { id: 'other', name: t.paymentMethods?.other || 'אחר', icon: '🔄' }
  ];

  const getInitialCategories = (currentT) => [
    { id: 'food', name: currentT.categories?.food || 'אוכל וקניות', icon: '🛒', budget: 2000 },
    { id: 'bills', name: currentT.categories?.bills || 'חשבונות ודיור', icon: '🏠', budget: 4000 },
    { id: 'transport', name: currentT.categories?.transport || 'תחבורה ודלק', icon: '🚗', budget: 1000 },
    { id: 'entertainment', name: currentT.categories?.entertainment || 'בילויים ופנאי', icon: '🎬', budget: 800 },
    { id: 'salary', name: currentT.categories?.salary || 'משכורת והכנסה', icon: '💰', budget: 0 },
    { id: 'general', name: currentT.categories?.general || 'כללי', icon: '📦', budget: 500 }
  ];

  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('vault_custom_categories');
    const initialCats = getInitialCategories(t);
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        return parsed.map(cat => {
          const defaultCat = initialCats.find(c => c.id === cat.id);
          return defaultCat ? { ...cat, name: t.categories[cat.id] || cat.name } : cat;
        });
      } catch (e) {
        console.error(e);
      }
    }
    return initialCats;
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('vault_dark_mode') === 'true';
  });

  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('general');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [isRecurring, setIsRecurring] = useState(false);
  const [transDate, setTransDate] = useState(new Date().toISOString().slice(0, 10));

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatBudget, setNewCatBudget] = useState('');

  const [showUpdatesModal, setShowUpdatesModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('vault_dark_mode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('vault_lang', language);
    document.dir = language === 'he' ? 'rtl' : 'ltr';
    
    setCategories(prevCats => {
      const initialCats = getInitialCategories(t);
      return prevCats.map(cat => {
        const defaultCat = initialCats.find(c => c.id === cat.id);
        return defaultCat ? { ...cat, name: t.categories[cat.id] } : cat;
      });
    });
  }, [language]);

  useEffect(() => {
    localStorage.setItem('vault_custom_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (rememberMe && session) {
      await supabase.auth.setSession({ access_token: session?.access_token, refresh_token: session?.refresh_token });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('שגיאה בהתחברות: בדוק את האימייל והסיסמה');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess('נרשמת בהצלחה! כעת תוכל להתחבר.');
      setAuthMode('login');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      const formattedData = (data || []).map(t => ({
        ...t,
        text: t.desc || '',
        paymentMethod: t.payment_method || 'credit_card',
        date: t.date || new Date().toISOString().slice(0, 10),
        isRecurring: t.is_recurring || false
      }));
      setTransactions(formattedData);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!text.trim() || !amount) {
      setFormError('נא למלא תיאור וסכום');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setFormError('נא להזין סכום תקין');
      return;
    }

    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        desc: text.trim(), 
        amount: finalAmount, 
        category, 
        type, 
        payment_method: paymentMethod,
        date: transDate,
        is_recurring: isRecurring,
        user_id: session.user.id 
      }])
      .select();

    if (error) {
      console.error('Error adding transaction:', error);
      setFormError('שגיאה בשמירה במסד הנתונים: ' + error.message);
    } else if (data) {
      const newTrans = {
        ...data[0],
        text: data[0].desc || text.trim(),
        paymentMethod: data[0].payment_method || paymentMethod,
        date: data[0].date || transDate,
        isRecurring: data[0].is_recurring || isRecurring
      };
      setTransactions([newTrans, ...transactions]);
      setText('');
      setAmount('');
      setIsRecurring(false);
      setFormError('');
      setShowAddModal(false);
      setActiveTab('home');
    }
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
    } else {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = 'cat_' + Date.now();
    const newCategoryObj = {
      id: newId,
      name: newCatName.trim(),
      icon: newCatIcon || '📦',
      budget: parseFloat(newCatBudget) || 0
    };

    setCategories([...categories, newCategoryObj]);
    setCategory(newId);
    setNewCatName('');
    setNewCatIcon('🏷️');
    setNewCatBudget('');
    setShowCategoryModal(false);
  };

  const handleAddRecurringTransactions = async () => {
    const recurringItems = transactions.filter(t => t.is_recurring);
    if (recurringItems.length === 0) {
      alert('אין תנועות קבועות מוגדרות במערכת.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    for (const item of recurringItems) {
      const existsThisMonth = transactions.some(t => t.text === item.text && t.date?.slice(0, 7) === todayStr.slice(0, 7));
      if (!existsThisMonth) {
        await supabase.from('transactions').insert([{
          desc: item.text,
          amount: item.amount,
          category: item.category,
          type: item.type,
          payment_method: item.paymentMethod,
          date: todayStr,
          is_recurring: true,
          user_id: session.user.id
        }]);
      }
    }
    fetchTransactions();
    alert('התנועות הקבועות נוספו בהצלחה לחודש הנוכחי!');
  };

  if (loadingAuth) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען...</div>;
  }

  if (!session) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ background: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h1 style={{ fontSize: '24px', color: '#1e1b4b', marginBottom: '8px' }}>💰 Vault Project</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>ניהול תקציב חכם ומאובטח</p>
          </div>

          {authError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center' }}>
              {authSuccess}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '18px', color: '#1e1b4b', marginBottom: '5px' }}>התחברות לחשבון</h2>
              <input type="email" placeholder="כתובת אימייל" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="סיסמה" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                <label htmlFor="remember" style={{ cursor: 'pointer' }}>זכור אותי במכשיר זה</label>
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: '5px', padding: '12px', fontWeight: 'bold' }}>התחבר</button>
              
              <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px', color: '#64748b' }}>
                עדיין אין לך חשבון?{' '}
                <span style={{ color: '#7c3aed', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}>הירשם כאן</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '18px', color: '#1e1b4b', marginBottom: '5px' }}>יצירת חשבון חדש</h2>
              <input type="text" placeholder="שם מלא" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input type="email" placeholder="כתובת אימייל" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="בחר סיסמה" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="submit-btn" style={{ marginTop: '5px', padding: '12px', fontWeight: 'bold' }}>הירשם</button>

              <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px', color: '#64748b' }}>
                כבר יש לך חשבון?{' '}
                <span style={{ color: '#7c3aed', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>התחבר כאן</span>
              </div>
            </form>
          )}

          {/* כפתורי התחברות חברתית (Google / Apple) */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginBottom: '2px' }}>או המשך באמצעות</div>
            <button 
              type="button"
              onClick={() => handleSocialLogin('google')} 
              style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '500', color: '#1e293b' }}
            >
              🌐 התחבר עם Google
            </button>
            <button 
              type="button"
              onClick={() => handleSocialLogin('apple')} 
              style={{ padding: '10px', border: '1px solid #000', borderRadius: '8px', cursor: 'pointer', background: '#000', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '500' }}
            >
               התחבר עם Apple
            </button>
          </div>

        </div>
      </div>
    );
  }

  const userDisplayName = session.user.user_metadata?.full_name || session.user.email;

  const availableMonths = Array.from(new Set(transactions.map(t => t.date?.slice(0, 7)).filter(Boolean))).sort().reverse();

  const monthFilteredTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter(t => t.date?.slice(0, 7) === selectedMonth);

  const amounts = monthFilteredTransactions.map((t) => t.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const income = amounts.filter((item) => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
  const expense = (amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

  const finalFilteredTransactions = monthFilteredTransactions.filter(t => {
    const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPayment = selectedPaymentFilter === 'all' || t.paymentMethod === selectedPaymentFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || (t.category || 'general') === selectedCategoryFilter;
    return matchesSearch && matchesPayment && matchesCategory;
  });

  const categoryTotals = categories.map((cat) => {
    const catTotal = monthFilteredTransactions
      .filter((t) => (t.category || 'general') === cat.id && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { ...cat, total: catTotal };
  });

  return (
    <div className="app-container">
      <div className="header-bg">
        <div className="container">
          <header className="app-header">
            <div>
              <span className="greeting-sub">{t.greeting}</span>
              <h2 className="greeting-name" style={{ fontSize: '16px', fontWeight: 'bold', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userDisplayName}
              </h2>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', color: 'white', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all" style={{ color: '#333' }}>{language === 'he' ? 'כל החודשים' : 'All Months'}</option>
                {availableMonths.map(m => (
                  <option key={m} value={m} style={{ color: '#333' }}>{m}</option>
                ))}
              </select>

              <button 
                type="button" 
                onClick={() => setShowUpdatesModal(true)} 
                style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', color: 'white', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                🔔
              </button>
            </div>
          </header>

          <div className="balance-card-floating">
            <div className="balance-top-row">
              <span className="balance-label">{selectedMonth === 'all' ? t.allTime : `${t.monthBalance} ${selectedMonth}`}</span>
              <span className="dots-menu">•••</span>
            </div>
            <h1 className="balance-amount">₪{total}</h1>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-icon-wrapper income-icon">⬇</span>
                <div>
                  <span className="stat-title">{t.income}</span>
                  <p className="stat-val income">+₪{income}</p>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-icon-wrapper expense-icon">⬆</span>
                <div>
                  <span className="stat-title">{t.expense}</span>
                  <p className="stat-val expense">-₪{expense}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container main-content">
        {activeTab === 'home' && (
          <>
            <div className="section-header">
              <h3>{t.categoriesTitle}</h3>
              <button type="button" onClick={() => setShowCategoryModal(true)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                {t.addCategory}
              </button>
            </div>
            
            <div className="categories-grid">
              {categoryTotals.filter(c => c.id !== 'salary').map((cat) => {
                return (
                  <div 
                    key={cat.id} 
                    className="category-pill" 
                    onClick={() => { setSelectedCategoryFilter(cat.id); setActiveTab('analytics'); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px', color: 'var(--text-main)' }}>
                      <span>{cat.icon}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginTop: '8px', color: 'var(--text-main)' }}>
                      ₪{cat.total.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="section-header" style={{ marginTop: '24px' }}>
              <h3>{t.recentTransactions}</h3>
              <span className="see-all" onClick={() => setActiveTab('analytics')}>{t.seeAll}</span>
            </div>
            {monthFilteredTransactions.length === 0 ? (
              <p className="empty-msg">{t.noTransactions}</p>
            ) : (
              <ul className="bank-list">
                {monthFilteredTransactions.slice(0, 5).map((tItem) => {
                  const catObj = categories.find((c) => c.id === (tItem.category || 'general'));
                  const pmObj = PAYMENT_METHODS.find((p) => p.id === tItem.paymentMethod);
                  return (
                    <li key={tItem.id} className="bank-item">
                      <div className="bank-left">
                        <div className="bank-icon-bg">{catObj ? catObj.icon : '📦'}</div>
                        <div className="bank-details">
                          <span className="bank-text">
                            {tItem.text} {tItem.isRecurring && <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: '4px', marginRight: '5px' }}>{t.recurringBadge}</span>}
                          </span>
                          <span className="bank-subtext">
                            {catObj ? catObj.name : t.general} {pmObj ? `• ${pmObj.icon} ${pmObj.name}` : ''} • {tItem.date}
                          </span>
                        </div>
                      </div>
                      <div className="bank-right">
                        <span className={`bank-amount ${tItem.amount < 0 ? 'text-expense' : 'text-income'}`}>
                          {tItem.amount < 0 ? '-' : '+'}₪{Math.abs(tItem.amount).toFixed(2)}
                        </span>
                        <button onClick={() => deleteTransaction(tItem.id)} className="delete-btn">🗑️</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-view">
            <div className="history-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <h3>{t.advancedSearch}</h3>
                <button type="button" onClick={handleAddRecurringTransactions} style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                  {t.loadRecurring}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ flex: '1', minWidth: '150px', padding: '8px 12px', fontSize: '13px', margin: 0 }}
                />
                
                <select 
                  value={selectedPaymentFilter} 
                  onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                  className="input-field select-field"
                  style={{ flex: '1', minWidth: '130px', padding: '8px', fontSize: '13px', margin: 0 }}
                >
                  <option value="all">{t.allPaymentMethods}</option>
                  {PAYMENT_METHODS.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="categories-full-grid" style={{ marginTop: '15px' }}>
              {categoryTotals.map((cat) => (
                <div key={cat.id} className={`category-box-card ${selectedCategoryFilter === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat.id ? 'all' : cat.id)}>
                  <span className="cat-box-icon">{cat.icon}</span>
                  <span className="cat-box-name">{cat.name}</span>
                  <span className="cat-box-amount">₪{cat.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '15px' }}>
                {t.filterResults} ({finalFilteredTransactions.length} {t.items})
              </h3>
              {(selectedCategoryFilter !== 'all' || searchQuery || selectedPaymentFilter !== 'all') && (
                <button onClick={() => { setSelectedCategoryFilter('all'); setSearchQuery(''); setSelectedPaymentFilter('all'); }} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  {t.resetFilters}
                </button>
              )}
            </div>
            
            {finalFilteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', borderRadius: '12px', color: '#64748b', fontSize: '14px' }}>
                {t.noResults}
              </div>
            ) : (
              <ul className="bank-list">
                {finalFilteredTransactions.map((tItem) => {
                  const catObj = categories.find((c) => c.id === (tItem.category || 'general'));
                  const pmObj = PAYMENT_METHODS.find((p) => p.id === tItem.paymentMethod);
                  return (
                    <li key={tItem.id} className="bank-item">
                      <div className="bank-left">
                        <div className="bank-icon-bg">{catObj ? catObj.icon : '📦'}</div>
                        <div className="bank-details">
                          <span className="bank-text">
                            {tItem.text} {tItem.isRecurring && <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '1px 5px', borderRadius: '4px', marginRight: '5px' }}>{t.recurringBadge}</span>}
                          </span>
                          <span className="bank-subtext">
                            {catObj ? catObj.name : t.general} {pmObj ? `• ${pmObj.icon} ${pmObj.name}` : ''} • {tItem.date}
                          </span>
                        </div>
                      </div>
                      <div className="bank-right">
                        <span className={`bank-amount ${tItem.amount < 0 ? 'text-expense' : 'text-income'}`}>
                          {tItem.amount < 0 ? '-' : '+'}₪{Math.abs(tItem.amount).toFixed(2)}
                        </span>
                        <button onClick={() => deleteTransaction(tItem.id)} className="delete-btn">🗑️</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-card">
            <div className="profile-avatar-large">👤</div>
            <h2>{userDisplayName}</h2>
            <p className="profile-email">{session.user.email}</p>
            
            <div className="profile-settings-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'start' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{t.language}:</label>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field select-field"
                  style={{ width: '100%', padding: '10px', fontSize: '14px', margin: 0 }}
                >
                  <option value="he">🇮🇱 עברית</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="ru">🇷🇺 Русский</option>
                </select>
              </div>

              <button type="button" onClick={() => setDarkMode(!darkMode)} style={{ width: '100%', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                {darkMode ? `☀️ ${t.lightMode}` : `🌙 ${t.darkMode}`}
              </button>

              <button type="button" onClick={handleLogout} style={{ width: '100%', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                🚪 {t.logout}
              </button>
            </div>
          </div>
        )}
      </div>

      {showUpdatesModal && (
        <div className="modal-overlay" onClick={() => setShowUpdatesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>{t.updatesTitle}</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowUpdatesModal(false)}>✕</button>
            </div>
            <div style={{ padding: '10px 0', fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: '#7c3aed' }}>שדרוגים חדשים במערכת:</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                  • 🌍 <strong>החלפת שפות:</strong> תמיכה מלאה בעברית, אנגלית, ספרדית ורוסית כולל שמות הקטגוריות ואמצעי התשלום.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.addTransactionTitle}</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            {formError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={addTransaction} className="form-group">
              <input type="text" className="input-field" placeholder={t.descPlaceholder} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
              <input type="number" step="any" className="input-field" placeholder={t.amountPlaceholder} value={amount} onChange={(e) => setAmount(e.target.value)} />

              <div className="radio-group">
                <button type="button" className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`} onClick={() => setType('expense')}>{t.expenseBtn}</button>
                <button type="button" className={`type-btn ${type === 'income' ? 'active-income' : ''}`} onClick={() => setType('income')}>{t.incomeBtn}</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500' }}>{t.transDateLabel}</label>
                <input type="date" className="input-field" value={transDate} onChange={(e) => setTransDate(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500' }}>{t.categoryLabel}</label>
                <select className="input-field select-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500' }}>{t.paymentMethodLabel}</label>
                <select className="input-field select-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginTop: '5px' }}>
                <input type="checkbox" id="recurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                <label htmlFor="recurring" style={{ cursor: 'pointer' }}>{t.recurringCheckbox}</label>
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: '10px' }}>{t.saveAction}</button>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t.newCategoryTitle}</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="form-group">
              <input type="text" className="input-field" placeholder={t.catNamePlaceholder} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} autoFocus required />
              <input type="text" className="input-field" placeholder={t.catIconPlaceholder} value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} maxLength={4} />
              <input type="number" className="input-field" placeholder={t.catBudgetPlaceholder} value={newCatBudget} onChange={(e) => setNewCatBudget(e.target.value)} />
              <button type="submit" className="submit-btn">{t.createCatBtn}</button>
            </form>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button type="button" className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span className="nav-text">{t.profile}</span>
        </button>

        <button 
          type="button" 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} 
          onClick={() => {
            setSelectedCategoryFilter('all');
            setActiveTab('analytics');
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          <span className="nav-text">{t.wallet}</span>
        </button>

        <div className="nav-center-btn-wrapper">
          <button type="button" className="center-add-btn" onClick={() => { setFormError(''); setShowAddModal(true); }}>+</button>
        </div>

        <button type="button" className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span className="nav-text">{t.analytics}</span>
        </button>

        <button type="button" className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span className="nav-text">{t.home}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
