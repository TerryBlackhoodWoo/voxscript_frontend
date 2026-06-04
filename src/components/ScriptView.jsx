const MOCK_SEGMENTS = [
    { index: 0, start: '00:00:00,000', end: '00:00:03,600', speaker: '진행자', original: 'What is the vision for what you see coming next?', translated: '앞으로 어떤 미래가 펼쳐질 것으로 보시나요?' },
    { index: 1, start: '00:00:03,600', end: '00:00:09,000', speaker: '젠슨황', original: 'Everything that moves will be robotic someday, and it will be soon.', translated: '언젠가는 움직이는 모든 것이 로봇이 될 것입니다, 그리고 곧 그렇게 될 것입니다.' },
    { index: 2, start: '00:00:09,000', end: '00:00:17,000', speaker: '젠슨황', original: 'We invested tens of billions of dollars before it really happened.', translated: '우리는 그 일이 실제로 일어나기 전에 수백억 달러를 투자했습니다.' },
    { index: 3, start: '00:00:17,000', end: '00:00:22,039', speaker: '진행자', original: "No, that's very good. You did some research.", translated: '아니요, 아주 좋아요. 조사를 좀 했군요.' },
]

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
    const segments = project ? MOCK_SEGMENTS : []

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
                        <h2 className="script-title">{project.title.replace(/_/g, ' ')}</h2>
                        <span className="script-meta">{project.date} · {project.lang.toUpperCase()}</span>
                    </div>
                    <div className="script-table">
                        <div className="script-row header-row">
                            <span className="col-time">시간</span>
                            <span className="col-speaker">화자</span>
                            <span className="col-original">원문</span>
                            <span className="col-translated">번역</span>
                        </div>
                        {segments.map((seg) => (
                            <div key={seg.index} className="script-row">
                                <span className="col-time">{seg.start}</span>
                                <span className={`col-speaker speaker-${seg.speaker === '진행자' ? 'a' : 'b'}`}>
                                    {seg.speaker}
                                </span>
                                <span className="col-original">{seg.original}</span>
                                <span className="col-translated">{seg.translated}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}

export default ScriptView 
