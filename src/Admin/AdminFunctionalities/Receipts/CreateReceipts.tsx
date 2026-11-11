import  { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { InvoiceSummary } from '../../../types/invoice'
import { ReceiptData, ReceiptFormData } from '../../../types/receipt'
import ReceiptForm from './ReceiptForm'
import './Receipts.css'

// Today in the user's own timezone, as YYYY-MM-DD
const getToday = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default function CreateReceipts() {
  const navigate = useNavigate()
  const [receiptForm, setReceiptForm] = useState<ReceiptFormData>({
    invoice_id: '',
    payment_date: getToday(),
    amount: '',
    payment_method: 'cash',
    notes: '',
  })
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchInvoices = async () => {
      try {
        const response = await axios.get<InvoiceSummary[]>(`${process.env.REACT_APP_BACKEND_URL}/api/invoices/getInvoices`, { withCredentials: true, signal: controller.signal })
        setInvoices(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load invoices.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchInvoices()
    return () => controller.abort()
  }, [])

  const handleCreate = async (newReceipt: ReceiptData) => {
    setSaving(true)
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/createReceipt`, newReceipt, { withCredentials: true })
      toast.success('Receipt created!')
      navigate('/receipts', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the receipt.')
      console.error(err)
      setSaving(false)
    }
  }

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

          <div className="mb-4">
            <h1 className="oz-page-title">New Receipt</h1>
            <p className="oz-eyebrow mb-0">Choose an invoice and enter the payment</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && invoices.length === 0 && (
            <p className="oz-empty-state">You need an invoice first. <Link to="/invoices/create">Add an invoice</Link></p>
          )}

          {!loading && !error && invoices.length > 0 && (
            <ReceiptForm
              receiptForm={receiptForm}
              setReceiptForm={setReceiptForm}
              invoices={invoices}
              onSubmit={handleCreate}
              saving={saving}
              submitLabel="Create Receipt"
              savingLabel="Creating..."
              cancelTo="/receipts"
            />
          )}
        </div>
      </main>
    </div>
  )
}
