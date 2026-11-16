import { jsPDF } from 'jspdf'
import { DuePayment } from '../types/duePayment'

// Same look as the invoice, return and receipt PDFs (see saveInvoicePdf.ts).
// All positions are in millimetres on an A4 page (210 x 297).
const PAGE_WIDTH = 210
const LEFT = 20
const RIGHT = 190
const PAGE_BOTTOM = 270      // content stops here, the footer goes below
const FOOTER_Y = 287
const LINE_HEIGHT = 5
const INFO_BOX_LEFT = 122
const TOTAL_BOX_LEFT = 126
const CONTACT_VALUE_LEFT = LEFT + 18

// Right edge of each amount column: Invoice, Return, Receipt, Total
const INVOICE_RIGHT = 86
const RETURN_RIGHT = 120
const RECEIPT_RIGHT = 154
const TOTAL_RIGHT = RIGHT - 4

const COLORS = {
  accent: '#5c6546',
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

export const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// 140 -> "140.00", -9.5 -> "-9.50"
const plain = (amount: number) => amount.toFixed(2)
const dollars = (amount: number) => (amount < 0 ? `-$${plain(-amount)}` : `$${plain(amount)}`)

const ONES = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const SCALES = ['', ' Thousand', ' Million', ' Billion']

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

// "32.45" -> "Only Thirty Two Dollars and Forty Five Cents"
const amountInWords = (amount: string) => {
  const [dollarPart, centPart = ''] = amount.split('.')
  const whole = Number(dollarPart)
  const cents = Number(centPart.padEnd(2, '0').slice(0, 2))
  let words = `${numberInWords(whole)} ${whole === 1 ? 'Dollar' : 'Dollars'}`
  if (cents > 0) words += ` and ${numberInWords(cents)} ${cents === 1 ? 'Cent' : 'Cents'}`
  return `Only ${words}`
}

export function saveDuePaymentPdf(duePayment: DuePayment, issueDate: string) {
  const { Customer: customer } = duePayment
  const balance = duePayment.closing_balance
  const totalLabel = balance < 0 ? 'CREDIT' : 'BALANCE DUE'
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

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

  const startNewPage = () => {
    doc.addPage()
    doc.setFillColor(COLORS.accent)
    doc.rect(0, 0, PAGE_WIDTH, 5, 'F')
    y = 18
  }

  const drawTableHeader = () => {
    doc.setFillColor(COLORS.accent)
    doc.rect(LEFT, y, RIGHT - LEFT, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(COLORS.white)
    spacedText('DATE', LEFT + 4, y + 6, 0.4)
    spacedText('INVOICE', INVOICE_RIGHT, y + 6, 0.4, true)
    spacedText('RETURN', RETURN_RIGHT, y + 6, 0.4, true)
    spacedText('RECEIPT', RECEIPT_RIGHT, y + 6, 0.4, true)
    spacedText('TOTAL', TOTAL_RIGHT, y + 6, 0.4, true)
    y += 9
  }

  // ---- Top band ----
  doc.setFillColor(COLORS.accent)
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(COLORS.white)
  // Measured letter by letter: getTextWidth tightens pairs like "AY" but the text is drawn without that,
  // so measuring the whole word would push the heading past the right margin
  const heading = 'DUE PAYMENT'
  const headingWidth = heading.split('').reduce((width, letter) => width + doc.getTextWidth(letter), 0) + 1.5 * (heading.length - 1)
  doc.text(heading, RIGHT - headingWidth, 21, { charSpace: 1.5 })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(COLORS.soft)
  doc.text(`#${duePayment.due_number}`, RIGHT, 30, { align: 'right' })

  // ---- Customer on the left: name, address, phone, email ----
  const columnsTop = 56
  y = columnsTop
  smallLabel('CUSTOMER', LEFT, y, COLORS.accent)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(COLORS.ink)
  const nameLines: string[] = doc.splitTextToSize(customer.customer_name, INFO_BOX_LEFT - LEFT - 8)
  nameLines.forEach(nameLine => {
    doc.text(nameLine, LEFT, y)
    y += 6.5
  })
  y += 0.5

  const contact = [
    { label: 'Address', value: customer.customer_address },
    { label: 'Phone', value: customer.customer_phone },
    ...(customer.customer_email ? [{ label: 'Email', value: customer.customer_email }] : [])
  ]
  doc.setFontSize(9.5)
  contact.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.muted)
    doc.text(label, LEFT, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.ink)
    const valueLines: string[] = doc.splitTextToSize(value, INFO_BOX_LEFT - CONTACT_VALUE_LEFT - 6)
    valueLines.forEach((valueLine, index) => doc.text(valueLine, CONTACT_VALUE_LEFT, y + index * LINE_HEIGHT))
    y += 5.5 + (valueLines.length - 1) * LINE_HEIGHT
  })
  const customerBottom = y

  // ---- Details box on the right ----
  const info = [
    { label: 'Due Payment No.', value: `#${duePayment.due_number}` },
    { label: 'Issue Date', value: formatDate(issueDate) },
    { label: 'Month', value: formatMonth(duePayment.month) }
  ]
  const infoRowHeight = 7.5
  const infoBoxTop = columnsTop - 6
  const infoBoxHeight = info.length * infoRowHeight + 5
  doc.setFillColor(COLORS.soft)
  doc.roundedRect(INFO_BOX_LEFT, infoBoxTop, RIGHT - INFO_BOX_LEFT, infoBoxHeight, 2, 2, 'F')
  info.forEach(({ label, value }, index) => {
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

  // ---- Table: Date | Invoice | Return | Receipt | Total ----
  const tableRows = [
    { date: 'Brought forward', invoice: '', ret: '', receipt: '', total: dollars(duePayment.opening_balance), italic: true },
    ...duePayment.rows.map(row => ({
      date: formatDate(row.date),
      invoice: row.type === 'invoice' ? `$${plain(row.amount)}` : '',
      ret: row.type === 'return' ? `$${plain(row.amount)}` : '',
      receipt: row.type === 'receipt' ? `$${plain(row.amount)}` : '',
      total: dollars(row.total),
      italic: false
    }))
  ]

  if (y + 25 > PAGE_BOTTOM) startNewPage()
  drawTableHeader()

  const rowHeight = LINE_HEIGHT + 4
  tableRows.forEach((row, index) => {
    if (y + rowHeight > PAGE_BOTTOM) {
      startNewPage()
      drawTableHeader()
    }

    if (index % 2 === 1) {
      doc.setFillColor(COLORS.zebra)
      doc.rect(LEFT, y, RIGHT - LEFT, rowHeight, 'F')
    }

    const textY = y + 5.6
    doc.setFontSize(10)
    doc.setTextColor(row.italic ? COLORS.muted : COLORS.ink)
    doc.setFont('helvetica', row.italic ? 'italic' : 'normal')
    doc.text(row.date, LEFT + 4, textY)
    doc.text(row.invoice || '-', INVOICE_RIGHT, textY, { align: 'right' })
    doc.text(row.ret || '-', RETURN_RIGHT, textY, { align: 'right' })
    doc.text(row.receipt || '-', RECEIPT_RIGHT, textY, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COLORS.ink)
    doc.text(row.total, TOTAL_RIGHT, textY, { align: 'right' })

    y += rowHeight
    doc.setDrawColor(COLORS.rule)
    doc.setLineWidth(0.2)
    doc.line(LEFT, y, RIGHT, y)
  })

  // ---- Total box on the right, amount in words on the left ----
  y += 8
  const totalText = plain(Math.abs(balance))
  const totalInWords = amountInWords(totalText)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9.5)
  const wordLines: string[] = doc.splitTextToSize(totalInWords, TOTAL_BOX_LEFT - LEFT - 8)
  const totalsHeight = Math.max(14, 6 + wordLines.length * LINE_HEIGHT)
  if (y + totalsHeight > PAGE_BOTTOM) startNewPage()

  doc.setFillColor(COLORS.accent)
  doc.roundedRect(TOTAL_BOX_LEFT, y, RIGHT - TOTAL_BOX_LEFT, 14, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.white)
  doc.text(totalLabel, TOTAL_BOX_LEFT + 5, y + 9, { charSpace: 0.6 })
  doc.setFontSize(14)
  doc.text(`$${totalText}`, RIGHT - 5, y + 9.5, { align: 'right' })

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
    doc.text(`Statement for ${formatMonth(duePayment.month)}`, LEFT, FOOTER_Y)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${page} of ${pageCount}`, RIGHT, FOOTER_Y, { align: 'right' })
  }

  doc.save(`DuePayment-${duePayment.due_number}-${duePayment.month}.pdf`)
}
