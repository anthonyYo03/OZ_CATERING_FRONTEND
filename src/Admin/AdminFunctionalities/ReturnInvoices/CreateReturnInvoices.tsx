import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { InvoiceSummary } from '../../../types/invoice'
import { ReturnableLine, ReturnData, ReturnFormData } from '../../../types/returnInvoice'
import ReturnInvoiceForm, { fetchReturnableLines } from './ReturnInvoiceForm'
import './ReturnInvoices.css'

// Today in the user's own timezone, as YYYY-MM-DD
const getToday = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export default function CreateReturnInvoices() {
  const navigate = useNavigate()
  const [returnForm, setReturnForm] = useState<ReturnFormData>({
    invoice_id: '',
    return_date: getToday(),
    reason: 'expired',
    notes: '',
    quantities: {},
  })
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [lines, setLines] = useState<ReturnableLine[]>([])
  const [linesLoading, setLinesLoading] = useState(false)
  const [linesError, setLinesError] = useState('')
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

  // Load the items each time another invoice is selected
  useEffect(() => {
    setLines([])
    setLinesError('')

    if (!returnForm.invoice_id) {
      setLinesLoading(false)
      return
    }

    const controller = new AbortController()
    setLinesLoading(true)

    const fetchLines = async () => {
      try {
        const result = await fetchReturnableLines(Number(returnForm.invoice_id), null, controller.signal)
        setLines(result.lines)
        setLinesLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setLinesError(err.response?.data?.message || 'Could not load the items of this invoice.')
        setLinesLoading(false)
        console.error(err)
      }
    }

    fetchLines()
    return () => controller.abort()
  }, [returnForm.invoice_id])

  const handleCreate = async (newReturn: ReturnData) => {
    setSaving(true)
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/returns/createReturn`, newReturn, { withCredentials: true })
      toast.success('Return created!')
      navigate('/returns', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the return.')
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
          <Link to="/returns" className="oz-back-link">&larr; Return Invoices</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">New Return</h1>
            <p className="oz-eyebrow mb-0">Choose an invoice and enter what came back</p>
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
            <ReturnInvoiceForm
              returnForm={returnForm}
              setReturnForm={setReturnForm}
              invoices={invoices}
              lines={lines}
              linesLoading={linesLoading}
              linesError={linesError}
              onSubmit={handleCreate}
              saving={saving}
              submitLabel="Create Return"
              savingLabel="Creating..."
              cancelTo="/returns"
            />
          )}
        </div>
      </main>
    </div>
  )
}
