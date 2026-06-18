import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ScriptView from './components/ScriptView'
import SettingsPanel from './components/SettingsPanel'
import LabelingView from './components/LabelingView'
import SavePanel from './components/SavePanel'
import './App.css'

const API_BASE = 'http://localhost:8765'

// 단계 구분
const STAGE_PROCESSING = ['downloading', 'transcribing', 'cleaning', 'diarizing', 'translating']
const STAGE_LABELING = 'labeling'
const STAGE_SAVING = 'saving'
const STAGE_DONE = 'done'
const STAGE_ERROR = 'error'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeProject, setActiveProject] = useState(null)  // 현재 처리 중인 프로젝트
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [logs, setLogs] = useState([])
  const [elapsedTime, setElapsedTime] = useState('')
  const startTimeRef = useRef(null)
  const pollRef = useRef(null)

  const [settings, setSettings] = useState({
    sourceUrl: '',
    lang: 'auto',
    format: 'all',
    diarize: false,
    diarizeMode: 'auto',
    speakers: ['인터뷰어', '인터뷰이'],
    noSummary: false,
  })

  // 프로젝트 목록 polling
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE}/projects`)
        const data = await res.json()
        // 완료/오류 + 라벨링·저장 대기(유저 입력 기다리는 진짜 일시정지)까지 표시
        // (다운로드/STT/전처리 중처럼 처리 스레드 없이는 의미 없는 단계는 계속 숨김)
        setProjects(
          data.filter(
            p => p.is_done || p.has_error || p.stage === 'labeling' || p.stage === 'saving'
          )
        )
      } catch { }
    }
    fetchProjects()
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [])

  // 경과시간 타이머
  useEffect(() => {
    if (!isProcessing) return
    const timer = setInterval(() => {
      if (!startTimeRef.current) return
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const m = Math.floor(elapsed / 60)
      const s = elapsed % 60
      setElapsedTime(`${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [isProcessing])

  // 상태 polling
  const startPolling = (projectId) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/status/${projectId}`)
        const status = await res.json()

        setProgress(status.stage_progress ?? 0)
        setProgressMsg(status.stage ?? '')
        if (status.log) setLogs(status.log)

        // 단계별 처리
        if (STAGE_PROCESSING.includes(status.stage)) {
          setIsProcessing(true)
          setActiveProject(status)
        } else if (status.stage === STAGE_LABELING) {
          // 라벨링 대기 → polling 멈추고 UI 전환
          clearInterval(pollRef.current)
          setIsProcessing(false)
          setActiveProject(status)
        } else if (status.stage === STAGE_SAVING) {
          clearInterval(pollRef.current)
          setIsProcessing(false)
          setActiveProject(status)
        } else if (status.stage === STAGE_DONE) {
          clearInterval(pollRef.current)
          setIsProcessing(false)
          setProgress(100)
          if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            const m = Math.floor(elapsed / 60)
            const s = elapsed % 60
            setElapsedTime(`${m}m ${s}s`)
          }
          setActiveProject(status)
        } else if (status.stage === STAGE_ERROR) {
          clearInterval(pollRef.current)
          setIsProcessing(false)
          alert(`오류: ${status.error_msg}`)
        }
      } catch {
        clearInterval(pollRef.current)
        setIsProcessing(false)
      }
    }, 1000)
  }

  // 처리 시작
  const handleStart = async () => {
    if (!settings.sourceUrl.trim() || isProcessing) return
    setIsProcessing(true)
    setProgress(5)
    setProgressMsg('처리 시작 중...')
    setElapsedTime('')
    setLogs([])
    setActiveProject(null)
    startTimeRef.current = Date.now()

    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: settings.sourceUrl,
          lang: settings.lang,
          format: settings.format,
          use_summary: !settings.noSummary,
        }),
      })
      const project = await res.json()
      setActiveProject(project)
      startPolling(project.project_id)
    } catch (e) {
      setIsProcessing(false)
      alert(`연결 실패: ${e.message}`)
    }
  }

  // 라벨링 완료 → resume
  const handleLabelingSubmit = async (labeledSegments, speakers, editedRows) => {
    if (!activeProject) return
    setIsProcessing(true)
    startPolling(activeProject.project_id)

    try {
      await fetch(`${API_BASE}/resume/${activeProject.project_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labeled_segments: labeledSegments,
          speakers: speakers,
          // 유저가 편집/분리/병합한 세그먼트 전체 전달 (텍스트 수정 반영)
          edited_segments: editedRows
            ? editedRows.map(r => ({
              index: r.index,
              start: r.start,
              end: r.end,
              text: r.text,
              speaker: r.speaker || null,
            }))
            : null,
        }),
      })
    } catch (e) {
      setIsProcessing(false)
      alert(`오류: ${e.message}`)
    }
  }

  // 라벨링 스킵
  const handleLabelingSkip = async () => {
    await handleLabelingSubmit([], [])
  }

  // 저장
  const handleSave = async (exportDir, formats) => {
    if (!activeProject) return
    setIsProcessing(true)
    startPolling(activeProject.project_id)

    try {
      await fetch(`${API_BASE}/save/${activeProject.project_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ export_dir: exportDir, formats }),
      })
    } catch (e) {
      setIsProcessing(false)
      alert(`오류: ${e.message}`)
    }
  }

  // 프로젝트 선택/이어하기
  const handleProjectSelect = async (project) => {
    try {
      const res = await fetch(`${API_BASE}/load/${project.project_id}`)
      const data = await res.json()
      setSelectedProject(data)  // 완전한 데이터로 설정
      setActiveProject(data)
      setLogs(data.log || [])

      // 미완성 프로젝트면 polling 재개
      if (STAGE_PROCESSING.includes(data.stage)) {
        setIsProcessing(true)
        startPolling(data.project_id)
      }
    } catch (e) {
      alert(`프로젝트 로드 실패: ${e.message}`)
    }
  }

  const handleStop = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setIsProcessing(false)
    setProgress(0)
    setProgressMsg('')
    startTimeRef.current = null
  }

  // 현재 표시할 중앙 컨텐츠 결정
  const renderCenter = () => {
    // 처리 중일 때만 단계별 화면 전환
    if (isProcessing || activeProject?.stage === STAGE_LABELING || activeProject?.stage === STAGE_SAVING) {
      if (activeProject?.stage === STAGE_LABELING) {
        return (
          <LabelingView
            project={activeProject}
            onSubmit={handleLabelingSubmit}
            onSkip={handleLabelingSkip}
          />
        )
      }
      if (activeProject?.stage === STAGE_SAVING) {
        return (
          <SavePanel
            project={activeProject}
            onSave={handleSave}
            onHome={() => {
              setActiveProject(null)
              setSelectedProject(null)
              setLogs([])
              setElapsedTime('')
            }}
          />
        )
      }
    }
    // 완료/선택된 프로젝트 → 요약 뷰
    return (
      <ScriptView
        project={activeProject || selectedProject}
        isProcessing={isProcessing}
        progress={progress}
        progressMsg={progressMsg}
        logs={logs}
        elapsedTime={elapsedTime}
      />
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelect={handleProjectSelect}
        onHome={() => {
          setActiveProject(null)
          setSelectedProject(null)
          setLogs([])
          setElapsedTime('')
        }}
      />
      {renderCenter()}
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        onStart={handleStart}
        onStop={handleStop}
        isProcessing={isProcessing}
        currentStage={activeProject?.stage}
      />
    </div>
  )
}

export default App