import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/UI';
import { getWebsiteHomeUrl, navigateToWebsiteHome } from '../config/urls';

const portalMeta: Record<string, { title: string; subtitle: string; icon: React.ComponentType<{ size?: number }> }> = {
  admin: { title: 'Admin Portal', subtitle: 'Enterprise management & analytics', icon: Shield },
  employee: { title: 'Employee Portal', subtitle: 'Tasks, attendance & collaboration', icon: Users },
};

const activeRoles = new Set(['admin', 'employee']);

export default function LoginPage() {
  const { role = 'admin' } = useParams();
  const meta = portalMeta[role] || portalMeta.admin;
  const Icon = meta.icon;
  const isDisabled = !activeRoles.has(role);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);
    try {
      let user;
      if (isSignup) {
        // Implement signup API call since auth context might not have signup
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Signup failed');
        }
        const data = await res.json();
        user = data.user;
        // Assume successful signup also logs them in, but we might need to update AuthContext state
        // For now, we'll try to just call login or manually set the token
        localStorage.setItem('ag_token', data.token);
        // Refresh page or we can just redirect if the AuthContext picks it up
        window.location.href = `/${role}`;
        return; // Skip the rest of handleSubmit
      } else {
        user = await login(email, password);
      }
      
      const routes: Record<string, string> = { admin: '/admin', employee: '/employee' };
      if (user.role !== role && user.role !== 'admin') {
        toast('Redirecting to your portal...', 'success');
        navigate(routes[user.role] || '/admin');
      } else {
        navigate(routes[role] || '/admin');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%', maxWidth: 440 }}>
        <GlassCard className="gradient-border" style={{ padding: 40 } as React.CSSProperties}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <motion.div
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(46,125,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--green)' }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Icon size={36} />
            </motion.div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: 8 }}>{meta.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{meta.subtitle}</p>
          </div>

          {isDisabled ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>This portal is not available.</p>
              <Link to="/portals" className="btn-ghost" style={{ display: 'inline-block' }}>Back to Portals</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agriguardian.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>

              <motion.button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading} whileTap={{ scale: 0.98 }}>
                {loading ? (isSignup ? 'Signing up...' : 'Signing in...') : (isSignup ? 'Sign Up' : 'Sign In')}
              </motion.button>
              
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                  <span 
                    onClick={() => setIsSignup(!isSignup)} 
                    style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </span>
                </p>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isDisabled && <Link to="/portals" style={{ color: 'var(--text-muted)' }}>← Back to Portals</Link>}
            <a
              href={getWebsiteHomeUrl()}
              onClick={navigateToWebsiteHome}
              style={{ color: 'var(--green)', cursor: 'pointer' }}
            >
              ← Back to Website
            </a>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
