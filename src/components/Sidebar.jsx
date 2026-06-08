const APP_VERSION = 'v0.4'  // ← 버전 여기서 수정

function Sidebar({ projects, selectedProject, onSelect, onHome }) {
    const stageLabel = (stage) => {
        const map = {
            init: '초기화',
            downloading: '다운로드 중',
            transcribing: 'STT 중',
            cleaning: '전처리 중',
            labeling: '⏸ 라벨링 대기',
            diarizing: '화자 구분 중',
            translating: '번역 중',
            saving: '저장 중',
            done: '✅ 완료',
            error: '❌ 오류',
        }
        return map[stage] || stage
    }

    const stageColor = (stage) => {
        if (stage === 'done') return 'stage-done'
        if (stage === 'error') return 'stage-error'
        if (stage === 'labeling') return 'stage-waiting'
        if (stage === 'saving') return 'stage-waiting'
        return 'stage-running'
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header" onClick={onHome} style={{ cursor: 'pointer' }}>
                <h1 className="logo">VOXScript</h1>
                <span className="version">{APP_VERSION}</span>
            </div>
            <div className="sidebar-section">
                <span className="section-label">프로젝트</span>
                {projects.length === 0 && (
                    <p className="empty-projects">처리된 프로젝트가 없습니다</p>
                )}
                <ul className="project-list">
                    {projects.map((project) => (
                        <li
                            key={project.project_id}
                            className={`project-item ${selectedProject?.project_id === project.project_id ? 'active' : ''}`}
                            onClick={() => onSelect(project)}
                        >
                            <span className="project-title">
                                {project.original_name.replace(/_/g, ' ')}
                            </span>
                            <span className={`project-stage ${stageColor(project.stage)}`}>
                                {stageLabel(project.stage)}
                            </span>
                            <span className="project-meta">
                                {new Date(project.updated_at * 1000).toLocaleDateString('ko-KR')}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export default Sidebar