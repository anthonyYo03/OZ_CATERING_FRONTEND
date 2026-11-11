import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Receipt } from '../../../types/receipt'
import { saveReceiptPdf } from '../../../utils/saveInvoicePdf'
import { paymentMethods } from './ReceiptForm'
import './Receipts.css'

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GetOneReceipt() {
  const { id } = useParams()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchReceipt = async () => {
      try {
        const response = await axios.get<Receipt>(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/getReceipt/${id}`, { withCredentials: true, signal: controller.signal })
        setReceipt(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this receipt.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchReceipt()
    return () => controller.abort()
  }, [id])

  const methodLabel = receipt ? paymentMethods.find(method => method.value === receipt.payment_method)?.label ?? receipt.payment_method : ''

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="receipt-page">
          <Link to="/receipts" className="oz-back-link">&larr; Receipts</Link>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading receipt...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {receipt && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="receipt-title">
                  <h1 className="oz-page-title">Receipt #{receipt.receipt_number}</h1>
                  <p className="oz-eyebrow mb-0">Receipt details</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => saveReceiptPdf(receipt, methodLabel)}>
                    Save receipt as PDF
                  </button>
                  <Link to={`/receipts/${receipt.receipt_id}/edit`} className="btn btn-primary">
                    Edit
                  </Link>
                </div>
              </div>

              <dl className="oz-panel oz-details mb-4">
                <div className="oz-details-row">
                  <dt>Customer</dt>
                  <dd>{receipt.customer_name}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Invoice</dt>
                  <dd><Link to={`/invoices/${receipt.invoice_id}`}>Invoice #{receipt.Invoice?.invoice_number}</Link></dd>
                </div>
                <div className="oz-details-row">
                  <dt>Payment Date</dt>
                  <dd>{formatDate(receipt.payment_date)}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Amount Paid</dt>
                  <dd>${receipt.amount}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Payment Method</dt>
                  <dd>{methodLabel}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Notes</dt>
                  <dd className="receipt-notes">{receipt.notes || 'None'}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
