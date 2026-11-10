import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { Customer } from '../../../types/customer'
import './customer.css'

export default function GetAllCustomers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchCustomers = async () => {
      try {
        const response = await axios.get<Customer[]>(`${process.env.REACT_APP_BACKEND_URL}/api/customers/getAllCustomers`, { withCredentials: true, signal: controller.signal })
        setCustomers(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load customers.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchCustomers()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5 oz-page-with-fab">
        <div className="customer-page">
          <Link to="/adminDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Customers</h1>
            <p className="oz-eyebrow mb-0">Select a customer to see their details</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading customers...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && customers.length === 0 && (
            <p className="oz-empty-state">No customers yet. Press + to add your first one.</p>
          )}

          {customers.length > 0 && (
            <div className="mb-3">
              <label htmlFor="customer_search" className="form-label">Search customers</label>
              <SearchSelect
                id="customer_search"
                value=""
                options={customers.map(customer => ({ value: String(customer.customer_id), label: customer.customer_name }))}
                onChange={selectedId => navigate(`/customers/${selectedId}`)}
                placeholder="Search by customer name"
                noMatchText="No customers found"
              />
            </div>
          )}

          {customers.length > 0 && (
            <ul className="oz-list">
              {customers.map(customer => (
                <li key={customer.customer_id}>
                  <Link to={`/customers/${customer.customer_id}`} className="oz-list-row">
                    <span className="oz-list-row-title">{customer.customer_name}</span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Link to="/customers/create" className="oz-fab" aria-label="Add customer" title="Add customer">+</Link>
    </div>
  )
}
