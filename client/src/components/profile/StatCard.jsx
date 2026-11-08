function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-soft">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-bold tracking-tight">{value}</dd>
      {detail && <dd className="mt-1 text-sm text-muted">{detail}</dd>}
    </div>
  )
}

export default StatCard
