import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { ReturnableLine, ReturnData, ReturnFormData, ReturnInvoice, ReturnUpdateData } from '../../../types/returnInvoice'
import ReturnInvoiceForm, { fetchReturnableLines } from './ReturnInvoiceForm'
import './ReturnInvoices.css'

export default function EditReturnInvoices() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [returnForm, setReturnForm] = useState<ReturnFormData | null>(null)
  const [invoiceLabel, setInvoiceLabel] = useState('')
  const [lines, setLines] = useState<ReturnableLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchReturn = async () => {
      try {
        const response = await axios.get<ReturnInvoice>(`${process.env.REACT_APP_BACKEND_URL}/api/returns/getReturn/${id}`, { withCredentials: true, signal: controller.signal })
        const loaded = response.data
        const result = await fetchReturnableLines(loaded.invoice_id, loaded.return_id, controller.signal)

        const quantities: Record<number, string> = {}
        loaded.ReturnInvoiceItems.forEach(line => {
          quantities[line.invoice_item_id] = String(Number(quantities[line.invoice_item_id] || 0) + line.quantity)
        })

        setLines(result.lines)
        setInvoiceLabel(`Invoice #${result.invoice.invoice_number} - ${loaded.customer_name}`)
        setReturnForm({
          invoice_id: String(loaded.invoice_id),
          return_date: loaded.return_date,
          reason: loaded.reason,
          notes: loaded.notes ?? '',
          quantities,
        })
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this return.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchReturn()
    return () => controller.abort()
  }, [id])

  const handleUpdate = async (updatedReturn: ReturnData) => {
    // A return cannot be moved to another invoice, so the invoice is not sent
    const changes: ReturnUpdateData = {
      return_date: updatedReturn.return_date,
      reason: updatedReturn.reason,
      notes: updatedReturn.notes,
      items: updatedReturn.items,
    }

    setSaving(true)
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/returns/updateReturn/${id}`, changes, { withCredentials: true })
      toast.success('Return updated!')
      navigate(`/returns/${id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the return.')
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
        <div className="return-page">
          <Link to={`/returns/${id}`} className="oz-back-link">&larr; Return details</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Edit Return</h1>
            <p className="oz-eyebrow mb-0">Change the date, reason, notes or quantities</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading return...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {returnForm && (
            <ReturnInvoiceForm
              returnForm={returnForm}
              setReturnForm={setReturnForm}
              invoices={[]}
              invoiceLabel={invoiceLabel}
              lines={lines}
              linesLoading={false}
              linesError=""
              onSubmit={handleUpdate}
              saving={saving}
              submitLabel="Save Changes"
              savingLabel="Saving..."
              cancelTo={`/returns/${id}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
