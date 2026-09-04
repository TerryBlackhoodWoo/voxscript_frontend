import { useState } from 'react'
import logo from '../assets/VOXScriptLogo.png'
import { API_BASE } from '../App'

function LoginView({ onLoginSuccess }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!username.trim() || !password.trim() || loading) return
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.detail || '로그인에 실패했습니다.')
                return
            }

            if (window.voxscript?.saveToken) {
                await window.voxscript.saveToken(data.access_token)
            }
            onLoginSuccess(data.access_token)
        } catch {
            setError('서버에 연결할 수 없습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-view">
            <form className="login-card" onSubmit={handleSubmit}>
                <div className="login-header">
                    <img src={logo} className="login-logo" alt="VOXScript" />
                </div>
                <div className="login-body">
                    <div className="field">
                        <label>아이디</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <div className="field">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </div>
            </form>
            <p className="login-hint">
                계정이 필요하신가요? {' '}
                <a href="mailto:leftdeadman@gmail.com">leftdeadman@gmail.com</a> 으로 연락 주세요
            </p>
        </div>
    )
}

export default LoginView