import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const CATEGORIES = [
  { id: 'food', name: 'אוכל וקניות', icon: '🛒' },
  { id: 'bills', name: 'חשבונות ודיור', icon: '🏠' },
  { id: 'transport', name: 'תחבורה ודלק', icon: '🚗' },
  { id: 'entertainment', name: 'בילויים ופנאי', icon: '🎬' },
  { id: 'salary', name: 'משכורת והכנסה', icon: '💰' },
  { id: 'general', name: 'כללי', icon: '📦' }
];

function App() {
  const [userName, setUserName] = useState('דניאל');
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('food');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!text || !amount) return;

    const numAmount = parseFloat(amount);
    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ text, amount: finalAmount, category }])
      .select();

    if (error) {
      console.error('Error adding transaction:', error);
    } else if (data) {
      setTransactions([data[0], ...transactions]);
      setText('');
      setAmount('');
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

  const amounts = transactions.map((t) => t.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const income = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);
  const expense = (
    amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) * -1
  ).toFixed(2);

  const categoryTotals = CATEGORIES.map((cat) => {
    const catTotal = transactions
      .filter((t) => (t.category || 'general') === cat.id && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { ...cat, total: catTotal };
  });

  const filteredTransactions = selectedCategoryFilter === 'all'
    ? transactions
    : transactions.filter((t) => (t.category || 'general') === selectedCategoryFilter);

  return (
    <div className="app-container">
      {/* אזור עליון עם רקע סגול */}
      <div className="header-bg">
        <div className="container">
          <header className="app-header">
            <div>
              <span className="greeting-sub">יום טוב 👋</span>
              <h2 className="greeting-name">שלום, {userName}</h2>
            </div>
            <div className="notification-bell">🔔</div>
          </header>

          {/* כרטיס יתרה מרחף */}
          <div className="balance-card-floating">
            <div className="balance-top-row">
              <span className="balance-label">יתרה בחשבון</span>
              <span className="dots-menu">•••</span>
            </div>
            <h1 className="balance-amount">₪{total}</h1>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-icon-wrapper income-icon">⬇</span>
                <div>
                  <span className="stat-title">הכנסות</span>
                  <p className="stat-val income">+₪{income}</p>
                </div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-icon-wrapper expense-icon">⬆</span>
                <div>
                  <span className="stat-title">הוצאות</span>
                  <p className="stat-val expense">-₪{expense}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* תוכן מרכזי */}
      <div className="container main-content">
        
        {/* טאב בית */}
        {activeTab === 'home' && (
          <>
            <div className="section-header">
              <h3>קטגוריות מובילות</h3>
              <span className="see-all" onClick={() => setActiveTab('analytics')}>הצג הכל</span>
            </div>
            <div className="categories-grid">
              {categoryTotals.slice(0, 4).map((cat) => (
                <div
                  key={cat.id}
                  className="category-pill"
                  onClick={() => {
                    setSelectedCategoryFilter(cat.id);
                    setActiveTab('analytics');
                  }}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <div className="cat-info">
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-amount">₪{cat.total.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginTop: '24px' }}>
              <h3>תנועות אחרונות</h3>
            </div>
            {transactions.length === 0 ? (
              <p className="empty-msg">אין עדיין תנועות בחשבון</p>
            ) : (
              <ul className="bank-list">
                {transactions.slice(0, 5).map((t) => {
                  const catObj = CATEGORIES.find((c) => c.id === (t.category || 'general'));
                  return (
                    <li key={t.id} className="bank-item">
                      <div className="bank-left">
                        <div className="bank-icon-bg">{catObj ? catObj.icon : '📦'}</div>
                        <div className="bank-details">
                          <span className="bank-text">{t.text}</span>
                          <span className="bank-subtext">{catObj ? catObj.name : 'כללי'}</span>
                        </div>
                      </div>
                      <div className="bank-right">
                        <span className={`bank-amount ${t.amount < 0 ? 'text-expense' : 'text-income'}`}>
                          {t.amount < 0 ? '-' : '+'}₪{Math.abs(t.amount).toFixed(2)}
                        </span>
                        <button onClick={() => deleteTransaction(t.id)} className="delete-btn">🗑️</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* טאב ניתוח / קטגוריות */}
        {activeTab === 'analytics' && (
          <div className="analytics-view">
            <div className="history-header">
              <h3>סיכום הוצאות לפי קטגוריות</h3>
              {selectedCategoryFilter !== 'all' && (
                <button className="reset-filter-btn" onClick={() => setSelectedCategoryFilter('all')}>
                  איפוס סינון
                </button>
              )}
            </div>

            <div className="categories-full-grid">
              {categoryTotals.map((cat) => (
                <div
                  key={cat.id}
                  className={`category-box-card ${selectedCategoryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat.id ? 'all' : cat.id)}
                >
                  <span className="cat-box-icon">{cat.icon}</span>
                  <span className="cat-box-name">{cat.name}</span>
                  <span className="cat-box-amount">₪{cat.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '15px', color: '#1e1b4b' }}>
              {selectedCategoryFilter === 'all' ? 'כל התנועות' : 'תנועות בסינון'}
            </h3>
            
            <ul className="bank-list">
              {filteredTransactions.map((t) => {
                const catObj = CATEGORIES.find((c) => c.id === (t.category || 'general'));
                return (
                  <li key={t.id} className="bank-item">
                    <div className="bank-left">
                      <div className="bank-icon-bg">{catObj ? catObj.icon : '📦'}</div>
                      <div className="bank-details">
                        <span className="bank-text">{t.text}</span>
                        <span className="bank-subtext">{catObj ? catObj.name : 'כללי'}</span>
                      </div>
                    </div>
                    <div className="bank-right">
                      <span className={`bank-amount ${t.amount < 0 ? 'text-expense' : 'text-income'}`}>
                        {t.amount < 0 ? '-' : '+'}₪{Math.abs(t.amount).toFixed(2)}
                      </span>
                      <button onClick={() => deleteTransaction(t.id)} className="delete-btn">🗑️</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* טאב פרופיל */}
        {activeTab === 'profile' && (
          <div className="profile-card">
            <div className="profile-avatar-large">👤</div>
            <h2>{userName}</h2>
            <p className="profile-email">משתמש פרימיום</p>
            <div className="profile-settings-list">
              <div className="setting-item">⚙️ הגדרות חשבון</div>
              <div className="setting-item">🔒 אבטחה ופרטיות</div>
              <div className="setting-item">💳 ניהול אמצעי תשלום</div>
            </div>
          </div>
        )}

      </div>

      {/* מודל הוספת פעולה */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>הוספת פעולה חדשה</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={addTransaction} className="form-group">
              <input
                type="text"
                className="input-field"
                placeholder="תיאור (למשל: סופר, משכורת)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
              <input
                type="number"
                className="input-field"
                placeholder="סכום (₪)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div className="radio-group">
                <button
                  type="button"
                  className={`type-btn ${type === 'expense' ? 'active-expense' : ''}`}
                  onClick={() => setType('expense')}
                >
                  הוצאה
                </button>
                <button
                  type="button"
                  className={`type-btn ${type === 'income' ? 'active-income' : ''}`}
                  onClick={() => setType('income')}
                >
                  הכנסה
                </button>
              </div>

              <select
                className="input-field select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              <button type="submit" className="submit-btn">שמור פעולה</button>
            </form>
          </div>
        </div>
      )}

      {/* תפריט ניווט תחתון */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setShowAddModal(false); }}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">בית</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => { setActiveTab('analytics'); setShowAddModal(false); }}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">ניתוח</span>
        </button>

        <div className="nav-center-btn-wrapper">
          <button className="center-add-btn" onClick={() => setShowAddModal(true)}>
            +
          </button>
        </div>

        <button 
          className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => { setActiveTab('analytics'); setShowAddModal(false); }}
        >
          <span className="nav-icon">💳</span>
          <span className="nav-text">ארנק</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => { setActiveTab('profile'); setShowAddModal(false); }}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-text">פרופיל</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
