import { Dumbbell, RefreshCw } from 'lucide-react'
import { useCollection } from '../hooks/useCollection.js'
import { PageHeader, ResourceFeedback } from './ResourceFeedback.jsx'

function WorkoutRows({ items }) {
  return (
    <div className="workout-list">
      {items.map((workout) => (
        <article className="workout-row" key={workout._id || workout.id || workout.title}>
          <div aria-hidden="true" className={`workout-mark workout-${workout.category}`}><Dumbbell size={19} /></div>
          <div className="workout-copy"><div className="workout-title-line"><h3>{workout.title}</h3><span className="type-tag">{workout.category}</span></div><p>{workout.description}</p><div className="workout-meta"><span>{workout.durationMinutes} min</span><span>{workout.fitnessLevel === 'all' ? 'All levels' : workout.fitnessLevel}</span><span>{(workout.equipment || []).length ? workout.equipment.join(', ') : 'No equipment'}</span></div></div>
        </article>
      ))}
    </div>
  )
}

export default function Workouts({ token }) {
  const suggestions = useCollection('/workouts/suggestions/', token)
  const library = useCollection('/workouts/', token)

  return (
    <>
      <PageHeader
        action={<button aria-label="Refresh workouts" className="icon-button" onClick={() => { suggestions.refresh(); library.refresh() }} title="Refresh" type="button"><RefreshCw size={18} /></button>}
        icon={Dumbbell}
        kicker="A PLAN THAT FITS"
        subtitle="Choose a session that matches your level and goals."
        title="Workouts"
      />
      <section className="workout-section" aria-labelledby="suggestions-title">
        <div className="list-heading"><div><span className="eyebrow">PICKED FOR YOUR PROFILE</span><h2 id="suggestions-title">Suggested for you</h2></div></div>
        <ResourceFeedback empty={!suggestions.items.length} emptyLabel="Set a fitness level and goals in your profile for recommendations." error={suggestions.error} loading={suggestions.loading} />
        {!suggestions.loading && !suggestions.error && suggestions.items.length > 0 && <WorkoutRows items={suggestions.items} />}
      </section>
      <section className="workout-section library-section" aria-labelledby="library-title">
        <div className="list-heading"><div><span className="eyebrow">THE FULL COLLECTION</span><h2 id="library-title">Workout library</h2></div><span className="record-count">{library.items.length} sessions</span></div>
        <ResourceFeedback empty={!library.items.length} emptyLabel="The workout library is empty." error={library.error} loading={library.loading} />
        {!library.loading && !library.error && library.items.length > 0 && <WorkoutRows items={library.items} />}
      </section>
    </>
  )
}