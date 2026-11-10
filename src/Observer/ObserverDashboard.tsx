import { Link } from 'react-router-dom'
import logo from '../assets/oz-logo-white.png'
import {handleLogout} from '../Logout/Logout'
import { useNavigate } from 'react-router-dom'
// Replace each '#' with the page's route when it is ready, e.g. '/observer/customers'
const managementOptions = [
  { title: 'Customers', description: 'View and manage customers', link: '/observer/customers' },
  { title: 'Invoices', description: 'Create and track invoices', link: '/observer/invoices' },
  { title: 'Return Invoices', description: 'Handle returned invoices', link: '/observer/returns' },
  { title: 'Items', description: 'Manage your items', link: '/observer/items' },
  { title: 'Summary', description: 'See an overview of activity', link: '/observer/summary' },
]

export default function ObserverDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container d-flex align-items-center justify-content-between">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
          <button className="logout-btn" onClick={() => handleLogout(navigate)}>Logout</button>
        </div>
      </header>

      <main className="container py-5">
        <div className="mb-5">
          <h1 className="oz-page-title">Observer Dashboard</h1>
          <p className="oz-eyebrow mb-0">Select an option to get started</p>
        </div>
        <section aria-labelledby="management-title">
          <h2 id="management-title" className="oz-section-title">Management</h2>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-5 g-4">
            {managementOptions.map(option => (
              <div className="col" key={option.title}>
                <Link to={option.link} className="oz-option-card">
                  <h3 className="oz-option-card-title">{option.title}</h3>
                  <p className="oz-option-card-text">{option.description}</p>
                  <span className="oz-option-card-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
