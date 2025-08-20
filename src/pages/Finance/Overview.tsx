import { Card, Col, Row, Statistic } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

 type SupplierSettlement = { id: string; supplierName: string; amount: number; status: '待支付' | '已支付'; createdAt: string; paidAt?: string }
 type CustomerSubsidy = { id: string; userName: string; amount: number; status: '待支付' | '已支付'; createdAt: string; paidAt?: string }
 type CorpSettlement = { id: string; totalAmount: number; status: '待结算' | '已结算'; createdAt: string }
 type WithdrawReq = { id: string; amount: number; status: '待审核' | '已处理' | '已驳回'; createdAt: string }

 const STORAGE_SUPPLIER = 'finance_supplier_settlements'
 const STORAGE_CUSTOMER = 'finance_customer_subsidy'
 const STORAGE_CORP = 'promoter_corp_settlements'
 const STORAGE_WITHDRAW = 'promoter_withdraw_requests'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function seedSupplier(): SupplierSettlement[] {
	return [
		{ id: 'ss1', supplierName: '星河集团', amount: 120000, status: '待支付', createdAt: nowString() },
		{ id: 'ss2', supplierName: '晨曦渠道', amount: 80000, status: '已支付', createdAt: nowString(), paidAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm') },
		{ id: 'ss3', supplierName: '优车供应链', amount: 56000, status: '已支付', createdAt: nowString(), paidAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD HH:mm') },
	]
 }
 function seedCustomer(): CustomerSubsidy[] {
	return [
		{ id: 'cs1', userName: '张三', amount: 2000, status: '待支付', createdAt: nowString() },
		{ id: 'cs2', userName: '李四', amount: 3500, status: '已支付', createdAt: nowString(), paidAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm') },
		{ id: 'cs3', userName: '王五', amount: 1800, status: '已支付', createdAt: nowString(), paidAt: dayjs().subtract(2, 'month').format('YYYY-MM-DD HH:mm') },
	]
 }

 function loadSupplier(): SupplierSettlement[] {
	try {
		const raw = localStorage.getItem(STORAGE_SUPPLIER)
		if (raw) {
			const arr: SupplierSettlement[] = JSON.parse(raw)
			if (Array.isArray(arr) && arr.length === 0) {
				const seed = seedSupplier()
				localStorage.setItem(STORAGE_SUPPLIER, JSON.stringify(seed))
				return seed
			}
			return arr
		}
		const seed = seedSupplier()
		localStorage.setItem(STORAGE_SUPPLIER, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }
 function loadCustomer(): CustomerSubsidy[] {
	try {
		const raw = localStorage.getItem(STORAGE_CUSTOMER)
		if (raw) {
			const arr: CustomerSubsidy[] = JSON.parse(raw)
			if (Array.isArray(arr) && arr.length === 0) {
				const seed = seedCustomer()
				localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(seed))
				return seed
			}
			return arr
		}
		const seed = seedCustomer()
		localStorage.setItem(STORAGE_CUSTOMER, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }
 function loadCorp(): CorpSettlement[] {
	try {
		const raw = localStorage.getItem(STORAGE_CORP)
		if (!raw) return []
		const arr = JSON.parse(raw) as Array<any>
		return arr.map(i => ({ id: i.id, totalAmount: Number(i.totalAmount || 0), status: i.status, createdAt: i.createdAt }))
	} catch { return [] }
 }
 function loadWithdraws(): WithdrawReq[] {
	try {
		const raw = localStorage.getItem(STORAGE_WITHDRAW)
		if (!raw) return []
		return JSON.parse(raw) as WithdrawReq[]
	} catch { return [] }
 }

 function isInMonth(dateStr: string, ref = dayjs()): boolean {
	const d = dayjs(dateStr)
	return d.isSame(ref, 'month')
 }

 function buildMonths(n = 6): string[] {
	const arr: string[] = []
	for (let i = n - 1; i >= 0; i--) {
		arr.push(dayjs().subtract(i, 'month').format('YYYY-MM'))
	}
	return arr
 }

 export default function FinanceOverview() {
	const [supplier, setSupplier] = useState<SupplierSettlement[]>([])
	const [customer, setCustomer] = useState<CustomerSubsidy[]>([])
	const [corp, setCorp] = useState<CorpSettlement[]>([])
	const [withdraws, setWithdraws] = useState<WithdrawReq[]>([])
	const chartRef = useRef<HTMLDivElement | null>(null)
	const chartInstance = useRef<echarts.EChartsType | null>(null)

	useEffect(() => {
		setSupplier(loadSupplier())
		setCustomer(loadCustomer())
		setCorp(loadCorp())
		setWithdraws(loadWithdraws())
	}, [])

	const summary = useMemo(() => {
		const receivable = supplier.filter(s => s.status === '待支付').reduce((s, i) => s + i.amount, 0)
		const payableCustomer = customer.filter(c => c.status === '待支付').reduce((s, i) => s + i.amount, 0)
		const payablePromoter = corp.filter(c => c.status === '待结算').reduce((s, i) => s + i.totalAmount, 0)
		const payable = payableCustomer + payablePromoter

		const thisMonthPaidIn = supplier
			.filter(s => s.status === '已支付' && s.paidAt && isInMonth(s.paidAt))
			.reduce((s, i) => s + i.amount, 0)

		const thisMonthCustomerPaid = customer
			.filter(c => c.status === '已支付' && c.paidAt && isInMonth(c.paidAt))
			.reduce((s, i) => s + i.amount, 0)

		const thisMonthWithdrawPaid = withdraws
			.filter(w => w.status === '已处理' && isInMonth(w.createdAt))
			.reduce((s, i) => s + i.amount, 0)

		const thisMonthCorpPaid = corp
			.filter(c => c.status === '已结算' && isInMonth(c.createdAt))
			.reduce((s, i) => s + i.totalAmount, 0)

		const thisMonthPaidOut = thisMonthCustomerPaid + thisMonthWithdrawPaid + thisMonthCorpPaid
		const profit = thisMonthPaidIn - thisMonthPaidOut
		return { receivable, payable, paidIn: thisMonthPaidIn, paidOut: thisMonthPaidOut, profit }
	}, [supplier, customer, corp, withdraws])

	const trend = useMemo(() => {
		const months = buildMonths(6) // YYYY-MM
		const incomeByMonth = new Map<string, number>()
		const expenseByMonth = new Map<string, number>()
		months.forEach(m => { incomeByMonth.set(m, 0); expenseByMonth.set(m, 0) })

		supplier
			.filter(s => s.status === '已支付' && s.paidAt)
			.forEach(s => {
				const m = dayjs(s.paidAt!).format('YYYY-MM')
				if (incomeByMonth.has(m)) incomeByMonth.set(m, (incomeByMonth.get(m) || 0) + s.amount)
			})

		customer
			.filter(c => c.status === '已支付' && c.paidAt)
			.forEach(c => {
				const m = dayjs(c.paidAt!).format('YYYY-MM')
				if (expenseByMonth.has(m)) expenseByMonth.set(m, (expenseByMonth.get(m) || 0) + c.amount)
			})

		withdraws
			.filter(w => w.status === '已处理')
			.forEach(w => {
				const m = dayjs(w.createdAt).format('YYYY-MM')
				if (expenseByMonth.has(m)) expenseByMonth.set(m, (expenseByMonth.get(m) || 0) + w.amount)
			})

		corp
			.filter(c => c.status === '已结算')
			.forEach(c => {
				const m = dayjs(c.createdAt).format('YYYY-MM')
				if (expenseByMonth.has(m)) expenseByMonth.set(m, (expenseByMonth.get(m) || 0) + c.totalAmount)
			})

		const data = months.map(m => {
			const income = incomeByMonth.get(m) || 0
			const expense = expenseByMonth.get(m) || 0
			return { month: m, income, expense, profit: income - expense }
		})
		return data
	}, [supplier, customer, corp, withdraws])

	// ECharts
	useEffect(() => {
		if (!chartRef.current) return
		if (!chartInstance.current) {
			chartInstance.current = echarts.init(chartRef.current)
		}
		const months = trend.map(d => d.month)
		chartInstance.current.setOption({
			tooltip: { trigger: 'axis' },
			legend: { data: ['收入', '支出', '利润'] },
			grid: { left: 24, right: 16, top: 36, bottom: 24, containLabel: true },
			xAxis: { type: 'category', data: months },
			yAxis: { type: 'value' },
			series: [
				{ type: 'line', name: '收入', data: trend.map(d => d.income), smooth: true },
				{ type: 'line', name: '支出', data: trend.map(d => d.expense), smooth: true },
				{ type: 'line', name: '利润', data: trend.map(d => d.profit), smooth: true },
			],
		})
		const resize = () => chartInstance.current && chartInstance.current.resize()
		window.addEventListener('resize', resize)
		return () => {
			window.removeEventListener('resize', resize)
			chartInstance.current && chartInstance.current.dispose()
			chartInstance.current = null
		}
	}, [trend])

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="text-lg font-semibold">财务概览</div>
			<Row gutter={16}>
				<Col span={6}><Card><Statistic title="应收账款（在途）" value={summary.receivable} precision={2} suffix="元" /></Card></Col>
				<Col span={6}><Card><Statistic title="应付账款（在途）" value={summary.payable} precision={2} suffix="元" /></Card></Col>
				<Col span={6}><Card><Statistic title="本月已收款" value={summary.paidIn} precision={2} suffix="元" /></Card></Col>
				<Col span={6}><Card><Statistic title="本月已付款" value={summary.paidOut} precision={2} suffix="元" /></Card></Col>
			</Row>
			<Row>
				<Col span={24}>
					<Card title={`本月实时利润：${summary.profit.toFixed(2)} 元`}>
						<div ref={chartRef} style={{ width: '100%', height: 320 }} />
					</Card>
				</Col>
			</Row>
		</div>
	)
 }


