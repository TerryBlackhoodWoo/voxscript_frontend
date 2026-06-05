import { useState } from 'react'

function LabelingView({ project, onSubmit, onSkip }) {
    const [labels, setLabels] = useState({})
    const [speakerInput, setSpeakerInput] = useState('')
    const [speakers, setSpeakers] = useState(['VOX1'])  // 기본값 VOX1 하나

    const segments = project?.segments || []
    const sampleSegs = segments.slice(0, 30)

    const setLabel = (index, speaker) => {
        setLabels(prev => ({ ...prev, [index]: speaker }))
    }

    const addSpeaker = () => {
        if (speakerInput.trim() && !speakers.includes(speakerInput.trim())) {
            setSpeakers(prev => [...prev, speakerInput.trim()])
            setSpeakerInput('')
        }
    }

    const removeSpeaker = (idx) => {
        if (speakers.length <= 1) return
        const removed = speakers[idx]
        setSpeakers(prev => prev.filter((_, i) => i !== idx))
        // 해당 화자로 라벨링된 것들 제거
        setLabels(prev => {
            const next = { ...prev }
            Object.keys(next).forEach(k => {
                if (next[k] === removed) delete next[k]
            })
            return next
        })
    }

    const updateSpeaker = (idx, value) => {
        const old = speakers[idx]
        setSpeakers(prev => {
            const next = [...prev]
            next[idx] = value
            return next
        })
        // 기존 라벨도 업데이트
        setLabels(prev => {
            const next = { ...prev }
            Object.keys(next).forEach(k => {
                if (next[k] === old) next[k] = value
            })
            return next
        })
    }

    const handleSubmit = () => {
        const labeled = Object.entries(labels).map(([index, speaker]) => ({
            index: parseInt(index),
            speaker,
        }))
        onSubmit(labeled, speakers)
    }

    return (
        <div className="labeling-view">
            <div className="labeling-header">
                <div>
                    <h2 className="labeling-title">화자 라벨링</h2>
                    <p className="labeling-sub">
                        일부 세그먼트에 화자를 지정하면 나머지는 AI가 자동으로 채웁니다.
                        스킵하면 AI가 전체를 자동 처리합니다.
                    </p>
                </div>
                <div className="labeling-actions">
                    <button className="btn-skip" onClick={onSkip}>
                        스킵 (AI 자동)
                    </button>
                    <button className="btn-submit" onClick={handleSubmit}>
                        확인 ({Object.keys(labels).length}개 라벨링됨)
                    </button>
                </div>
            </div>

            {/* 화자 목록 편집 */}
            <div className="speaker-list-bar">
                <span className="speaker-list-label">화자 목록:</span>
                {speakers.map((s, i) => (
                    <div key={i} className="speaker-edit-item">
                        <span className={`speaker-dot speaker-color-${i % 6}`} />
                        <input
                            className="speaker-name-input"
                            value={s}
                            onChange={e => updateSpeaker(i, e.target.value)}
                        />
                        {speakers.length > 1 && (
                            <button className="speaker-remove-btn" onClick={() => removeSpeaker(i)}>✕</button>
                        )}
                    </div>
                ))}
                <div className="speaker-add-inline">
                    <input
                        type="text"
                        placeholder="+ 화자 추가"
                        value={speakerInput}
                        onChange={e => setSpeakerInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSpeaker()}
                    />
                    <button onClick={addSpeaker}>+</button>
                </div>
            </div>

            {/* 세그먼트 테이블 */}
            <div className="labeling-table">
                <div className="labeling-row header-row">
                    <span className="col-time">시간</span>
                    <span className="col-text">원문</span>
                    <span className="col-speaker-btns">화자</span>
                </div>
                {sampleSegs.map((seg) => (
                    <div
                        key={seg.index}
                        className={`labeling-row ${labels[seg.index] ? 'labeled' : ''}`}
                    >
                        <span className="col-time">{formatTime(seg.start)}</span>
                        <span className="col-text">{seg.text}</span>
                        <span className="col-speaker-btns">
                            {speakers.map((s, i) => (
                                <button
                                    key={i}
                                    className={`speaker-btn speaker-color-${i % 6} ${labels[seg.index] === s ? 'active' : ''}`}
                                    onClick={() => setLabel(seg.index, s)}
                                >
                                    {s}
                                </button>
                            ))}
                            {labels[seg.index] && (
                                <button
                                    className="speaker-btn-clear"
                                    onClick={() => {
                                        const next = { ...labels }
                                        delete next[seg.index]
                                        setLabels(next)
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            {segments.length > 30 && (
                <div className="labeling-footer-note">
                    앞 30개 세그먼트만 표시됩니다. 나머지 {segments.length - 30}개는 AI가 자동 처리합니다.
                </div>
            )}
        </div>
    )
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

export default LabelingView