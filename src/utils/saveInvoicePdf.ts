import { jsPDF } from 'jspdf'
import { Invoice } from '../types/invoice'
import { ReturnInvoice } from '../types/returnInvoice'
import { Receipt } from '../types/receipt'

// All positions are in millimetres on an A4 page (210 x 297).
const PAGE_WIDTH = 210
const LEFT = 20
const RIGHT = 190
const PAGE_BOTTOM = 270      // content stops here, the footer goes below
const FOOTER_Y = 287
const LINE_HEIGHT = 5

const NAME_WIDTH = 85
const QUANTITY_RIGHT = 124
const UNIT_PRICE_RIGHT = 156
const INFO_BOX_LEFT = 122
const TOTAL_BOX_LEFT = 126

// The app's own colors
const COLORS = {
  invoiceAccent: '#5c6546',  // olive, used for both invoices and returns
  ink: '#363c2c',
  muted: '#62684f',
  soft: '#e6e7d9',
  zebra: '#f4f5ee',
  rule: '#d9dbcb',
  white: '#ffffff'
}

// The date comes as YYYY-MM-DD. Built from its parts so the timezone can never shift it by a day.
const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ONES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const SCALES = ['', ' Thousand', ' Million', ' Billion']

// 0 to 999 in words, e.g. 345 -> "Three Hundred Forty Five"
const underThousandInWords = (n: number) => {
  const parts: string[] = []
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`)
    n %= 100
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)])
    n %= 10
  }
  if (n > 0) parts.push(ONES[n])
  return parts.join(' ')
}

const numberInWords = (n: number) => {
  if (n === 0) return 'Zero'
  const parts: string[] = []
  let scale = 0
  while (n > 0) {
    const chunk = n % 1000
    if (chunk > 0) parts.unshift(underThousandInWords(chunk) + SCALES[scale])
    n = Math.floor(n / 1000)
    scale++
  }
  return parts.join(' ')
}

// "32.45" -> "Only Thirty Two Dollars and Forty Five Cents". Cents are left out when there are none.
// Read from the text, not as a decimal number, so rounding can never change the cents.
const amountInWords = (amount: string) => {
  const [dollarPart, centPart = ''] = amount.split('.')
  const dollars = Number(dollarPart)
  const cents = Number(centPart.padEnd(2, '0').slice(0, 2))

  let words = `${numberInWords(dollars)} ${dollars === 1 ? 'Dollar' : 'Dollars'}`
  if (cents > 0) words += ` and ${numberInWords(cents)} ${cents === 1 ? 'Cent' : 'Cents'}`
  return `Only ${words}`
}

interface PdfContent {
  heading: string,                              // big word in the top band, e.g. INVOICE
  number: number,
  accent: string,
  customerLabel: string,                        // small label above the customer name
  customerName: string,
  contact: { label: string, value: string }[],  // shown under the customer name
  info: { label: string, value: string }[],     // shown in the box on the right
  notes?: string,
  lines?: { item_name: string, quantity: number, unit_price: string, line_total: string }[],  // receipts have no items
  total: string,
  totalLabel?: string,                          // TOTAL unless set, e.g. AMOUNT PAID on a receipt
  totalInWords: string,
  footerNote: string,
  fileName: string
}

// Builds the PDF and downloads it straight away.
function buildAndSavePdf(content: PdfContent) {
  const { accent } = content
  const totalLabel = content.totalLabel ?? 'TOTAL'
  const lines = content.lines ?? []
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

  // Text with extra space between the letters. jsPDF does not count that space when
  // right-aligning, so the start position is worked out here instead.
  const spacedText = (text: string, x: number, top: number, charSpace: number, alignRight = false) => {
    const width = doc.getTextWidth(text) + charSpace * (text.length - 1)
    doc.text(text, alignRight ? x - width : x, top, { charSpace })
  }

  const smallLabel = (text: string, x: number, top: number, color: string, alignRight = false) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(color)
    spacedText(text, x, top, 0.6, alignRight)
  }

  // Later pages get a thin band in the accent color instead of the full header
  const startNewPage = () => {
    doc.addPage()
    doc.setFillColor(accent)
    doc.rect(0, 0, PAGE_WIDTH, 5, 'F')
    y = 18
  }

  const drawTableHeader = () => {
    doc.setFillColor(accent)
    doc.rect(LEFT, y, RIGHT - LEFT, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COLORS.white)
    spacedText('ITEM', LEFT + 4, y + 6, 0.4)
    spacedText('QTY', QUANTITY_RIGHT, y + 6, 0.4, true)
    spacedText('UNIT PRICE', UNIT_PRICE_RIGHT, y + 6, 0.4, true)
    spacedText('AMOUNT', RIGHT - 4, y + 6, 0.4, true)
    y += 9
  }

  // ---- Top band: heading and number on the left, total on the right ----
  doc.setFillColor(accent)
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(COLORS.white)
  doc.text(content.heading, LEFT, 21, { charSpace: 1.5 })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(COLORS.soft)
  doc.text(`#${content.number}`, LEFT, 30)

  smallLabel(totalLabel, RIGHT, 19, COLORS.soft, true)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(COLORS.white)
  doc.text(`$${content.total}`, RIGHT, 29, { align: 'right' })

  // ---- Customer on the left ----
  const columnsTop = 56
  y = columnsTop
  smallLabel(content.customerLabel, LEFT, y, accent)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(COLORS.ink)
  const nameLines: string[] = doc.splitTextToSize(content.customerName, INFO_BOX_LEFT - LEFT - 8)
  nameLines.forEach(nameLine => {
    doc.text(nameLine, LEFT, y)
    y += 6.5
  })
  y += 0.5

  doc.setFontSize(9.5)
  content.contact.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.muted)
    doc.text(label, LEFT, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.ink)
    doc.text(value, LEFT + 14, y)
    y += 5.5
  })
  const customerBottom = y

  // ---- Details box on the right ----
  const infoRowHeight = 7.5
  const infoBoxTop = columnsTop - 6
  const infoBoxHeight = content.info.length * infoRowHeight + 5
  doc.setFillColor(COLORS.soft)
  doc.roundedRect(INFO_BOX_LEFT, infoBoxTop, RIGHT - INFO_BOX_LEFT, infoBoxHeight, 2, 2, 'F')
  content.info.forEach(({ label, value }, index) => {
    const rowY = columnsTop + index * infoRowHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(COLORS.muted)
    doc.text(label, INFO_BOX_LEFT + 5, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(COLORS.ink)
    doc.text(value, RIGHT - 5, rowY, { align: 'right' })
  })

  y = Math.max(customerBottom, infoBoxTop + infoBoxHeight) + 8

  // ---- Notes (returns only, when there are some) ----
  if (content.notes) {
    smallLabel('NOTES', LEFT, y, accent)
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(COLORS.ink)
    // Drawn line by line because a long note can run onto the next page
    const noteLines: string[] = doc.splitTextToSize(content.notes, RIGHT - LEFT)
    noteLines.forEach(noteLine => {
      if (y > PAGE_BOTTOM) startNewPage()
      doc.text(noteLine, LEFT, y)
      y += LINE_HEIGHT
    })
    y += 5
  }

  // ---- Items table (left out when there are no items, e.g. on a receipt) ----
  if (lines.length > 0) {
    // Keeps the table header together with its first row
    if (y + 25 > PAGE_BOTTOM) startNewPage()
    drawTableHeader()
  }

  lines.forEach((line, index) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const itemLines: string[] = doc.splitTextToSize(line.item_name, NAME_WIDTH)
    const rowHeight = itemLines.length * LINE_HEIGHT + 4

    if (y + rowHeight > PAGE_BOTTOM) {
      startNewPage()
      drawTableHeader()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }

    // Every other row is lightly shaded so long lists are easy to follow
    if (index % 2 === 1) {
      doc.setFillColor(COLORS.zebra)
      doc.rect(LEFT, y, RIGHT - LEFT, rowHeight, 'F')
    }

    const textY = y + 5.6
    doc.setTextColor(COLORS.ink)
    itemLines.forEach((itemLine, lineIndex) => doc.text(itemLine, LEFT + 4, textY + lineIndex * LINE_HEIGHT))
    doc.text(String(line.quantity), QUANTITY_RIGHT, textY, { align: 'right' })
    doc.text(`$${line.unit_price}`, UNIT_PRICE_RIGHT, textY, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.text(`$${line.line_total}`, RIGHT - 4, textY, { align: 'right' })

    y += rowHeight
    doc.setDrawColor(COLORS.rule)
    doc.setLineWidth(0.2)
    doc.line(LEFT, y, RIGHT, y)
  })

  // ---- Total box on the right, amount in words on the left ----
  if (lines.length > 0) y += 8
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9.5)
  const wordLines: string[] = doc.splitTextToSize(content.totalInWords, TOTAL_BOX_LEFT - LEFT - 8)
  const totalsHeight = Math.max(14, 6 + wordLines.length * LINE_HEIGHT)
  if (y + totalsHeight > PAGE_BOTTOM) startNewPage()

  doc.setFillColor(accent)
  doc.roundedRect(TOTAL_BOX_LEFT, y, RIGHT - TOTAL_BOX_LEFT, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.white)
  doc.text(totalLabel, TOTAL_BOX_LEFT + 5, y + 9, { charSpace: 0.6 })
  doc.setFontSize(14)
  doc.text(`$${content.total}`, RIGHT - 5, y + 9.5, { align: 'right' })

  smallLabel('AMOUNT IN WORDS', LEFT, y + 3.5, COLORS.muted)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9.5)
  doc.setTextColor(COLORS.ink)
  wordLines.forEach((wordLine, lineIndex) => doc.text(wordLine, LEFT, y + 9 + lineIndex * LINE_HEIGHT))

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setDrawColor(COLORS.rule)
    doc.setLineWidth(0.3)
    doc.line(LEFT, FOOTER_Y - 6, RIGHT, FOOTER_Y - 6)
    doc.setFontSize(8.5)
    doc.setTextColor(COLORS.muted)
    doc.setFont('helvetica', 'italic')
    doc.text(content.footerNote, LEFT, FOOTER_Y)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${page} of ${pageCount}`, RIGHT, FOOTER_Y, { align: 'right' })
  }

  doc.save(content.fileName)
}

export function saveInvoicePdf(invoice: Invoice) {
  buildAndSavePdf({
    heading: 'INVOICE',
    number: invoice.invoice_number,
    accent: COLORS.invoiceAccent,
    customerLabel: 'BILL TO',
    customerName: invoice.customer_name,
    contact: [
      // Email only when the customer has one
      ...(invoice.Customer?.customer_email ? [{ label: 'Email', value: invoice.Customer.customer_email }] : []),
      ...(invoice.Customer?.customer_phone ? [{ label: 'Phone', value: invoice.Customer.customer_phone }] : [])
    ],
    info: [
      { label: 'Invoice No.', value: `#${invoice.invoice_number}` },
      { label: 'Issue Date', value: formatDate(invoice.invoice_issued_date) }
    ],
    lines: invoice.InvoiceItems,
    total: invoice.invoice_total_amount,
    totalInWords: amountInWords(invoice.invoice_total_amount),
    footerNote: 'Thank you for your business!',
    fileName: `Invoice-${invoice.invoice_number}.pdf`
  })
}

