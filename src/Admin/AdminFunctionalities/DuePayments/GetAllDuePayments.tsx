import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { DuePaymentSummary } from '../../../types/duePayment'
import './DuePayments.css'

const formatMoney = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function GetAllDuePayments() {
  const navigate = useNavigate()
  const [duePayments, setDuePayments] = useState<DuePaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchDuePayments = async () => {
      try {
        const response = await axios.get<DuePaymentSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/duePayments/getDuePayments`, { withCredentials: true, signal: controller.signal })
        setDuePayments(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load due payments.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchDuePayments()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="due-page">
          <Link to="/adminDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Due Payments</h1>
            <p className="oz-eyebrow mb-0">Customers that still owe money. Select one to see their balance</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading due payments...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && duePayments.length === 0 && (
            <p className="oz-empty-state">No due payments. Every customer is fully paid.</p>
          )}

          {duePayments.length > 0 && (
            <div className="mb-3">
              <label htmlFor="due_search" className="form-label">Search due payments</label>
              <SearchSelect
                id="due_search"
                value=""
                options={duePayments.map(due => ({ value: String(due.due_payment_id), label: `Due Payment #${due.due_number} - ${due.customer_name}` }))}
                onChange={selectedId => navigate(`/duePayments/${selectedId}`)}
                placeholder="Search by number or customer"
                noMatchText="No due payments found"
              />
            </div>
          )}

          {duePayments.length > 0 && (
            <ul className="oz-list">
              {duePayments.map(due => (
                <li key={due.due_payment_id}>
                  <Link to={`/duePayments/${due.due_payment_id}`} className="oz-list-row">
                    <span className="due-row-text">
                      <span className="oz-list-row-title">Due Payment #{due.due_number}</span>
                      <span className="due-row-customer">{due.customer_name} &middot; {formatMoney(due.balance)} due</span>
                    </span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
