import React, { useState, useEffect } from 'react';
import { PlusCircle, Wallet, ArrowUpRight, ArrowDownRight, PieChart as PieIcon, X, ListOrdered } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from './supabaseClient';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'expense',
    category: 'אוכל',
    amount: '',
    desc: ''
  });

  // טעינת נתונים מ-Supabase בטעינת העמוד
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('שגיאה בטעינת הנתונים:', error);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    const newTx = {
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      desc: formData.desc || formData.category
    };

    // שמירה ב-Supabase
    const { error } = await supabase
      .from('transactions')
      .insert([newTx]);

    if (error) {
      console.error('שגיאה בשמירה:', error);
      alert('אירעה שגיאה בשמירת הפעולה');
    } else {
      await fetchTransactions(); // טעינה מחדש של הנתונים העדכניים מסד הנתונים
      setFormData({ type: 'expense', category: 'אוכל', amount: '', desc: '' });
      setIsModalOpen(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const categoryColors = {
    'אוכל': '#7C3AED',
    'דלק': '#A855F7',
    'בילויים': '#C084FC',
    'כללי': '#E9D5FF',
    'משכורת': '#10B981'
  };

  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

  const categoryData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat],
    color: categoryColors[cat] || '#7C3AED'
  }));

  return (
    <div className="min-h-screen bg-[#09090B] text-white p-4 max-w-md mx-auto space-y-6 text-right" dir="rtl">
      {/* כותרת */}
      <div className="flex justify-between items-center py-2 border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-[#7C3AED] flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Vault 💜
        </h1>
        <span className="text-sm text-zinc-400">בוקר טוב, Kley 👋</span>
      </div>

      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#18181B] p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1 text-emerald-400 text-xs mb-1">
            <ArrowUpRight className="w-4 h-4" /> הכנסות
          </div>
          <div className="text-white font-bold">₪{totalIncome.toLocaleString()}</div>
        </div>

        <div className="bg-[#18181B] p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1 text-rose-400 text-xs mb-1">
            <ArrowDownRight className="w-4 h-4" /> הוצאות
          </div>
          <div className="text-white font-bold">₪{totalExpense.toLocaleString()}</div>
        </div>

        <div className="bg-[#18181B] p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-1 text-[#7C3AED] text-xs mb-1">
            <Wallet className="w-4 h-4" /> נשאר
          </div>
          <div className="text-white font-bold">₪{balance.toLocaleString()}</div>
        </div>
      </div>

      {/* תרשים עוגה */}
      <div className="bg-[#18181B] p-4 rounded-xl border border-zinc-800">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-zinc-300">
          <PieIcon className="w-4 h-4 text-[#7C3AED]" /> הוצאות לפי קטגוריה
        </h2>
        <div className="h-40">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              אין עדיין הוצאות להצגה
            </div>
          )}
        </div>
      </div>

      {/* יעד חיסכון */}
      <div className="bg-[#18181B] p-4 rounded-xl border border-zinc-800 space-y-2">
        <div className="flex justify-between text-sm">
          <span>יעד חיסכון</span>
          <span className="text-[#7C3AED] font-bold">67% (₪6,700 / ₪10,000)</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
          <div className="bg-[#7C3AED] h-full rounded-full" style={{ width: '67%' }}></div>
        </div>
      </div>

      {/* רשימת פעולות אחרונות */}
      <div className="bg-[#18181B] p-4 rounded-xl border border-zinc-800 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-300 border-b border-zinc-800 pb-2">
          <ListOrdered className="w-4 h-4 text-[#7C3AED]" /> פעולות אחרונות
        </h2>
        
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-4">טוען נתונים...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-4">אין פעולות שמורות עדיין</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-[#09090B] p-2.5 rounded-lg border border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{tx.desc || tx.category}</div>
                    <div className="text-[10px] text-zinc-400">{tx.category}</div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}₪{Number(tx.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* כפתור הוספת פעולה */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <PlusCircle className="w-5 h-5" /> הוסף פעולה
      </button>

      {/* modal - טופס הוספה */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-lg text-[#7C3AED]">הוספת פעולה חדשה</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.type === 'expense' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'border-zinc-800 text-zinc-400'}`}
                >
                  הוצאה
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border ${formData.type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-800 text-zinc-400'}`}
                >
                  הכנסה
                </button>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">סכום (₪)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#09090B] border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#09090B] border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="אוכל">אוכל</option>
                  <option value="דלק">דלק</option>
                  <option value="בילויים">בילויים</option>
                  <option value="משכורת">משכורת</option>
                  <option value="כללי">כללי</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">תיאור (אופציונלי)</label>
                <input
                  type="text"
                  placeholder="למשל: תדלוק בתחנת פז"
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-[#09090B] border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#7C3AED] hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                שמור פעולה
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
