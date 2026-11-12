import { ReactNode } from 'react'

export interface SummaryItem {
    item_id: number | null,
    item_name: string,
    sold_quantity: number,
    sold_amount: number,
    returned_quantity: number,
    returned_amount: number,
    net_quantity: number,
    net_amount: number
}

export interface SummaryCustomer {
    customer_id: number,
    customer_name: string,
    invoice_count: number,
    sales: number,
    returns: number,
    net: number
}

// What GET /api/summary returns
export interface Summary {
    from: string,
    to: string,
    invoice_count: number,
    return_count: number,
    sales: number,
    returns: number,
    net: number,
    items: SummaryItem[],
    customers: SummaryCustomer[]
}

export interface ProfitItem {
    item_id: number | null,
    item_name: string,
    sold_quantity: number,
    returned_quantity: number,
    revenue: number,
    cost: number,
    profit: number,
    missing_cost_lines: number
}

// What GET /api/summary/profit returns
export interface Profit {
    from: string,
    to: string,
    revenue: number,
    cost: number,
    profit: number,
    receipt_value: number,
    profit_per_salary: number,
    missing_cost_lines: number,
    items: ProfitItem[]
}

export interface SummaryShellProps<T> {
    title: string,
    eyebrow: string,
    endpoint: string,
    children: (data: T) => ReactNode
}

export interface SummaryTileProps {
    label: string,
    value: string,
    note: string
}
