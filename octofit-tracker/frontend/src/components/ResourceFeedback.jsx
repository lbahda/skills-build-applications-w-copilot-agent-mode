import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'

export function PageHeader({ action, icon: Icon, kicker, subtitle, title }) {
  return (
    <div className="page-heading">
      <div className="heading-copy">
        <span className="eyebrow">{kicker}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="heading-actions">
        {Icon && <Icon aria-hidden="true" className="heading-icon" size={30} strokeWidth={1.7} />}
        {action}
      </div>
    </div>
  )
}

export function ResourceFeedback({ empty, emptyLabel = 'Nothing here yet.', error, loading }) {
  if (loading) {
    return (
      <div aria-live="polite" className="resource-feedback loading-state">
        <LoaderCircle aria-hidden="true" className="spin" size={20} />
        <span>Loading records…</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="resource-feedback error-state" role="alert">
        <AlertCircle aria-hidden="true" size={20} />
        <span>{error}</span>
      </div>
    )
  }
  if (empty) {
    return (
      <div className="resource-feedback empty-state">
        <Inbox aria-hidden="true" size={23} />
        <span>{emptyLabel}</span>
      </div>
    )
  }
  return null
}