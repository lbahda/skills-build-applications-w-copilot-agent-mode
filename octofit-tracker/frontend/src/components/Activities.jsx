import { useMemo, useState } from 'react'
import { Activity as ActivityIcon, Plus, RefreshCw } from 'lucide-react'
import { apiRequest } from '../api.js'
import { useCollection } from '../hooks/useCollection.js'
import { PageHeader, ResourceFeedback } from './ResourceFeedback.jsx'

const activityTypes = [
  ['running', 'Run'],
  ['walking', 'Walk'],
  ['strength', 'Strength'],
  ['cycling', 'Cycle'],
  ['other', 'Other'],
]

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export default function Activities({ token }) {
  const { items, loading, error, refresh } = useCollection('/activities/', token)
  const [form, setForm] = useState({ type: 'running', durationMinutes: '', distanceKm: '', notes: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const totals = useMemo(() => items.reduce((result, activity) => ({
    minutes: result.minutes + (Number(activity.durationMinutes) || 0),
    points: result.points + (Number(activity.points) || 0),
  }), { minutes: 0, points: 0 }), [items])

  async function submitActivity(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await apiRequest('/activities/', {
        token,
        method: 'POST',
        body: {
          type: form.type,
          durationMinutes: Number(form.durationMinutes),
          ...(form.distanceKm === '' ? {} : { distanceKm: Number(form.distanceKm) }),
          notes: form.notes,
        },
      })
      setForm({ type: 'running', durationMinutes: '', distanceKm: '', notes: '' })
      refresh()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        action={<button aria-label="Refresh activities" className="icon-button" onClick={refresh} title="Refresh" type="button"><RefreshCw size={18} /></button>}
        icon={ActivityIcon}
        kicker="YOUR MOVEMENT"
        subtitle="Log a session and keep your momentum going."
        title="Activities"
      />
      <section aria-label="Activity totals" className="metric-strip">
        <div><span>RECENT SESSIONS</span><strong>{items.length}</strong></div>
        <div><span>MINUTES MOVED</span><strong>{totals.minutes.toLocaleString()}</strong></div>
        <div><span>POINTS EARNED</span><strong>{totals.points.toLocaleString()}</strong></div>
      </section>
      <div className="activity-layout">
        <section className="activity-composer" aria-labelledby="activity-form-title">
          <div className="section-heading">
            <div className="section-icon"><Plus size={18} /></div>
            <div><span className="eyebrow">QUICK ENTRY</span><h2 id="activity-form-title">Log activity</h2></div>
          </div>
          <form className="activity-form" onSubmit={submitActivity}>
            <label className="form-label" htmlFor="activity-type">Activity</label>
            <select className="form-select" id="activity-type" onChange={(event) => setForm({ ...form, type: event.target.value })} value={form.type}>
              {activityTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <div className="form-row">
              <div>
                <label className="form-label" htmlFor="activity-duration">Minutes</label>
                <input className="form-control" id="activity-duration" min="1" max="600" onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} required type="number" value={form.durationMinutes} />
              </div>
              <div>
                <label className="form-label" htmlFor="activity-distance">Distance (km)</label>
                <input className="form-control" id="activity-distance" min="0" step="0.1" onChange={(event) => setForm({ ...form, distanceKm: event.target.value })} type="number" value={form.distanceKm} />
              </div>
            </div>
            <label className="form-label" htmlFor="activity-notes">Notes <span className="optional-label">OPTIONAL</span></label>
            <input className="form-control" id="activity-notes" maxLength="500" onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="How did it feel?" value={form.notes} />
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="btn btn-primary w-100" disabled={saving} type="submit">
              <Plus aria-hidden="true" size={17} />{saving ? 'Saving…' : 'Save activity'}
            </button>
          </form>
        </section>
        <section className="activity-list" aria-labelledby="activity-list-title">
          <div className="list-heading"><div><span className="eyebrow">LATEST FIRST</span><h2 id="activity-list-title">Recent sessions</h2></div><span className="record-count">{items.length} records</span></div>
          <ResourceFeedback empty={!items.length} emptyLabel="Your first session is waiting to be logged." error={error} loading={loading} />
          {!loading && !error && items.length > 0 && (
            <div className="table-responsive">
              <table className="table data-table activity-table">
                <thead><tr><th>SESSION</th><th>TYPE</th><th>TIME</th><th>DISTANCE</th><th>POINTS</th></tr></thead>
                <tbody>{items.map((activity) => (
                  <tr key={activity._id || activity.id}>
                    <td><strong>{activity.notes?.replace(/^Seed activity: /, '') || `${activity.type} session`}</strong><small>{formatDate(activity.createdAt)}</small></td>
                    <td><span className={`type-tag type-${activity.type}`}>{activity.type}</span></td>
                    <td>{activity.durationMinutes} min</td>
                    <td>{activity.distanceKm == null ? '—' : `${activity.distanceKm} km`}</td>
                    <td><strong className="points-value">+{activity.points}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}