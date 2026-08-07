import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Wallet() {
  const [savings, setSavings] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [savingAmount, setSavingAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching savings:', error);
    } else {
      setSavings(data || []);
    }
  };

  const handleSaveOrUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!savingName.trim() || !savingAmount) {
      setError('נא למלא את שם החיסכון והסכום');
      return;
    }

    const numAmount = parseFloat(savingAmount);
    if (isNaN(numAmount)) {
      setError('נא להזין סכום תקין');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      // עדכון חיסכון קיים
      const { error } = await supabase
        .from('savings')
        .update({ name: savingName.trim(), amount: numAmount })
        .eq('id', editingId);

      if (error) {
        setError('שגיאה בעדכון החיסכון: ' + error.message);
      } else {
        fetchSavings();
        closeModal();
      }
    } else {
      // הוספת חיסכון חדש
      const { error } = await supabase
        .from('savings')
        .insert([{ 
          name: savingName.trim(), 
          amount: numAmount, 
          user_id: user ? user.id : null 
        }]);

      if (error) {
        setError('שגיאה בשמירת החיסכון: ' + error.message);
      } else {
        fetchSavings();
        closeModal();
      }
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSavingName(item.name);
    setSavingAmount(item.amount);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('savings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saving:', error);
    } else {
      setSavings(savings.filter(s => s.id !== id));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSavingName('');
    setSavingAmount('');
    setEditingId(null);
    setError('');
  };

  const totalSavings = savings.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>ניהול חסכונות</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>סה"כ חסכונות: ₪{totalSavings.toFixed(2)}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
        >
          + הוסף חיסכון
        </button>
      </div>

      {savings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: '12px', color: '#64748b', border: '1px solid var(--border-color)' }}>
          אין עדיין חסכונות רשומים. לחץ על "הוסף חיסכון" כדי להתחיל.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {savings.map((item) => (
            <div 
              key={item.id} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🐖</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)' }}>{item.name}</h4>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>₪{Number(item.amount).toFixed(2)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleEdit(item)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title="ערוך"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title="מחק"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* מודל הוספה / עריכה */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ boxSizing: 'border-box' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ boxSizing: 'border-box', width: '90%', maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'עריכת חיסכון' : 'הוספת חיסכון חדש'}</h3>
              <button type="button" className="close-modal-btn" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body-scroll" style={{ width: '100%', boxSizing: 'border-box' }}>
              {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="שם החיסכון (למשל: קרן השתלמות, חופשה)" 
                  value={savingName} 
                  onChange={(e) => setSavingName(e.target.value)} 
                  autoFocus 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                />
                <input 
                  type="number" 
                  step="any" 
                  className="input-field" 
                  placeholder="סכום בחיסכון (₪)" 
                  value={savingAmount} 
                  onChange={(e) => setSavingAmount(e.target.value)} 
                  style={{ width: '100%', boxSizing: 'border-box' }} 
                />
                <button type="submit" className="submit-btn" style={{ marginTop: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {editingId ? 'עדכן חיסכון' : 'שמור חיסכון'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
