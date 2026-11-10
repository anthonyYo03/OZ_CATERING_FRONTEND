import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { SummaryShellProps, SummaryTileProps } from '../../../types/summary'
import './ObserverSummary.css'

// Also shows negatives properly, e.g. -$9.00
export const observerFormatMoney = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const observerPad = (value: number) => String(value).padStart(2, '0')

// True only for a real calendar date written as YYYY-MM-DD
const observerIsValidDate = (date: string | null) => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return parsed.getMonth() === month - 1 && parsed.getDate() === day
}

// The first and last day of the current month, in the user's own timezone
const observerGetThisMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return { from: `${year}-${observerPad(month)}-01`, to: `${year}-${observerPad(month)}-${observerPad(lastDay)}` }
}

export function ObserverSummaryTile({ label, value, note }: SummaryTileProps) {
  return (
    <div className="col">
      <div className="oz-panel summary-tile">
        <span className="summary-tile-label">{label}</span>
        <span className="summary-tile-value">{value}</span>
        <span className="summary-tile-note">{note}</span>
      </div>
    </div>
  )
}

// The parts shared by the Summary and Profit pages: header, tabs, date range and loading the report
export default function ObserverSummaryShell<T>({ title, eyebrow, endpoint, children }: SummaryShellProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const thisMonth = observerGetThisMonth()
  const urlFrom = searchParams.get('from')
  const urlTo = searchParams.get('to')
  const useUrlDates = observerIsValidDate(urlFrom) && observerIsValidDate(urlTo)

  const [from, setFrom] = useState(useUrlDates ? (urlFrom as string) : thisMonth.from)
  const [to, setTo] = useState(useUrlDates ? (urlTo as string) : thisMonth.to)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  let rangeError = ''
  if (!observerIsValidDate(from) || !observerIsValidDate(to)) {
    rangeError = 'Please choose both dates.'
  } else if (from > to) {
    rangeError = 'The "From" date cannot be after the "To" date.'
  }

  useEffect(() => {
    setData(null)
    setError('')

    if (rangeError) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const observerFetchReport = async () => {
      try {
        const response = await axios.get<T>(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, { params: { from, to }, withCredentials: true, signal: controller.signal })
        setData(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this report.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchReport()
    return () => controller.abort()
  }, [endpoint, from, to, rangeError])

  // Keeps the dates in the address, so they survive a refresh and moving between the tabs
  const observerChangeRange = (newFrom: string, newTo: string) => {
    setFrom(newFrom)
    setTo(newTo)
    if (observerIsValidDate(newFrom) && observerIsValidDate(newTo)) {
      setSearchParams({ from: newFrom, to: newTo }, { replace: true })
    }
  }

  const search = rangeError ? '' : `?from=${from}&to=${to}`

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="summary-page">
          <Link to="/observerDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">{title}</h1>
            <p className="oz-eyebrow mb-0">{eyebrow}</p>
          </div>

          <nav className="nav nav-tabs summary-tabs mb-4" aria-label="Reports">
            <NavLink end to={{ pathname: '/observer/summary', search }} className="nav-link">Summary</NavLink>
            <NavLink end to={{ pathname: '/observer/summary/profit', search }} className="nav-link">Profit</NavLink>
          </nav>

          <div className="row g-3 mb-4 summary-range">
            <div className="col-6">
              <label htmlFor="from_date" className="form-label">From</label>
              <input
                type="date"
                id="from_date"
                className="form-control"
                value={from}
                onChange={e => observerChangeRange(e.target.value, to)}
              />
            </div>
            <div className="col-6">
              <label htmlFor="to_date" className="form-label">To</label>
              <input
                type="date"
                id="to_date"
                className="form-control"
                value={to}
                onChange={e => observerChangeRange(from, e.target.value)}
              />
            </div>
          </div>

          {rangeError && <p className="oz-empty-state">{rangeError}</p>}

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading report...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {data && children(data)}
        </div>
      </main>
    </div>
  )
}
