function ProgressBar({ progress, message }) {
    return (
        <div className="progress-wrap">
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-msg">{message}</span>
        </div>
    )
}

function ScriptView({ project, isProcessing, progress, progressMsg }) {
    if (!project && !isProcessing) {
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
            {isProcessing && <ProgressBar progress={progress} message={progressMsg} />}

            {project && (
                <>
                    <div className="script-header">
                        <h2 className="script-title">{project.title}</h2>
                        <span className="script-meta">{project.date}</span>
                    </div>

                    {/* 저장된 파일 목록 */}
                    {project.files?.length > 0 && (
                        <div className="file-list">
                            {project.files.map((f, i) => (
                                <span key={i} className="file-chip">{f}</span>
                            ))}
                        </div>
                    )}

                    {/* 요약 */}
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