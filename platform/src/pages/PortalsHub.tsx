import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, ArrowRight } from 'lucide-react';
import { getWebsiteHomeUrl, navigateToWebsiteHome } from '../config/urls';

const portals = [
  { role: 'admin', title: 'Admin Portal', desc: 'Enterprise management, analytics & oversight', icon: Shield, active: true },
  { role: 'employee', title: 'Employee Portal', desc: 'Tasks, attendance, documents & collaboration', icon: Users, active: true },
];

export default function PortalsHub() {
  return (
    <div className="login-bg" style={{ flexDirection: 'column', padding: '80px 24px' }}>
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: 12 }}>AgriGuardian Portals</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto' }}>Access your dedicated enterprise workspace. Select your portal to sign in.</p>
        <a
          href={getWebsiteHomeUrl()}
          onClick={navigateToWebsiteHome}
          style={{ color: 'var(--green)', fontSize: '0.9rem', marginTop: 16, display: 'inline-block', cursor: 'pointer' }}
        >
          ← Back to Website
        </a>
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1100, width: '100%' }}>
        {portals.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.role} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              {p.active ? (
                <Link to={`/login/${p.role}`}>
                  <div className="glass gradient-border" style={{ padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,125,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--green)' }}>
                      <Icon size={30} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>{p.desc}</p>
                    <span style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Sign In <ArrowRight size={16} /></span>
                  </div>
                </Link>
              ) : (
                <div className="glass" style={{ padding: 32, textAlign: 'center', opacity: 0.7 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,162,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--gold)' }}>
                    <Icon size={30} />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.desc}</p>
                  <span className="badge badge--pending" style={{ marginTop: 16 }}>Coming Soon</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