export function saveReturnInvoicePdf(returnInvoice: ReturnInvoice, invoiceNumber: number, reasonLabel: string) {
  buildAndSavePdf({
    heading: 'RETURN',
    number: returnInvoice.return_number,
    accent: COLORS.invoiceAccent,
    customerLabel: 'CUSTOMER',
    customerName: returnInvoice.customer_name,
    contact: [],
    info: [
      { label: 'Return No.', value: `#${returnInvoice.return_number}` },
      { label: 'Return Date', value: formatDate(returnInvoice.return_date) },
      { label: 'Invoice', value: `#${invoiceNumber}` },
      { label: 'Reason', value: reasonLabel }
    ],
    notes: returnInvoice.notes || undefined,
    lines: returnInvoice.ReturnInvoiceItems,
    total: returnInvoice.return_total_amount,
    totalInWords: amountInWords(returnInvoice.return_total_amount),
    footerNote: `Return for Invoice #${invoiceNumber}`,
    fileName: `Return-${returnInvoice.return_number}.pdf`
  })
}

export function saveReceiptPdf(receipt: Receipt, methodLabel: string) {
  buildAndSavePdf({
    heading: 'RECEIPT',
    number: receipt.receipt_number,
    accent: COLORS.invoiceAccent,
    customerLabel: 'RECEIVED FROM',
    customerName: receipt.customer_name,
    contact: [
      // Email only when the customer has one
      ...(receipt.Customer?.customer_email ? [{ label: 'Email', value: receipt.Customer.customer_email }] : []),
      ...(receipt.Customer?.customer_phone ? [{ label: 'Phone', value: receipt.Customer.customer_phone }] : [])
    ],
    info: [
      { label: 'Receipt No.', value: `#${receipt.receipt_number}` },
      { label: 'Payment Date', value: formatDate(receipt.payment_date) },
      ...(receipt.Invoice ? [
        { label: 'Invoice', value: `#${receipt.Invoice.invoice_number}` },
        { label: 'Invoice Total', value: `$${receipt.Invoice.invoice_total_amount}` }
      ] : []),
      { label: 'Method', value: methodLabel }
    ],
    notes: receipt.notes || undefined,
    total: receipt.amount,
    totalLabel: 'AMOUNT PAID',
    totalInWords: amountInWords(receipt.amount),
    footerNote: 'Thank you for your payment!',
    fileName: `Receipt-${receipt.receipt_number}.pdf`
  })
}
