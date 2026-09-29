import { Trophy, RefreshCw } from 'lucide-react'
import { useCollection } from '../hooks/useCollection.js'
import { PageHeader, ResourceFeedback } from './ResourceFeedback.jsx'

function currentMonth() {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date())
}

export default function Leaderboard({ token }) {
  const { items, loading, error, refresh, payload } = useCollection('/api/leaderboard/', token)
  const periodLabel = payload?.period || currentMonth()

  return (
    <>
      <PageHeader
        action={<button aria-label="Refresh leaderboard" className="icon-button" onClick={refresh} title="Refresh" type="button"><RefreshCw size={18} /></button>}
        icon={Trophy}
        kicker="FRIENDLY COMPETITION"
        subtitle="Every activity counts. Keep showing up for your team."
        title="Leaderboard"
      />
      <section className="ranking-period">
        <span className="eyebrow">CURRENT PERIOD</span>
        <strong>{periodLabel}</strong>
        <span className="record-count">{items.length} ranked athletes</span>
      </section>
      <section className="data-section" aria-label="Leaderboard rankings">
        <ResourceFeedback empty={!items.length} emptyLabel="Log an activity to earn the first points." error={error} loading={loading} />
        {!loading && !error && items.length > 0 && (
          <div className="table-responsive">
            <table className="table data-table ranking-table">
              <thead><tr><th>RANK</th><th>ATHLETE</th><th>POINTS</th><th>PERIOD</th></tr></thead>
              <tbody>{items.map((entry, index) => {
                const user = entry.user || {}
                const rank = Number(entry.rank) || index + 1
                return (
                  <tr className={rank === 1 ? 'leader-row' : ''} key={entry._id || entry.id || user._id || index}>
                    <td><span className={`rank-number${rank <= 3 ? ` rank-top rank-${rank}` : ''}`}>{String(rank).padStart(2, '0')}</span></td>
                    <td><div className="person-cell"><span aria-hidden="true" className="avatar">{(user.displayName || user.username || '?').slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName || user.username || 'Athlete'}</strong><small>@{user.username || 'member'}</small></div></div></td>
                    <td><strong className="points-value">{Number(entry.points || 0).toLocaleString()} pts</strong></td>
                    <td>{entry.period || periodLabel}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}