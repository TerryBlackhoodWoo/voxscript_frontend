import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ScriptView from './components/ScriptView'
import SettingsPanel from './components/SettingsPanel'
import './App.css'

const API_BASE = 'http://localhost:8765'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [logs, setLogs] = useState([])

  const [settings, setSettings] = useState({
    sourceUrl: '',
    lang: 'auto',
    format: 'all',
    diarize: false,
    speakers: ['인터뷰어', '인터뷰이'],  // 리스트로 변경
    noSummary: false,
  })

  // 완료된 작업 목록 polling
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs`)
        const jobs = await res.json()
        setProjects(jobs.map(job => ({
          id: job.job_id,
          title: job.files?.[0]?.replace(/_번역\.txt|_원문번역\.txt|\.xlsx|_병기\.srt|_번역\.srt|_요약\.txt/g, '').replace(/_/g, ' ') || job.job_id,
          date: new Date().toISOString().slice(0, 10),
          files: job.files || [],
          summary: job.summary || '',
        })))
      } catch {
        // FastAPI 꺼져있으면 무시
      }
    }
    fetchJobs()
    const interval = setInterval(fetchJobs, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleStart = async () => {
    if (!settings.sourceUrl.trim() || isProcessing) return  // 중복 방지
    setIsProcessing(true)
    setProgress(5)
    setProgressMsg('처리 시작 중...')

    try {
      const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: settings.sourceUrl,
          language: settings.lang,
          formats: [settings.format],
          use_summary: !settings.noSummary,
          diarize: settings.diarize,
          speakers: settings.diarize ? settings.speakers : [],
        }),
      })
      const job = await res.json()
      const jobId = job.job_id

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/status/${jobId}`)
          const status = await statusRes.json()

          setProgress(status.progress ?? 0)
          setProgressMsg(status.step ?? '')
          if (status.log) setLogs(status.log)

          if (status.status === 'done') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            setProgress(100)
            setProgressMsg('완료!')
          } else if (status.status === 'error') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            alert(`오류: ${status.error}`)
          }
        } catch {
          clearInterval(pollInterval)
          setIsProcessing(false)
        }
      }, 1000)

    } catch (e) {
      setIsProcessing(false)
      alert(`연결 실패: ${e.message}\nFastAPI 서버가 실행 중인지 확인해주세요.`)
    }
  }

  const handleStop = () => {
    setIsProcessing(false)
    setProgress(0)
    setProgressMsg('')
  }

  return (
    <div className="app-layout">
      <Sidebar
        projects={projects}
        selectedProject={selectedProject}
        onSelect={setSelectedProject}
      />
      <ScriptView
        project={selectedProject}
        isProcessing={isProcessing}
        progress={progress}
        progressMsg={progressMsg}
        logs={logs}
      />
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        onStart={handleStart}
        onStop={handleStop}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default App