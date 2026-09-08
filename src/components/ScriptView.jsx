import { useState } from 'react'

function ProgressBar({ progress, message, elapsed }) {
    return (
        <div className="progress-wrap">
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-bottom">
                <span className="progress-msg">{message}</span>
                {elapsed && <span className="progress-elapsed">⏱ {elapsed}</span>}
            </div>
        </div>
    )
}

// 접었다 펼 수 있는 섹션 (로그/파일목록/요약 공용)
function CollapsibleSection({ title, badge, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="collapsible-section">
            <button
                type="button"
                className="collapsible-header"
                onClick={() => setOpen(o => !o)}
            >
                <span className="collapsible-title">
                    {title}
                    {badge != null && <span className="collapsible-badge">{badge}</span>}
                </span>
                <span className={`collapsible-chevron ${open ? 'open' : ''}`}>▾</span>
            </button>
            {open && <div className="collapsible-body">{children}</div>}
        </div>
    )
}

// Gemini 요약에 들어있는 **굵게** 마크다운만 가볍게 렌더링 (별도 라이브러리 없이)
function renderMarkdownBold(text) {
    if (!text) return text
    return text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : part
    )
}

function ScriptView({ project, isProcessing, progress, progressMsg, logs, elapsedTime }) {

    const handleOpenFile = (filename) => {
        if (window.voxscript?.openFile) {
            window.voxscript.openFile(filename)
        } else {
            navigator.clipboard?.writeText(filename)
            alert(`경로가 복사되었습니다:\n${filename}`)
        }
    }

    const handleOpenFolder = (filename) => {
        if (window.voxscript?.openFolder) {
            window.voxscript.openFolder(filename)
        }
    }

    if (!project && !isProcessing && !logs?.length) {
        return (
            <main className="script-view empty">
                <div className="empty-state">
                    <div className="empty-icon">🎙️</div>
                    <p className="empty-title">프로젝트를 선택하거나</p>
                    <p className="empty-sub">우측에서 새 영상을 처리해주세요</p>
                </div>
            </main>
        )
    }

    return (
        <main className="script-view">
            {isProcessing && (
                <ProgressBar progress={progress} message={progressMsg} elapsed={elapsedTime} />
            )}

            {!isProcessing && elapsedTime && (
                <div className="elapsed-done">✅ 완료 — 총 소요시간: {elapsedTime}</div>
            )}

            {logs?.length > 0 && (
                <CollapsibleSection
                    title="진행 상황"
                    badge={logs.length}
                    defaultOpen={isProcessing}
                >
                    <div className="log-box">
                        {logs.map((line, i) => (
                            <div
                                key={i}
                                className={`log-line ${line.startsWith('✅') ? 'log-done' : line.startsWith('❌') ? 'log-error' : ''}`}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {project && (
                <>
                    {/* 프로젝트 헤더 */}
                    <div className="script-header">
                        <div>
                            <h2 className="script-title">
                                {project.original_name?.replace(/_/g, ' ') || project.title || '제목 없음'}
                            </h2>
                            <span className="script-meta">
                                {project.updated_at
                                    ? new Date(project.updated_at * 1000).toLocaleDateString('ko-KR')
                                    : project.date || ''}
                                {project.detected_language && (
                                    <span className="script-lang"> · {project.detected_language.toUpperCase()}</span>
                                )}
                            </span>
                        </div>
                        {project.stage === 'done' && (
                            <button
                                className="btn-open-folder"
                                onClick={() => project.files?.[0] && handleOpenFolder(project.files[0])}
                                title="저장 폴더 열기"
                            >
                                📂 폴더 열기
                            </button>
                        )}
                    </div>

                    {/* 파일 목록 */}
                    {project.files?.length > 0 && (
                        <CollapsibleSection
                            title="저장된 파일"
                            badge={project.files.length}
                            defaultOpen={false}
                        >
                            <div className="file-list">
                                {project.files.map((f, i) => (
                                    <div key={i} className="file-item">
                                        <span className="file-icon">{getFileIcon(f)}</span>
                                        <span className="file-name">{f}</span>
                                        <button
                                            className="btn-file-open"
                                            onClick={() => handleOpenFile(f)}
                                            title="파일 열기"
                                        >
                                            열기
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* 요약 */}
                    {project.summary && (
                        <CollapsibleSection title="Gemini 요약" defaultOpen={true}>
                            <div className="summary-content">{renderMarkdownBold(project.summary)}</div>
                        </CollapsibleSection>
                    )}

                    {!project.summary && project.stage === 'done' && (
                        <CollapsibleSection title="요약 없음" defaultOpen={true}>
                            <div className="summary-content" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                요약 생략 옵션이 켜져 있었거나 요약 생성에 실패했습니다.
                            </div>
                        </CollapsibleSection>
                    )}
                </>
            )}
        </main>
    )
}

function getFileIcon(filename) {
    if (filename.endsWith('.xlsx')) return '📊'
    if (filename.endsWith('.txt')) return '📄'
    if (filename.endsWith('.srt')) return '🎬'
    return '📎'
}

export default ScriptView