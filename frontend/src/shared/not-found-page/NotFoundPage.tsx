import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go home</Link>
    </div>
  )
}
