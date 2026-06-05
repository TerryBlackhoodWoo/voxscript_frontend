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
                    <p className="diarize-hint">
                        처리 후 화자 라벨링 화면에서 직접 지정할 수 있습니다
                    </p>
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