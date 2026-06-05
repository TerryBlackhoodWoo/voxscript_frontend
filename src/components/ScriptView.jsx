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

function ScriptView({ project, isProcessing, progress, progressMsg, logs, elapsedTime }) {
    if (!project && !isProcessing && !logs?.length) {
        return (
            <main className="script-view empty">
                <div className="empty-state">
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
                <div className="log-box">
                    {logs.map((line, i) => (
                        <div key={i} className={`log-line ${line.startsWith('✅') ? 'log-done' : line.startsWith('❌') ? 'log-error' : ''}`}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            {project && (
                <>
                    <div className="script-header">
                        <h2 className="script-title">{project.title}</h2>
                        <span className="script-meta">{project.date}</span>
                    </div>

                    {project.files?.length > 0 && (
                        <div className="file-list">
                            {project.files.map((f, i) => (
                                <span key={i} className="file-chip">{f}</span>
                            ))}
                        </div>
                    )}

                    {project.summary && (
                        <div className="summary-box">
                            <div className="summary-label">Gemini 요약</div>
                            <div className="summary-content">{project.summary}</div>
                        </div>
                    )}
                </>
            )}
        </main>
    )
}

export default ScriptView