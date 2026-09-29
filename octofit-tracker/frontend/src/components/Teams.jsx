import { useState } from 'react'
import { Plus, RefreshCw, UsersRound } from 'lucide-react'
import { apiRequest } from '../api.js'
import { useCollection } from '../hooks/useCollection.js'
import { PageHeader, ResourceFeedback } from './ResourceFeedback.jsx'

export default function Teams({ profile, token }) {
  const { items, loading, error, refresh } = useCollection('/api/teams/', token)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [busyTeam, setBusyTeam] = useState('')

  async function createTeam(event) {
    event.preventDefault()
    setBusyTeam('create')
    setFormError('')
    try {
      await apiRequest('/api/teams/', { token, method: 'POST', body: { name, description } })
      setName('')
      setDescription('')
      refresh()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setBusyTeam('')
    }
  }

  async function joinTeam(teamId) {
    setBusyTeam(teamId)
    setFormError('')
    try {
      await apiRequest(`/api/teams/${teamId}/join/`, { token, method: 'POST' })
      refresh()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setBusyTeam('')
    }
  }

  return (
    <>
      <PageHeader
        action={<button aria-label="Refresh teams" className="icon-button" onClick={refresh} title="Refresh" type="button"><RefreshCw size={18} /></button>}
        icon={UsersRound}
        kicker="BETTER TOGETHER"
        subtitle="Find your people and make consistency a team sport."
        title="Teams"
      />
      <section className="team-create" aria-labelledby="team-create-title">
        <div className="section-heading"><div className="section-icon"><Plus size={18} /></div><div><span className="eyebrow">START A CREW</span><h2 id="team-create-title">Create a team</h2></div></div>
        <form className="team-form" onSubmit={createTeam}>
          <label className="visually-hidden" htmlFor="team-name">Team name</label>
          <input className="form-control" id="team-name" maxLength="40" minLength="2" onChange={(event) => setName(event.target.value)} placeholder="Team name" required value={name} />
          <label className="visually-hidden" htmlFor="team-description">Team description</label>
          <input className="form-control" id="team-description" maxLength="500" onChange={(event) => setDescription(event.target.value)} placeholder="A few words about your team" value={description} />
          <button className="btn btn-primary" disabled={busyTeam === 'create'} type="submit"><Plus size={17} />Create</button>
        </form>
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </section>
      <section className="team-list" aria-label="Available teams">
        <div className="list-heading"><div><span className="eyebrow">FIND YOUR GROUP</span><h2>All teams</h2></div><span className="record-count">{items.length} teams</span></div>
        <ResourceFeedback empty={!items.length} emptyLabel="No teams yet. Create the first one." error={error} loading={loading} />
        {!loading && !error && items.length > 0 && (
          <div className="team-grid">
            {items.map((team) => {
              const teamId = team._id || team.id
              const profileId = profile?.id || profile?._id
              const isMember = (team.members || []).some((member) => String(member?._id || member?.id || member) === String(profileId))
              const alreadyJoined = String(profile?.team || '') === String(teamId) || isMember
              return (
                <article className="team-row" key={teamId}>
                  <div aria-hidden="true" className="team-mark"><UsersRound size={21} /></div>
                  <div className="team-copy"><h3>{team.name}</h3><p>{team.description || 'Ready to move together.'}</p><span>{team.memberCount ?? team.members?.length ?? 0} members · Captain {team.captain?.displayName || team.captain?.username || '—'}</span></div>
                  <button className={`btn ${alreadyJoined ? 'btn-outline-secondary' : 'btn-outline-primary'}`} disabled={alreadyJoined || busyTeam === teamId} onClick={() => joinTeam(teamId)} type="button">
                    {alreadyJoined ? 'Joined' : busyTeam === teamId ? 'Joining…' : 'Join team'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}