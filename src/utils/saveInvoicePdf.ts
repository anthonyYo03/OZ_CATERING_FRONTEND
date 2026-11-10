import { jsPDF } from 'jspdf'
import { Invoice } from '../types/invoice'
import { ReturnInvoice } from '../types/returnInvoice'

// All positions are in millimetres on an A4 page (210 x 297).
const LEFT = 20
const RIGHT = 190
const PAGE_BOTTOM = 277
const LINE_HEIGHT = 5
const ROW_PADDING = 3

const NAME_WIDTH = 85
const QUANTITY_RIGHT = 122
const UNIT_PRICE_RIGHT = 156
const DETAIL_VALUE_LEFT = 50

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PdfContent {
  title: string,
  details: { label: string, value: string }[],
  lines: { item_name: string, quantity: number, unit_price: string, line_total: string }[],
  total: string,
  fileName: string
}

// Builds the PDF and downloads it straight away.
function buildAndSavePdf({ title, details, lines, total, fileName }: PdfContent) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 25

  const drawLines = (lines: string[], x: number, top: number) => {
    lines.forEach((line, index) => doc.text(line, x, top + index * LINE_HEIGHT))
  }

  const drawDivider = (top: number) => {
    doc.setDrawColor(200)
    doc.line(LEFT, top, RIGHT, top)
  }

  const drawTableHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Item', LEFT, y)
    doc.text('Qty', QUANTITY_RIGHT, y, { align: 'right' })
    doc.text('Unit price', UNIT_PRICE_RIGHT, y, { align: 'right' })
    doc.text('Line total', RIGHT, y, { align: 'right' })
    y += ROW_PADDING
    drawDivider(y)
    y += LINE_HEIGHT + ROW_PADDING - 1
    doc.setFont('helvetica', 'normal')
  }

  // Moves to a new page when the next block would run past the bottom margin.
  const startNewPageIfNeeded = (blockHeight: number) => {
    if (y + blockHeight <= PAGE_BOTTOM) return
    doc.addPage()
    y = 25
    drawTableHeader()
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('OZ Catering', LEFT, y)
  y += 12

  doc.setFontSize(14)
  doc.text(title, LEFT, y)
  y += 12

  doc.setFontSize(11)
  details.forEach(({ label, value }) => {
    if (y > PAGE_BOTTOM) {
      doc.addPage()
      y = 25
    }
    doc.setFont('helvetica', 'bold')
    doc.text(label, LEFT, y)
    const valueLines: string[] = doc.splitTextToSize(value, RIGHT - DETAIL_VALUE_LEFT)
    doc.setFont('helvetica', 'normal')

    // Drawn line by line because a long note can run onto the next page
    valueLines.forEach(valueLine => {
      if (y > PAGE_BOTTOM) {
        doc.addPage()
        y = 25
      }
      doc.text(valueLine, DETAIL_VALUE_LEFT, y)
      y += LINE_HEIGHT
    })
    y += 2
  })
  y += 7

  // Keeps the table header together with its first row
  if (y + LINE_HEIGHT * 4 > PAGE_BOTTOM) {
    doc.addPage()
    y = 25
  }
  drawTableHeader()

  lines.forEach(line => {
    const nameLines: string[] = doc.splitTextToSize(line.item_name, NAME_WIDTH)
    const rowHeight = nameLines.length * LINE_HEIGHT + ROW_PADDING
    startNewPageIfNeeded(rowHeight)

    drawLines(nameLines, LEFT, y)
    doc.text(String(line.quantity), QUANTITY_RIGHT, y, { align: 'right' })
    doc.text(`$${line.unit_price}`, UNIT_PRICE_RIGHT, y, { align: 'right' })
    doc.text(`$${line.line_total}`, RIGHT, y, { align: 'right' })
    y += rowHeight
  })

  startNewPageIfNeeded(LINE_HEIGHT + ROW_PADDING * 2)
  y -= LINE_HEIGHT - ROW_PADDING
  drawDivider(y)
  y += LINE_HEIGHT + ROW_PADDING

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Total', LEFT, y)
  doc.text(`$${total}`, RIGHT, y, { align: 'right' })

  doc.save(fileName)
}

export function saveInvoicePdf(invoice: Invoice) {
  buildAndSavePdf({
    title: `Invoice #${invoice.invoice_number}`,
    details: [
      { label: 'Customer', value: invoice.customer_name },
      { label: 'Issue Date', value: formatDate(invoice.invoice_issued_date) }
    ],
    lines: invoice.InvoiceItems,
    total: invoice.invoice_total_amount,
    fileName: `Invoice-${invoice.invoice_number}.pdf`
  })
}

export function saveReturnInvoicePdf(returnInvoice: ReturnInvoice, invoiceNumber: number, reasonLabel: string) {
  buildAndSavePdf({
    title: `Return #${returnInvoice.return_number}`,
    details: [
      { label: 'Customer', value: returnInvoice.customer_name },
      { label: 'Invoice', value: `Invoice #${invoiceNumber}` },
      { label: 'Return Date', value: formatDate(returnInvoice.return_date) },
      { label: 'Reason', value: reasonLabel },
      { label: 'Notes', value: returnInvoice.notes || 'None' }
    ],
    lines: returnInvoice.ReturnInvoiceItems,
    total: returnInvoice.return_total_amount,
    fileName: `Return-${returnInvoice.return_number}.pdf`
  })
}
