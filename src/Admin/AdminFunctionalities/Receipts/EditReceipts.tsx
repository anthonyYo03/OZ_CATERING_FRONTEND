import  { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Receipt, ReceiptData, ReceiptFormData, ReceiptUpdateData } from '../../../types/receipt'
import ReceiptForm from './ReceiptForm'
import './Receipts.css'

export default function EditReceipts() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [receiptForm, setReceiptForm] = useState<ReceiptFormData | null>(null)
  const [invoiceLabel, setInvoiceLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchReceipt = async () => {
      try {
        const response = await axios.get<Receipt>(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/getReceipt/${id}`, { withCredentials: true, signal: controller.signal })
        const loaded = response.data

        setInvoiceLabel(`Invoice #${loaded.Invoice?.invoice_number} - ${loaded.customer_name}`)
        setReceiptForm({
          invoice_id: String(loaded.invoice_id),
          payment_date: loaded.payment_date,
          amount: loaded.amount,
          payment_method: loaded.payment_method,
          notes: loaded.notes ?? '',
        })
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

  const handleUpdate = async (updatedReceipt: ReceiptData) => {
    // A receipt cannot be moved to another invoice, so the invoice is not sent
    const changes: ReceiptUpdateData = {
      payment_date: updatedReceipt.payment_date,
      amount: updatedReceipt.amount,
      payment_method: updatedReceipt.payment_method,
      notes: updatedReceipt.notes,
    }

    setSaving(true)
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/receipts/updateReceipt/${id}`, changes, { withCredentials: true })
      toast.success('Receipt updated!')
      navigate(`/receipts/${id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the receipt.')
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
          <Link to={`/receipts/${id}`} className="oz-back-link">&larr; Receipt details</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Edit Receipt</h1>
            <p className="oz-eyebrow mb-0">Change the date, amount, method or notes</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading receipt...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {receiptForm && (
            <ReceiptForm
              receiptForm={receiptForm}
              setReceiptForm={setReceiptForm}
              invoices={[]}
              invoiceLabel={invoiceLabel}
              onSubmit={handleUpdate}
              saving={saving}
              submitLabel="Save Changes"
              savingLabel="Saving..."
              cancelTo={`/receipts/${id}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
