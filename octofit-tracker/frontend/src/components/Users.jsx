import { useMemo, useState } from 'react'
import { RefreshCw, UserRound } from 'lucide-react'
import { useCollection } from '../hooks/useCollection.js'
import { PageHeader, ResourceFeedback } from './ResourceFeedback.jsx'

export default function UsersView({ token }) {
  const { items, loading, error, refresh } = useCollection('/users/', token)
  const [query, setQuery] = useState('')
  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return items
    return items.filter((user) => `${user.displayName} ${user.username} ${user.fitnessLevel} ${(user.goals || []).join(' ')}`.toLowerCase().includes(normalizedQuery))
  }, [items, query])

  return (
    <>
      <PageHeader
        action={<button aria-label="Refresh athletes" className="icon-button" onClick={refresh} title="Refresh" type="button"><RefreshCw size={18} /></button>}
        icon={UserRound}
        kicker="THE OCTOFIT COMMUNITY"
        subtitle="Get to know the athletes showing up this season."
        title="Athletes"
      />
      <section className="directory-tools" aria-label="Athlete directory controls">
        <label className="visually-hidden" htmlFor="athlete-search">Search athletes</label>
        <input className="form-control search-input" id="athlete-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, level, or goal" type="search" value={query} />
        <span className="record-count">{filteredUsers.length} of {items.length} athletes</span>
      </section>
      <section className="data-section" aria-label="Athlete directory">
        <ResourceFeedback empty={!filteredUsers.length} emptyLabel={query ? 'No athletes match that search.' : 'No athletes are registered yet.'} error={error} loading={loading} />
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="table-responsive">
            <table className="table data-table">
              <thead><tr><th>ATHLETE</th><th>FITNESS LEVEL</th><th>GOALS</th><th>POINTS</th></tr></thead>
              <tbody>{filteredUsers.map((user) => (
                <tr key={user._id || user.id}>
                  <td><div className="person-cell"><span aria-hidden="true" className="avatar">{(user.displayName || user.username || '?').slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName || user.username}</strong><small>@{user.username}</small></div></div></td>
                  <td><span className={`level-tag level-${user.fitnessLevel || 'beginner'}`}>{user.fitnessLevel || 'beginner'}</span></td>
                  <td><div className="goal-tags">{(user.goals || []).length ? user.goals.map((goal) => <span className="goal-tag" key={goal}>{goal}</span>) : <span className="muted-copy">Goals not set</span>}</div></td>
                  <td><strong className="points-value">{Number(user.points || 0).toLocaleString()}</strong></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}