function Sidebar({ projects, selectedProject, onSelect }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="logo">VOXScript</h1>
                <span className="version">v0.1</span>
            </div>
            <div className="sidebar-section">
                <span className="section-label">프로젝트</span>
                <ul className="project-list">
                    {projects.map((project) => (
                        <li
                            key={project.id}
                            className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                            onClick={() => onSelect(project)}
                        >
                            <span className="project-title">{project.title.replace(/_/g, ' ')}</span>
                            <span className="project-meta">{project.date} · {project.lang.toUpperCase()}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export default Sidebar
