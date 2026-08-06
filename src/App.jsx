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
    <div className="container" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Vault App</h2>

      <div className="balance-board" style={{ margin: '20px 0', textAlign: 'center' }}>
        <h4>היתרה שלך</h4>
        <h1>₪{total}</h1>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
          <div>
            <h4>הכנסות</h4>
            <p style={{ color: 'green' }}>+₪{income}</p>
          </div>
          <div>
            <h4>הוצאות</h4>
            <p style={{ color: 'red' }}>-₪{expense}</p>
          </div>
        </div>
      </div>

      <h3>הוסף פעולה חדשה</h3>
      <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          placeholder="תיאור (למשל: סופר, משכורת)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="number"
          placeholder="סכום"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <label>
            <input
              type="radio"
              value="expense"
              checked={type === 'expense'}
              onChange={() => type !== 'expense' && setType('expense')}
            />
            הוצאה
          </label>
          <label>
            <input
              type="radio"
              value="income"
              checked={type === 'income'}
              onChange={() => type !== 'income' && setType('income')}
            />
            הכנסה
          </label>
        </div>
        <button type="submit">הוסף עסקה</button>
      </form>

      <h3 style={{ marginTop: '30px' }}>היסטוריית תנועות</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map((t) => (
          <li
            key={t.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              borderBottom: '1px solid #eee',
              borderRight: `5px solid ${t.amount < 0 ? 'red' : 'green'}`,
              marginBottom: '8px'
            }}
          >
            <span>{t.text}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>
                {t.amount < 0 ? '-' : '+'}₪{Math.abs(t.amount)}
              </span>
              <button
                onClick={() => deleteTransaction(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
