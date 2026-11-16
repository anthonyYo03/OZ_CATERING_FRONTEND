import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { DuePayment, DuePaymentRow } from '../../../types/duePayment'
import { saveDuePaymentPdf, formatMonth } from '../../../utils/saveDuePaymentPdf'
import './DuePayments.css'

const pad = (value: number) => String(value).padStart(2, '0')
const formatMoney = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Today and this month in the user's own timezone
const now = () => new Date()
const today = () => `${now().getFullYear()}-${pad(now().getMonth() + 1)}-${pad(now().getDate())}`
const thisMonth = () => `${now().getFullYear()}-${pad(now().getMonth() + 1)}`
const isValidMonth = (month: string | null) => !!month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)

// Where each kind of entry opens
const entryLinks = { invoice: '/invoices', return: '/returns', receipt: '/receipts' }
const entryNames = { invoice: 'Invoice', return: 'Return', receipt: 'Receipt' }

// The amount goes in its own column, the other two stay empty
function AmountCell({ row, column }: { row: DuePaymentRow, column: DuePaymentRow['type'] }) {
  if (row.type !== column) return <td className="text-end due-table-empty-cell">&ndash;</td>
  return (
    <td className="text-end">
      {formatMoney(row.amount)}
      <Link to={`${entryLinks[row.type]}/${row.id}`} className="due-table-ref">{entryNames[row.type]} #{row.number}</Link>
    </td>
  )
}

export default function GetOneDuePayment() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlMonth = searchParams.get('month')
  const [month, setMonth] = useState(isValidMonth(urlMonth) ? (urlMonth as string) : thisMonth())
  const [duePayment, setDuePayment] = useState<DuePayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isValidMonth(month)) return
    const controller = new AbortController()
    setLoading(true)
    setError('')

    const fetchDuePayment = async () => {
      try {
        const response = await axios.get<DuePayment>(`${process.env.REACT_APP_BACKEND_URL}/api/duePayments/getDuePayment/${id}`, { params: { month }, withCredentials: true, signal: controller.signal })
        setDuePayment(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this due payment.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchDuePayment()
    return () => controller.abort()
  }, [id, month])

  // Keeps the month in the address, so it survives a refresh
  const changeMonth = (newMonth: string) => {
    setMonth(newMonth)
    if (isValidMonth(newMonth)) setSearchParams({ month: newMonth }, { replace: true })
  }

  const customer = duePayment?.Customer

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="due-page">
          <Link to="/duePayments" className="oz-back-link">&larr; Due Payments</Link>

          {loading && !duePayment && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading due payment...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {duePayment && customer && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="due-title">
                  <h1 className="oz-page-title">Due Payment #{duePayment.due_number}</h1>
                  <p className="oz-eyebrow mb-0">Balance</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => saveDuePaymentPdf(duePayment, today())} disabled={loading}>
                    Save due payment as PDF
                  </button>
                </div>
              </div>

              <dl className="oz-panel oz-details mb-4">
                <div className="oz-details-row">
                  <dt>Name</dt>
                  <dd><Link to={`/customers/${customer.customer_id}`}>{customer.customer_name}</Link></dd>
                </div>
                <div className="oz-details-row">
                  <dt>Address</dt>
                  <dd>{customer.customer_address}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Phone</dt>
                  <dd>{customer.customer_phone}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Email</dt>
                  <dd>{customer.customer_email || 'None'}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Issue Date</dt>
                  <dd>{formatDate(today())}</dd>
                </div>
              </dl>

              <div className="mb-4 due-month">
                <label htmlFor="due_month" className="form-label">Month</label>
                <input
                  type="month"
                  id="due_month"
                  className="form-control"
                  value={month}
                  onChange={e => changeMonth(e.target.value)}
                />
              </div>

              <div className="oz-panel table-responsive due-table-panel" role="region" aria-label={`Balance for ${formatMonth(duePayment.month)}`} tabIndex={0}>
                <table className="table due-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col" className="text-end">Invoice</th>
                      <th scope="col" className="text-end">Return</th>
                      <th scope="col" className="text-end">Receipt</th>
                      <th scope="col" className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="due-table-forward">
                      <td>Brought forward</td>
                      <td className="text-end">&ndash;</td>
                      <td className="text-end">&ndash;</td>
                      <td className="text-end">&ndash;</td>
                      <td className="text-end">{formatMoney(duePayment.opening_balance)}</td>
                    </tr>
                    {duePayment.rows.map(row => (
                      <tr key={`${row.type}-${row.id}`}>
                        <td>{formatDate(row.date)}</td>
                        <AmountCell row={row} column="invoice" />
                        <AmountCell row={row} column="return" />
                        <AmountCell row={row} column="receipt" />
                        <td className="text-end due-table-strong">{formatMoney(row.total)}</td>
                      </tr>
                    ))}
                    {duePayment.rows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center oz-eyebrow">No invoices, returns or receipts in {formatMonth(duePayment.month)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>{duePayment.closing_balance < 0 ? 'Credit' : 'Balance due'}</td>
                      <td className="text-end">{formatMoney(Math.abs(duePayment.closing_balance))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
