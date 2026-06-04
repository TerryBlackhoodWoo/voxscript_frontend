import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ScriptView from './components/ScriptView'
import SettingsPanel from './components/SettingsPanel'
import './App.css'

function App() {
  const [projects, setProjects] = useState([
    { id: 1, title: '젠슨황_AI_로봇_그리고_미래', date: '2025-06-04', lang: 'en' },
    { id: 2, title: '더_보이즈_시즌5_결말과_현실', date: '2025-06-03', lang: 'ja' },
  ])
  const [selectedProject, setSelectedProject] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')

  // 설정 패널 상태
  const [settings, setSettings] = useState({
    sourceUrl: '',
    lang: 'auto',
    format: 'all',
    diarize: false,
    speaker1: '인터뷰어',
    speaker2: '인터뷰이',
    noSummary: false,
  })

  const handleStart = async () => {
    if (!settings.sourceUrl.trim()) return
    setIsProcessing(true)
    setProgress(5)
    setProgressMsg('처리 시작 중...')

    const API_BASE = 'http://localhost:8765'

    try {
      // Step 1: 처리 시작 → job_id 받기
      const res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: settings.sourceUrl,
          language: settings.lang,
          formats: [settings.format],
          use_summary: !settings.noSummary,
        }),
      })
      const job = await res.json()
      const jobId = job.job_id

      // Step 2: 진행상태 polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/status/${jobId}`)
          const status = await statusRes.json()

          setProgress(status.progress ?? 0)
          setProgressMsg(status.step ?? '')

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