const LANG_OPTIONS = [
    { value: 'auto', label: '자동 감지' },
    { value: 'ko', label: '한국어' },
    { value: 'en', label: '영어' },
    { value: 'ja', label: '일본어' },
    { value: 'zh', label: '중국어' },
    { value: 'es', label: '스페인어' },
    { value: 'de', label: '독일어' },
    { value: 'fr', label: '프랑스어' },
]

const FORMAT_OPTIONS = [
    { value: 'all', label: '전부 저장' },
    { value: 'txt_bilingual', label: '텍스트 (원문+번역)' },
    { value: 'srt_bilingual', label: 'SRT 자막 (병기)' },
    { value: 'excel', label: 'Excel' },
]

function SettingsPanel({ settings, onChange, onStart, onStop, isProcessing }) {
    const update = (key, value) => onChange({ ...settings, [key]: value })

    const addSpeaker = () => {
        update('speakers', [...settings.speakers, `화자${settings.speakers.length + 1}`])
    }

    const removeSpeaker = (idx) => {
        if (settings.speakers.length <= 1) return
        update('speakers', settings.speakers.filter((_, i) => i !== idx))
    }

    const updateSpeaker = (idx, value) => {
        const next = [...settings.speakers]
        next[idx] = value
        update('speakers', next)
    }

    return (
        <aside className="settings-panel">
            <div className="settings-header">
                <span className="settings-title">설정</span>
            </div>

            <div className="settings-body">
                <div className="field">
                    <label>소스 URL / 경로</label>
                    <div className="source-input-row">
                        <input
                            type="text"
                            placeholder="YouTube URL / Google Drive 링크 / 로컬 경로"
                            value={settings.sourceUrl}
                            onChange={(e) => update('sourceUrl', e.target.value)}
                            disabled={isProcessing}
                        />
                        <button
                            className="btn-file-select"
                            onClick={async () => {
                                if (window.voxscript?.selectFile) {
                                    const path = await window.voxscript.selectFile()
                                    if (path) update('sourceUrl', path)
                                }
                            }}
                            disabled={isProcessing}
                            title="로컬 파일 선택"
                        >
                            📁
                        </button>
                    </div>
                </div>

                <div className="field">
                    <label>원본 언어</label>
                    <select value={settings.lang} onChange={(e) => update('lang', e.target.value)} disabled={isProcessing}>
                        {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="field">
                    <label>출력 포맷</label>
                    <select value={settings.format} onChange={(e) => update('format', e.target.value)} disabled={isProcessing}>
                        {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="field toggle-field">
                    <label>화자 구분</label>
                    <button
                        className={`toggle ${settings.diarize ? 'on' : 'off'}`}
                        onClick={() => update('diarize', !settings.diarize)}
                        disabled={isProcessing}
                    >
                        {settings.diarize ? 'ON' : 'OFF'}
                    </button>
                </div>

                {settings.diarize && (
                    <div className="speaker-fields">
                        {/* 자동/수동 모드 선택 */}
                        <div className="diarize-mode">
                            <button
                                className={`mode-btn ${settings.diarizeMode === 'auto' ? 'active' : ''}`}
                                onClick={() => update('diarizeMode', 'auto')}
                                disabled={isProcessing}
                            >
                                자동 감지
                            </button>
                            <button
                                className={`mode-btn ${settings.diarizeMode === 'manual' ? 'active' : ''}`}
                                onClick={() => update('diarizeMode', 'manual')}
                                disabled={isProcessing}
                            >
                                직접 입력
                            </button>
                        </div>

                        {/* 수동 모드일 때만 화자 목록 표시 */}
                        {settings.diarizeMode === 'manual' && (
                            <>
                                <div className="speaker-fields-header">
                                    <span className="speaker-label">화자 목록</span>
                                    <button
                                        className="btn-add-speaker"
                                        onClick={addSpeaker}
                                        disabled={isProcessing}
                                    >
                                        + 추가
                                    </button>
                                </div>
                                {settings.speakers.map((name, idx) => (
                                    <div key={idx} className="speaker-row">
                                        <span className="speaker-num">{idx + 1}</span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => updateSpeaker(idx, e.target.value)}
                                            disabled={isProcessing}
                                        />
                                        {settings.speakers.length > 1 && (
                                            <button
                                                className="btn-remove-speaker"
                                                onClick={() => removeSpeaker(idx)}
                                                disabled={isProcessing}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}

                        {settings.diarizeMode === 'auto' && (
                            <p className="diarize-hint">Gemini가 대화 패턴을 분석하여 화자를 자동으로 구분합니다</p>
                        )}
                    </div>
                )}

                <div className="field toggle-field">
                    <label>요약 생략</label>
                    <button
                        className={`toggle ${settings.noSummary ? 'on' : 'off'}`}
                        onClick={() => update('noSummary', !settings.noSummary)}
                        disabled={isProcessing}
                    >
                        {settings.noSummary ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            <div className="settings-footer">
                {isProcessing ? (
                    <button className="btn-stop" onClick={onStop}>중지</button>
                ) : (
                    <button
                        className="btn-start"
                        onClick={onStart}
                        disabled={!settings.sourceUrl.trim()}
                    >
                        처리 시작
                    </button>
                )}
            </div>
        </aside>
    )
}

export default SettingsPanel