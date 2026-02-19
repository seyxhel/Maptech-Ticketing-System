import { fetchTickets } from './ticketService'

export async function fetchTasks() {
  const tickets = await fetchTickets()
  const tasks: any[] = []
  tickets.forEach((t: any) => {
    ;(t.tasks || []).forEach((task: any) => tasks.push({ ...task, ticket: t }))
  })
  return tasks
}
