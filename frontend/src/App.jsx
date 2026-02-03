import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Lightbulb, Lock, Unlock, Thermometer, Music, 
  Car, Shield, LogOut, User, Settings, Wind
} from 'lucide-react';
import './App.css';

// Konfiguriši URL (lokalno ili Render)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("home"); // 'home' or 'admin'

  // Smart Home Data
  const [devices, setDevices] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // --- AUTH CHECK ---
  useEffect(() => {
    // Proveri da li već postoji token
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchDevices(token);
    }
  }, []);

  // --- API POZIVI ---
  const fetchDevices = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data);
    } catch (err) {
      console.error("Greška sa uređajima", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (err) {
      console.error("Greška admin lista", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email, password });
      const { token, user } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      setError("");
      
      // Odmah učitaj uređaje
      fetchDevices(token);
    } catch (err) {
      setError("Pogrešan email ili lozinka.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setDevices([]);
    setEmail("");
    setPassword("");
  };

const toggleDevice = async (id, newValue = null) => {
    // Ažuriraj lokalno odmah (da ne secka)
    setDevices(devices.map(d => {
      if (d.id === id) {
        if (newValue !== null) return { ...d, value: newValue }; // Ako je slider
        return { ...d, isOn: !d.isOn, isLocked: !d.isLocked, isOpen: !d.isOpen }; // Ako je klik
      }
      return d;
    }));

    try {
      const token = localStorage.getItem("token");
      // Šaljemo i value ako postoji
      await axios.post(`${API_URL}/api/devices/${id}/toggle`, 
        { value: newValue }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Greška", err);
    }
  };

  // --- RENDER ICONS ---
  const getIcon = (device) => {
    const size = 32;
    switch(device.type) {
      case 'light': return <Lightbulb size={size} />;
      case 'lock': return device.isLocked ? <Lock size={size} /> : <Unlock size={size} />;
      case 'temp': return <Thermometer size={size} />;
      case 'garage': return <Car size={size} />;
      case 'music': return <Music size={size} />;
      case 'blinds': return <Wind size={size} />;
      default: return <Settings size={size} />;
    }
  };

  // --- GLAVNI RENDER ---
  if (!user) {
    // LOGIN EKRAN
    return (
      <div className="app-container">
        <div className="glass-card login-wrapper">
          <div style={{ marginBottom: '20px' }}>
            <Shield size={50} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Nexus Home</h1>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Sigurnosni pristup sistemu</p>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                className="modern-input" 
                type="email" 
                placeholder="Email adresa" 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input 
                className="modern-input" 
                type="password" 
                placeholder="Lozinka" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && <p style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</p>}
            <button className="btn-primary" type="submit">Pristupi Sistemu</button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD EKRAN
  return (
    <div className="app-container" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="dashboard-layout">
        
        {/* SIDEBAR */}
        <aside className="glass-card sidebar">
          <div>
            <div className="user-profile">
              <div className="avatar">
                {user.firstName ? user.firstName[0] : "U"}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{user.firstName}</h3>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{user.email}</span>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className={`nav-btn ${view === 'home' ? 'active' : ''}`}
                onClick={() => setView('home')}
              >
                🏠 Moja Kuća
              </button>
              
              {user.roles.includes('admin') && (
                <button 
                  className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
                  onClick={() => { setView('admin'); fetchUsers(); }}
                >
                  ⚡ Admin Panel
                </button>
              )}
            </nav>
          </div>

          <button className="nav-btn" style={{ color: '#ef4444' }} onClick={handleLogout}>
            <LogOut size={18} style={{ marginRight: '8px' }} /> Odjavi se
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="glass-card" style={{ overflowY: 'auto' }}>
          
          {view === 'home' && (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Kontrolna Tabla</h2>
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                  System Online
                </div>
              </header>

              <div className="devices-grid">
                {devices.map(dev => {
                  // Unutar devices.map((dev) => { ...
                  const isActive = dev.isOn || (dev.type === 'lock' && dev.isLocked) || (dev.type === 'garage' && dev.isOpen);

                  return (
                    <div 
                      key={dev.id} 
                      className={`glass-card device-card ${isActive ? 'active' : ''}`}
                      // Klik na samu karticu radi Toggle (samo ako nije slider u pitanju)
                      onClick={(e) => {
                        if (e.target.type !== 'range') toggleDevice(dev.id);
                      }}
                    >
                      <div className="status-indicator"></div>
                      <div className="device-icon">{getIcon(dev)}</div>
    
                      <div style={{ width: '100%' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>{dev.name}</h4>
      
                        {/* Ako je Termostat ili Svetlo, prikaži SLIDER */}
                        {(dev.type === 'temp' || dev.type === 'light') && isActive ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="range" 
                              min={dev.type === 'temp' ? 16 : 0} 
                              max={dev.type === 'temp' ? 30 : 100}
                              value={dev.value}
                              onClick={(e) => e.stopPropagation()} // Da ne ugasi uređaj kad klikaš slider
                              onChange={(e) => toggleDevice(dev.id, parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: dev.type === 'temp' ? '#ef4444' : '#f59e0b' }}
                            />
                          <span style={{ fontSize: '0.8rem', minWidth: '30px' }}>
                        {dev.value}{dev.type === 'temp' ? '°C' : '%'}
                      </span>
                    </div>
                  ) : (
                    // Običan tekst za ostale
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                            {dev.type === 'temp' ? `${dev.value}°C (Isključeno)` : 
                            dev.type === 'lock' ? (dev.isLocked ? 'Zaključano' : 'Otključano') :
                          isActive ? 'Uključeno' : 'Isključeno'}
                          </span>
                          )}
                        </div>
                        </div>
                      )
                      // ... })
                })}
              </div>
            </>
          )}

          {view === 'admin' && (
            <>
              <h2>Upravljanje Korisnicima</h2>
              <p style={{ color: '#94a3b8' }}>Pregled registrovanih korisnika u Nexus bazi.</p>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ime</th>
                    <th>Email</th>
                    <th>Uloga</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>{u.firstName || "N/A"}</td>
                      <td>{u.email}</td>
                      <td>
                        {u.roles.map(r => (
                          <span key={r.role.name} className={`role-badge role-${r.role.name}`}>
                            {r.role.name}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;




//ddddddsss