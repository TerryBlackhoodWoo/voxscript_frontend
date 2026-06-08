import { useState, useRef, useCallback } from 'react'

// ── 타임스탬프 포맷 ──────────────────────────────────────────────
function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

// ── 글자 수 비율로 타임스탬프 분배 ──────────────────────────────
function splitTimestamp(start, end, textA, textB) {
    const total = textA.length + textB.length
    if (total === 0) return { endA: start, startB: end }
    const ratio = textA.length / total
    const mid = start + (end - start) * ratio
    return { endA: mid, startB: mid }
}

// ── 화자 색상 ────────────────────────────────────────────────────
const SPEAKER_COLORS = [
    '#E07B39', // orange
    '#4A90D9', // blue
    '#5BAD6F', // green
    '#C45C8A', // pink
    '#9B6DD6', // purple
    '#D4A017', // gold
]

function getSpeakerColor(speakers, name) {
    const idx = speakers.indexOf(name)
    return idx >= 0 ? SPEAKER_COLORS[idx % SPEAKER_COLORS.length] : '#aaa'
}

// ── 단일 행 컴포넌트 ─────────────────────────────────────────────
function SegmentRow({ row, rowIdx, speakers, isEditing, isSelected,
    onSelect, onTextChange, onTextBlur, onSplitHere, onMergeDown,
    onSpeakerChange, canMerge }) {

    const textareaRef = useRef(null)
    const color = getSpeakerColor(speakers, row.speaker)

    const handleSplitClick = () => {
        const ta = textareaRef.current
        if (!ta) return
        const cursor = ta.selectionStart
        if (cursor === 0 || cursor === row.text.length) return
        onSplitHere(rowIdx, cursor)
    }

    return (
        <div
            className={`seg-row ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
            style={{ '--speaker-color': color }}
            onClick={() => !isEditing && onSelect(rowIdx)}
        >
            {/* 화자 컬럼 */}
            <div className="seg-speaker">
                <select
                    className="speaker-select"
                    value={row.speaker || ''}
                    style={{ borderColor: color, color: color }}
                    onChange={e => onSpeakerChange(rowIdx, e.target.value)}
                    onClick={e => e.stopPropagation()}
                >
                    <option value="">-- 미지정 --</option>
                    {speakers.map((s, i) => (
                        <option key={i} value={s}>{s}</option>
                    ))}
                </select>
                <span className="seg-time">{formatTime(row.start)}</span>
            </div>

            {/* 텍스트 컬럼 */}
            <div className="seg-text-col">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="seg-textarea"
                        value={row.text}
                        autoFocus
                        onChange={e => onTextChange(rowIdx, e.target.value)}
                        onBlur={() => onTextBlur()}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <p className="seg-text" onClick={() => onSelect(rowIdx)}>{row.text}</p>
                )}
            </div>

            {/* 액션 컬럼 */}
            <div className="seg-actions" onClick={e => e.stopPropagation()}>
                {isEditing && (
                    <button
                        className="action-btn split-btn"
                        title="커서 위치에서 분리"
                        onClick={handleSplitClick}
                    >
                        ✂ 분리
                    </button>
                )}
                {canMerge && (
                    <button
                        className="action-btn merge-btn"
                        title="아래 행과 병합"
                        onClick={() => onMergeDown(rowIdx)}
                    >
                        ⊕ 병합
                    </button>
                )}
            </div>
        </div>
    )
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
function LabelingView({ project, onSubmit, onSkip }) {
    const segments = project?.segments || []

    // rows: 편집 가능한 로컬 복사본
    const [rows, setRows] = useState(() =>
        segments.map((seg, i) => ({
            ...seg,
            speaker: '',  // 항상 미지정으로 시작
        }))
    )

    const [speakers, setSpeakers] = useState([])
    const [speakerInput, setSpeakerInput] = useState('')
    const [selectedIdx, setSelectedIdx] = useState(null)
    const [editingIdx, setEditingIdx] = useState(null)

    // ── 화자 관리 ───────────────────────────────────────────────
    const addSpeaker = () => {
        const name = speakerInput.trim()
        if (name && !speakers.includes(name)) {
            setSpeakers(prev => [...prev, name])
            setSpeakerInput('')
        }
    }

    const updateSpeakerName = (idx, value) => {
        const old = speakers[idx]
        setSpeakers(prev => { const n = [...prev]; n[idx] = value; return n })
        setRows(prev => prev.map(r => r.speaker === old ? { ...r, speaker: value } : r))
    }

    const removeSpeaker = (idx) => {
        if (speakers.length <= 1) return
        const removed = speakers[idx]
        setSpeakers(prev => prev.filter((_, i) => i !== idx))
        setRows(prev => prev.map(r => r.speaker === removed ? { ...r, speaker: '' } : r))
    }

    // ── 행 편집 ─────────────────────────────────────────────────
    const handleSelect = (idx) => {
        setSelectedIdx(idx)
        setEditingIdx(idx)
    }

    const handleTextChange = (idx, value) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, text: value } : r))
    }

    const handleTextBlur = () => {
        // 편집 종료는 다른 행 클릭 시 자연스럽게
    }

    const handleSpeakerChange = (idx, value) => {
        setRows(prev => prev.map((r, i) => i === idx ? { ...r, speaker: value } : r))
    }

    // ── Split ────────────────────────────────────────────────────
    const handleSplit = useCallback((idx, cursorPos) => {
        setRows(prev => {
            const row = prev[idx]
            const textA = row.text.slice(0, cursorPos).trim()
            const textB = row.text.slice(cursorPos).trim()
            if (!textA || !textB) return prev

            const { endA, startB } = splitTimestamp(row.start, row.end, textA, textB)

            const newRows = [...prev]
            newRows.splice(idx, 1,
                { ...row, text: textA, end: endA },
                { ...row, index: row.index + 0.1, text: textB, start: startB, speaker: '' }
            )
            // index 재정렬
            return newRows.map((r, i) => ({ ...r, index: i }))
        })
        setEditingIdx(null)
        setSelectedIdx(null)
    }, [])

    // ── Merge ────────────────────────────────────────────────────
    const handleMergeDown = useCallback((idx) => {
        setRows(prev => {
            if (idx >= prev.length - 1) return prev
            const rowA = prev[idx]
            const rowB = prev[idx + 1]
            const merged = {
                ...rowA,
                text: rowA.text.trim() + ' ' + rowB.text.trim(),
                end: rowB.end,
            }
            const newRows = [...prev]
            newRows.splice(idx, 2, merged)
            return newRows.map((r, i) => ({ ...r, index: i }))
        })
        setEditingIdx(null)
        setSelectedIdx(null)
    }, [])

    // ── 제출 ─────────────────────────────────────────────────────
    const handleSubmit = () => {
        const labeled = rows
            .filter(r => r.speaker)
            .map(r => ({ index: r.index, speaker: r.speaker }))
        onSubmit(labeled, speakers, rows)  // rows도 같이 전달 (수정된 텍스트 반영)
    }

    const labeledCount = rows.filter(r => r.speaker).length

    return (
        <div className="labeling-view">
            {/* 헤더 */}
            <div className="labeling-header">
                <div>
                    <h2 className="labeling-title">스크립트 편집 · 화자 라벨링</h2>
                    <p className="labeling-sub">
                        행을 클릭해 텍스트를 수정하거나 화자를 지정하세요.
                        ✂ 분리로 한 행을 둘로 나누고, ⊕ 병합으로 합칠 수 있습니다.
                    </p>
                </div>
                <div className="labeling-actions">
                    <button className="btn-skip" onClick={onSkip}>스킵 (AI 자동)</button>
                    <button className="btn-submit" onClick={handleSubmit}>
                        확인 ({labeledCount}/{rows.length} 라벨링)
                    </button>
                </div>
            </div>

            {/* 화자 목록 바 */}
            <div className="speaker-list-bar">
                <span className="speaker-list-label">화자 목록</span>
                {speakers.map((s, i) => (
                    <div key={i} className="speaker-edit-item">
                        <span
                            className="speaker-dot"
                            style={{ background: SPEAKER_COLORS[i % SPEAKER_COLORS.length] }}
                        />
                        <input
                            className="speaker-name-input"
                            value={s}
                            onChange={e => updateSpeakerName(i, e.target.value)}
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

            {/* 편집 힌트 */}
            {editingIdx !== null && (
                <div className="edit-hint">
                    ✂ 분리: 텍스트에서 나눌 위치에 커서를 놓고 버튼 클릭
                </div>
            )}

            {/* 세그먼트 테이블 */}
            <div className="labeling-table">
                <div className="labeling-row header-row">
                    <span className="col-speaker-header">화자 / 시간</span>
                    <span className="col-text-header">발화 내용</span>
                    <span className="col-actions-header">편집</span>
                </div>

                {rows.map((row, idx) => (
                    <SegmentRow
                        key={`${row.index}-${idx}`}
                        row={row}
                        rowIdx={idx}
                        speakers={speakers}
                        isSelected={selectedIdx === idx}
                        isEditing={editingIdx === idx}
                        onSelect={handleSelect}
                        onTextChange={handleTextChange}
                        onTextBlur={handleTextBlur}
                        onSplitHere={handleSplit}
                        onMergeDown={handleMergeDown}
                        onSpeakerChange={handleSpeakerChange}
                        canMerge={idx < rows.length - 1}
                    />
                ))}
            </div>

            {segments.length > 30 && (
                <div className="labeling-footer-note">
                    전체 {rows.length}개 행 표시 중 · 수정 내용은 모두 반영됩니다
                </div>
            )}
        </div>
    )
}

export default LabelingView