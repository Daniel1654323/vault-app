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

  // חישוב הוצאות לפי קטגוריה
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
    <div className="container">
      <header className="app-header">
        <div>
          <span className="greeting-sub">שלום וברכה 👋</span>
          <h2 className="greeting-name">ברוך הבא, {userName}</h2>
        </div>
        <div className="avatar">👤</div>
      </header>

      {/* כרטיס יתרה */}
      <div className="balance-board">
        <span className="balance-label">יתרה בחשבון</span>
        <h1 className="balance-amount">₪{total}</h1>
        <div className="stats-container">
          <div className="stat-box income">
            <span>הכנסות 🟢</span>
            <p>+₪{income}</p>
          </div>
          <div className="stat-box expense">
            <span>הוצאות 🔴</span>
            <p>-₪{expense}</p>
          </div>
        </div>
      </div>

      {/* פירוט קטגוריות */}
      <div className="card">
        <h3>סיכום לפי קטגוריות</h3>
        <div className="categories-grid">
          {categoryTotals.map((cat) => (
            <div
              key={cat.id}
              className={`category-card ${selectedCategoryFilter === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat.id ? 'all' : cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
              <span className="cat-amount">₪{cat.total.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* טופס הוספה */}
      <div className="card">
        <h3>הוספת פעולה חדשה</h3>
        <form onSubmit={addTransaction} className="form-group">
          <input
            type="text"
            className="input-field"
            placeholder="תיאור (למשל: שופרסל, תדלוק)"
            value={text}
            onChange={(e) => setText(e.target.value)}
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

          <button type="submit" className="submit-btn">
            + שמור פעולה
          </button>
        </form>
      </div>

      {/* תצוגת עו"ש בנקאית */}
      <div className="card">
        <div className="history-header">
          <h3>תנועות בחשבון (עו"ש)</h3>
          {selectedCategoryFilter !== 'all' && (
            <button className="reset-filter-btn" onClick={() => setSelectedCategoryFilter('all')}>
              הצג הכל
            </button>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="empty-msg">אין תנועות להצגה בקטגוריה זו</p>
        ) : (
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
                    <button onClick={() => deleteTransaction(t.id)} className="delete-btn">
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
