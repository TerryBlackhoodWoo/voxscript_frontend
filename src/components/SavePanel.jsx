import { useState } from 'react'

const FORMAT_OPTIONS = [
    { value: 'all', label: '전부 저장' },
    { value: 'excel', label: 'Excel' },
    { value: 'txt_bilingual', label: '텍스트 (원문+번역)' },
    { value: 'srt_bilingual', label: 'SRT 자막 (병기)' },
]

function SavePanel({ project, onSave, onHome }) {
    const [format, setFormat] = useState('all')
    const [exportDir, setExportDir] = useState('')
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)

    const handleSelectDir = async () => {
        if (window.voxscript?.selectFile) {
            const path = await window.voxscript.selectFile()
            if (path) setExportDir(path)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        await onSave(exportDir || null, [format])
        setSaving(false)
        setDone(true)
    }

    if (done) {
        return (
            <div className="save-panel save-panel-done">
                <div className="save-done-content">
                    <div className="save-done-icon">✅</div>
                    <h2 className="save-done-title">저장 완료!</h2>
                    <p className="save-done-sub">
                        {project?.original_name} 처리가 완료되었습니다.
                    </p>
                    <button className="btn-start" onClick={onHome}>
                        홈으로
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="save-panel">
            <div className="save-header">
                <h2 className="save-title">저장 설정</h2>
                <p className="save-sub">
                    저장 위치와 포맷을 선택하세요.<br />
                    기본 저장 경로: %APPDATA%\VOXScript\projects\{project?.original_name}\
                </p>
            </div>

            <div className="save-body">
                <div className="field">
                    <label>출력 포맷</label>
                    <select value={format} onChange={e => setFormat(e.target.value)}>
                        {FORMAT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <div className="field">
                    <label>저장 경로 (선택, 비워두면 기본 경로)</label>
                    <div className="source-input-row">
                        <input
                            type="text"
                            placeholder="기본 저장 경로 사용"
                            value={exportDir}
                            onChange={e => setExportDir(e.target.value)}
                        />
                        <button className="btn-file-select" onClick={handleSelectDir}>
                            📁
                        </button>
                    </div>
                </div>
            </div>

            <div className="save-footer">
                <button
                    className="btn-start"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '저장 중...' : '저장하기'}
                </button>
            </div>
        </div>
    )
}

export default SavePanel