import { useParams } from 'react-router'

export function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <section className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Client</h1>
      <p className="text-muted-foreground">Client details for ID {id}.</p>
    </section>
  )
}
