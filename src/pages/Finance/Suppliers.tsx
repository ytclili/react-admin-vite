import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

 type SettlementStatus = '待生成' | '待收款' | '已收款'
 interface SettlementRecord {
	id: string
	supplierName: string
	period: string // YYYY-MM
	amount: number
	orderCount: number
	status: SettlementStatus
	createdAt: string
	paidAt?: string
	includedOrderNos: string[]
 }

 interface CompletedOrder {
	orderNo: string
	supplierName: string
	amount: number
	completedAt: string // YYYY-MM-DD
 }

 const STORAGE_SETTLEMENTS = 'finance_supplier_settlements'
 const STORAGE_COMPLETED_ORDERS = 'finance_completed_orders'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function sampleOrders(): CompletedOrder[] {
	const pm = dayjs().subtract(1, 'month')
	const two = dayjs().subtract(2, 'month')
	return [
		{ orderNo: 'O-1001', supplierName: '星河集团', amount: 32000, completedAt: pm.date(5).format('YYYY-MM-DD') },
		{ orderNo: 'O-1002', supplierName: '星河集团', amount: 28000, completedAt: pm.date(18).format('YYYY-MM-DD') },
		{ orderNo: 'O-1003', supplierName: '晨曦渠道', amount: 15000, completedAt: pm.date(12).format('YYYY-MM-DD') },
		{ orderNo: 'O-0990', supplierName: '优车供应链', amount: 22000, completedAt: two.date(26).format('YYYY-MM-DD') },
	]
 }

 function loadOrders(): CompletedOrder[] {
	try {
		const raw = localStorage.getItem(STORAGE_COMPLETED_ORDERS)
		if (raw) {
			const arr: CompletedOrder[] = JSON.parse(raw)
			if (Array.isArray(arr) && arr.length === 0) {
				const seed = sampleOrders()
				localStorage.setItem(STORAGE_COMPLETED_ORDERS, JSON.stringify(seed))
				return seed
			}
			return arr
		}
		const seed = sampleOrders()
		localStorage.setItem(STORAGE_COMPLETED_ORDERS, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }

 function loadSettlements(): SettlementRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_SETTLEMENTS)
		if (raw) return JSON.parse(raw)
		localStorage.setItem(STORAGE_SETTLEMENTS, JSON.stringify([]))
		return []
	} catch { return [] }
 }

 function saveSettlements(list: SettlementRecord[]) {
	localStorage.setItem(STORAGE_SETTLEMENTS, JSON.stringify(list))
 }

 export default function FinanceSuppliers() {
	const [form] = Form.useForm()
	const [list, setList] = useState<SettlementRecord[]>([])
	const [orders, setOrders] = useState<CompletedOrder[]>([])
	const [query, setQuery] = useState<{ supplier?: string; period?: string; status?: SettlementStatus | undefined }>({})
	const [detail, setDetail] = useState<{ open: boolean; record?: SettlementRecord }>({ open: false })

	useEffect(() => {
		setOrders(loadOrders())
		const current = loadSettlements()
		const withDrafts = autoCreateDrafts(current)
		if (withDrafts !== current) saveSettlements(withDrafts)
		setList(withDrafts)
	}, [])

	useEffect(() => { saveSettlements(list) }, [list])

	function autoCreateDrafts(existing: SettlementRecord[]): SettlementRecord[] {
		const prevMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
		const existsKey = new Set(existing.filter(s => s.period === prevMonth).map(s => `${s.supplierName}__${s.period}`))
		const groups = new Map<string, CompletedOrder[]>()
		for (const o of orders) {
			const p = dayjs(o.completedAt).format('YYYY-MM')
			if (p !== prevMonth) continue
			const key = o.supplierName
			if (!groups.has(key)) groups.set(key, [])
			groups.get(key)!.push(o)
		}
		let changed = false
		let result = existing.slice()
		groups.forEach((arr, supplierName) => {
			const key = `${supplierName}__${prevMonth}`
			if (!existsKey.has(key)) {
				const rec: SettlementRecord = {
					id: `SR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
					supplierName,
					period: prevMonth,
					amount: 0,
					orderCount: arr.length,
					status: '待生成',
					createdAt: nowString(),
					includedOrderNos: arr.map(a => a.orderNo),
				}
				result = [rec, ...result]
				changed = true
			}
		})
		return changed ? result : existing
	}

	const filtered = useMemo(() => {
		return list.filter(s => {
			if (query.supplier && !s.supplierName.includes(query.supplier)) return false
			if (query.period && s.period !== query.period) return false
			if (query.status && s.status !== query.status) return false
			return true
		}).sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
	}, [list, query])

	const onSearch = () => {
		const v = form.getFieldsValue()
		setQuery({
			supplier: v.q_supplier || undefined,
			period: v.q_period ? (v.q_period as Dayjs).format('YYYY-MM') : undefined,
			status: v.q_status || undefined,
		})
	}
	const onReset = () => { form.resetFields(); setQuery({}) }

	function generateBill(rec: SettlementRecord) {
		if (rec.status !== '待生成') return
		const periodOrders = orders.filter(o => o.supplierName === rec.supplierName && dayjs(o.completedAt).format('YYYY-MM') === rec.period)
		if (periodOrders.length === 0) {
			message.info('该周期没有可汇总的订单')
			return
		}
		const amount = periodOrders.reduce((s, i) => s + i.amount, 0)
		setList(prev => prev.map(s => (s.id === rec.id ? { ...s, amount, orderCount: periodOrders.length, status: '待收款' as SettlementStatus } : s)))
		message.success('已生成账单，状态变为待收款')
	}

	function markReceived(rec: SettlementRecord) {
		if (rec.status !== '待收款') return
		setList(prev => prev.map(s => (s.id === rec.id ? { ...s, status: '已收款' as SettlementStatus, paidAt: nowString() } : s)))
		message.success('已标记为已收款')
	}

	const columns: ColumnsType<SettlementRecord> = [
		{ title: '结算单ID', dataIndex: 'id', width: 180 },
		{ title: '供应商名称', dataIndex: 'supplierName' },
		{ title: '结算周期', dataIndex: 'period', render: (v: string) => `${v.slice(0,4)}年${Number(v.slice(5))}月` },
		{ title: '应收总额(元)', dataIndex: 'amount' },
		{ title: '包含订单数', dataIndex: 'orderCount' },
		{ title: '状态', dataIndex: 'status', render: (v: SettlementStatus) => <Tag color={v === '待生成' ? 'default' : v === '待收款' ? 'processing' : 'success'}>{v}</Tag> },
		{ title: '操作', width: 260, render: (_: any, r: SettlementRecord) => (
			<Space>
				<Button size="small" onClick={() => setDetail({ open: true, record: r })}>查看详情</Button>
				{r.status === '待生成' ? <Button size="small" type="primary" onClick={() => generateBill(r)}>生成账单</Button> : null}
				{r.status === '待收款' ? <Button size="small" onClick={() => markReceived(r)}>标记为已收款</Button> : null}
				{r.status !== '已收款' ? (
					<Popconfirm title="确认删除该结算单？" onConfirm={() => setList(prev => prev.filter(i => i.id !== r.id))}>
						<Button size="small" danger>删除</Button>
					</Popconfirm>
				) : null}
			</Space>
		) },
	]

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="text-lg font-semibold">供应商结算管理（应收款）</div>
			<Card>
				<Form form={form} layout="inline" className="w-full flex flex-wrap gap-3">
					<Form.Item name="q_supplier" label="供应商名称">
						<Input placeholder="请输入供应商" allowClear style={{ width: 240 }} />
					</Form.Item>
					<Form.Item name="q_period" label="结算周期">
						<DatePicker picker="month" allowClear />
					</Form.Item>
					<Form.Item name="q_status" label="状态">
						<Select allowClear placeholder="全部" style={{ width: 200 }} options={[{ value: '待生成', label: '待生成' }, { value: '待收款', label: '待收款' }, { value: '已收款', label: '已收款' }]} />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSearch}>查询</Button>
						<Button onClick={onReset}>重置</Button>
					</Space>
				</Form>
			</Card>
			<Card>
				<Table<SettlementRecord>
					rowKey="id"
					dataSource={filtered}
					columns={columns}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				open={detail.open}
				title="结算单详情"
				onCancel={() => setDetail({ open: false })}
				footer={<Button onClick={() => setDetail({ open: false })}>关闭</Button>}
				width={720}
			>
				{detail.record ? (
					<div className="space-y-3">
						<div>供应商：{detail.record.supplierName}</div>
						<div>结算周期：{`${detail.record.period.slice(0,4)}年${Number(detail.record.period.slice(5))}月`}</div>
						<div>包含订单数：{detail.record.orderCount}</div>
						<div>应收总额：{detail.record.amount} 元</div>
						<Card size="small" title="订单明细">
							<Table
								rowKey="orderNo"
								dataSource={orders.filter(o => detail.record?.includedOrderNos.includes(o.orderNo))}
								pagination={{ pageSize: 5 }}
								columns={[
									{ title: '订单号', dataIndex: 'orderNo', width: 180 },
									{ title: '供应商', dataIndex: 'supplierName' },
									{ title: '金额（元）', dataIndex: 'amount' },
									{ title: '完成时间', dataIndex: 'completedAt' },
								]}
							/>
						</Card>
					</div>
				) : null}
			</Modal>
		</div>
	)
 }


