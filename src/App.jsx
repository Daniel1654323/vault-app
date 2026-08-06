import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');

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
      .insert([{ text, amount: finalAmount }])
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

  return (
    <div className="container">
      <h2 className="app-title">Vault App</h2>

      <div className="balance-board">
        <span className="balance-label">היתרה שלך</span>
        <h1 className="balance-amount">₪{total}</h1>
        
        <div className="stats-container">
          <div className="stat-box income">
            <span>הכנסות</span>
            <p>+₪{income}</p>
          </div>
          <div className="stat-box expense">
            <span>הוצאות</span>
            <p>-₪{expense}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>הוסף פעולה חדשה</h3>
        <form onSubmit={addTransaction} className="form-group">
          <input
            type="text"
            className="input-field"
            placeholder="תיאור (למשל: סופר, משכורת)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="number"
            className="input-field"
            placeholder="סכום"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          
          <div className="radio-group">
            <label className={`radio-label ${type === 'expense' ? 'active-expense' : ''}`}>
              <input
                type="radio"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
              />
              הוצאה 🔴
            </label>
            <label className={`radio-label ${type === 'income' ? 'active-income' : ''}`}>
              <input
                type="radio"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
              />
              הכנסה 🟢
            </label>
          </div>

          <button type="submit" className="submit-btn">הוסף עסקה</button>
        </form>
      </div>

      <div className="card">
        <h3>היסטוריית תנועות</h3>
        {transactions.length === 0 ? (
          <p className="empty-msg">אין עדיין תנועות להצגה</p>
        ) : (
          <ul className="history-list">
            {transactions.map((t) => (
              <li key={t.id} className={`history-item ${t.amount < 0 ? 'border-expense' : 'border-income'}`}>
                <span className="item-text">{t.text}</span>
                <div className="item-actions">
                  <span className={`item-amount ${t.amount < 0 ? 'text-expense' : 'text-income'}`}>
                    {t.amount < 0 ? '-' : '+'}₪{Math.abs(t.amount)}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="delete-btn" title="מחק">
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
