import { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LoginPage({ onLogin }) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!login.trim() || !password.trim()) {
            setError('Please enter login and password.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ login: login.trim(), password }),
            });
            const json = await res.json();

            if (json.success) {
                // Store token & user info
                localStorage.setItem('token', json.data.token);
                localStorage.setItem('user', JSON.stringify(json.data.user));
                onLogin(json.data.user, json.data.token);
            } else {
                setError(json.message || 'Login failed.');
            }
        } catch (err) {
            setError('Connection error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #141121 0%, #1C182D 50%, #141121 100%)', // Brighter, richer dark-purple tone
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
        }}>
            {/* Elegant Background Glows */}
            <div style={{
                position: 'absolute', top: '10%', right: '15%',
                width: '600px', height: '600px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
                filter: 'blur(80px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-10%',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
                filter: 'blur(80px)',
                pointerEvents: 'none'
            }} />

            <div style={{
                width: '420px', maxWidth: '90vw', position: 'relative', zIndex: 1,
            }}>
                {/* Login Card */}
                <div style={{
                    background: 'rgba(30, 27, 46, 0.75)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    padding: '48px 40px',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {/* Logo Section inside card */}
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <img
                            src="/logo.png"
                            alt="Feline Accountant Logo"
                            style={{
                                width: '96px', height: '96px', borderRadius: '24px',
                                display: 'block', margin: '0 auto 16px',
                                boxShadow: '0 12px 36px rgba(139, 92, 246, 0.25)',
                                objectFit: 'cover'
                            }}
                        />
                        <h1 style={{
                            margin: '0', fontSize: '24px', fontWeight: 700,
                            color: '#FFFFFF', letterSpacing: '-0.5px'
                        }}>
                            Welcome Back
                        </h1>
                        <p style={{
                            margin: '8px 0 0', color: '#94A3B8', fontSize: '14px', fontWeight: 400
                        }}>
                            Enter your credentials to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Error Handling */}
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '14px 16px', borderRadius: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#FCA5A5', fontSize: '13px', lineHeight: '1.4'
                            }}>
                                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Login Field */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#CBD5E1' }}>
                                Email or Username
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} strokeWidth={2.5} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type="text"
                                    value={login}
                                    onChange={e => setLogin(e.target.value)}
                                    placeholder="Enter your email or username"
                                    autoComplete="username"
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '14px 16px 14px 46px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px', color: '#FFFFFF', fontSize: '14px',
                                        outline: 'none', transition: 'all 0.25s ease',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#8B5CF6';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#CBD5E1' }}>
                                    Password
                                </label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} strokeWidth={2.5} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%', padding: '14px 46px 14px 46px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px', color: '#FFFFFF', fontSize: '14px',
                                        outline: 'none', transition: 'all 0.25s ease',
                                        boxSizing: 'border-box',
                                        letterSpacing: showPassword || !password ? 'normal' : '3px'
                                    }}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#8B5CF6';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#64748B', display: 'flex', padding: '4px',
                                        transition: 'color 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#CBD5E1'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px', marginTop: '10px',
                                background: loading
                                    ? 'rgba(139, 92, 246, 0.4)'
                                    : 'linear-gradient(to right, #6366F1, #8B5CF6, #D946EF)',
                                backgroundSize: '200% auto',
                                border: 'none', borderRadius: '12px',
                                color: '#FFFFFF', fontSize: '15px', fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: '0.4s ease-out',
                                boxShadow: loading ? 'none' : '0 8px 16px rgba(139, 92, 246, 0.3)',
                                opacity: loading ? 0.7 : 1,
                            }}
                            onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'right center'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(139, 92, 246, 0.4)'; } }}
                            onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'left center'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.3)'; } }}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg className="animate-spin" viewBox="0 0 24 24" style={{ height: '18px', width: '18px', opacity: 0.8 }} fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer Footer */}
                <p style={{
                    textAlign: 'center', marginTop: '32px', color: '#64748B', fontSize: '12px',
                    fontWeight: 500, letterSpacing: '0.5px'
                }}>
                    © 2026 FELINE ACCOUNTANT
                </p>
            </div>

            {/* Inject minimal spin animation inline since we don't have tailwind */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </div>
    );
}
