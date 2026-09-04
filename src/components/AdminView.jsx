import { useState, useEffect } from 'react'
import { API_BASE } from '../App'

function AdminView({ token, onBack }) {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [newUsername, setNewUsername] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newLimit, setNewLimit] = useState(10)
    const [newIsAdmin, setNewIsAdmin] = useState(false)
    const [creating, setCreating] = useState(false)

    const fetchAccounts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/admin/accounts`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || '목록을 불러올 수 없습니다.')
                return
            }
            setAccounts(data)
            setError('')
        } catch {
            setError('서버에 연결할 수 없습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newUsername.trim() || !newPassword.trim() || creating) return
        setCreating(true)
        setError('')
        try {
            const res = await fetch(`${API_BASE}/admin/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    monthly_minutes_limit: Number(newLimit),
                    is_admin: newIsAdmin,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || '계정 생성에 실패했습니다.')
                return
            }
            setNewUsername('')
            setNewPassword('')
            setNewLimit(10)
            setNewIsAdmin(false)
            fetchAccounts()
        } catch {
            setError('서버에 연결할 수 없습니다.')
        } finally {
            setCreating(false)
        }
    }

    const handleToggleActive = async (account) => {
        await fetch(`${API_BASE}/admin/accounts/${account.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ is_active: !account.is_active }),
        })
        fetchAccounts()
    }

    const handleLimitChange = async (account, value) => {
        await fetch(`${API_BASE}/admin/accounts/${account.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ monthly_minutes_limit: Number(value) }),
        })
    }

    return (
        <div className="admin-view">
            <div className="admin-header">
                <h2>관리자 페이지</h2>
                <button className="btn-back" onClick={onBack}>← 돌아가기</button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <div className="admin-body">
                <section className="admin-section">
                    <h3>계정 추가</h3>
                    <form className="admin-create-form" onSubmit={handleCreate}>
                        <div className="admin-field">
                            <label>아이디</label>
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <div className="admin-field">
                            <label>비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <div className="admin-field">
                            <label>월 한도(분)</label>
                            <input
                                type="number"
                                min="0"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                                disabled={creating}
                            />
                        </div>
                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                checked={newIsAdmin}
                                onChange={(e) => setNewIsAdmin(e.target.checked)}
                                disabled={creating}
                            />
                            관리자 권한
                        </label>
                        <button type="submit" className="btn-login" disabled={creating}>
                            {creating ? '생성 중...' : '계정 생성'}
                        </button>
                    </form>
                </section>

                <section className="admin-section">
                    <h3>계정 목록</h3>
                    {loading ? (
                        <p className="admin-empty">불러오는 중...</p>
                    ) : accounts.length === 0 ? (
                        <p className="admin-empty">등록된 계정이 없습니다</p>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>아이디</th>
                                        <th>권한</th>
                                        <th>상태</th>
                                        <th>월 한도(분)</th>
                                        <th>이번 달 사용(초)</th>
                                        <th>가입일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((a) => (
                                        <tr key={a.id}>
                                            <td>{a.username}</td>
                                            <td>{a.is_admin && <span className="admin-badge-admin">ADMIN</span>}</td>
                                            <td>
                                                <button
                                                    className={`admin-toggle ${a.is_active ? 'active' : 'inactive'}`}
                                                    onClick={() => handleToggleActive(a)}
                                                >
                                                    {a.is_active ? '활성' : '비활성'}
                                                </button>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    defaultValue={a.monthly_minutes_limit}
                                                    onBlur={(e) => handleLimitChange(a, e.target.value)}
                                                    className="admin-limit-input"
                                                />
                                            </td>
                                            <td>{a.stt_seconds}</td>
                                            <td>{new Date(a.created_at).toLocaleDateString('ko-KR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default AdminView