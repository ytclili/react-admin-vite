import { Button, Card, Modal, Space, Table, Tabs, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

 type CustomerPayTask = {
	id: string
	orderNo: string
	userName: string
	accountInfo: string
	amount: number
	appliedAt: string
 }

 type CorpSettlement = {
	id: string
	partnerName: string
	period: string
	totalAmount: number
	status: '待结算' | '已结算'
	createdAt: string
 }

 const STORAGE_CUSTOMER_TASKS = 'finance_customer_pay_tasks'
 const STORAGE_CUSTOMER_SUBSIDY = 'finance_customer_subsidy'
 const STORAGE_CORP = 'promoter_corp_settlements'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function seedCustomerTasks(): CustomerPayTask[] {
	return [
		{ id: 'pt-ord004', orderNo: 'ORD202401004', userName: '赵六', accountInfo: '赵六（招商银行 6214****89）', amount: 2000, appliedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm') },
		{ id: 'pt-ord006', orderNo: 'ORD202401006', userName: '张强', accountInfo: '张强（中国银行 6222****12）', amount: 5000, appliedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm') },
	]
 }

 function loadCustomerTasks(): CustomerPayTask[] {
	try {
		const raw = localStorage.getItem(STORAGE_CUSTOMER_TASKS)
		if (raw) {
			const arr: CustomerPayTask[] = JSON.parse(raw)
			if (Array.isArray(arr) && arr.length === 0) {
				const seed = seedCustomerTasks()
				localStorage.setItem(STORAGE_CUSTOMER_TASKS, JSON.stringify(seed))
				return seed
			}
			return arr
		}
		const seed = seedCustomerTasks()
		localStorage.setItem(STORAGE_CUSTOMER_TASKS, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }

 function saveCustomerTasks(list: CustomerPayTask[]) {
	localStorage.setItem(STORAGE_CUSTOMER_TASKS, JSON.stringify(list))
 }

 function appendCustomerSubsidyPaid(records: CustomerPayTask[]) {
	try {
		const raw = localStorage.getItem(STORAGE_CUSTOMER_SUBSIDY)
		const arr = raw ? (JSON.parse(raw) as Array<any>) : []
		const toAppend = records.map(r => ({ id: `cs-${r.id}`, userName: r.userName, amount: r.amount, status: '已支付', createdAt: r.appliedAt, paidAt: nowString() }))
		localStorage.setItem(STORAGE_CUSTOMER_SUBSIDY, JSON.stringify([...arr, ...toAppend]))
	} catch {}
 }

 function loadCorp(): CorpSettlement[] {
	try {
		const raw = localStorage.getItem(STORAGE_CORP)
		if (!raw) return []
		return JSON.parse(raw) as CorpSettlement[]
	} catch { return [] }
 }

 export default function FinancePayments() {
	const navigate = useNavigate()
	const [tasks, setTasks] = useState<CustomerPayTask[]>([])
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
	const [corp, setCorp] = useState<CorpSettlement[]>([])

	useEffect(() => {
		setTasks(loadCustomerTasks())
		setCorp(loadCorp())
	}, [])
	useEffect(() => { saveCustomerTasks(tasks) }, [tasks])

	const hasSelection = selectedRowKeys.length > 0
	const selectedRecords = useMemo(() => tasks.filter(t => selectedRowKeys.includes(t.id)), [tasks, selectedRowKeys])

	const columns: ColumnsType<CustomerPayTask> = [
		{ title: '订单号', dataIndex: 'orderNo', width: 180 },
		{ title: '客户姓名', dataIndex: 'userName', width: 140 },
		{ title: '收款账户信息', dataIndex: 'accountInfo' },
		{ title: '补贴金额（元）', dataIndex: 'amount', width: 160 },
		{ title: '申请审核时间', dataIndex: 'appliedAt', width: 180 },
	]

	const exportCSV = () => {
		if (selectedRecords.length === 0) {
			message.info('请先勾选需要导出的记录')
			return
		}
		const header = ['订单号', '客户姓名', '收款账户信息', '补贴金额（元）', '申请审核时间']
		const rows = selectedRecords.map(r => [r.orderNo, r.userName, r.accountInfo, String(r.amount), r.appliedAt])
		const csv = [header, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
		const bom = '\ufeff'
		const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `付款清单_${dayjs().format('YYYYMMDD_HHmm')}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	const markPaid = () => {
		if (selectedRecords.length === 0) {
			message.info('请先勾选需要标记的记录')
			return
		}
		Modal.confirm({
			title: `确认将选中 ${selectedRecords.length} 条记录标记为已打款？`,
			onOk: () => {
				appendCustomerSubsidyPaid(selectedRecords)
				setTasks(prev => prev.filter(t => !selectedRowKeys.includes(t.id)))
				setSelectedRowKeys([])
				message.success('已标记为已打款，并生成付款流水')
			},
		})
	}

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="text-lg font-semibold">付款管理（应付款）</div>
			<Tabs
				items={[
					{
						key: 'customer',
						label: '客户补贴付款',
						children: (
							<Card>
								<div className="flex items-center justify-between mb-3">
									<Space>
										<Button disabled={!hasSelection} onClick={exportCSV}>导出付款清单</Button>
										<Button type="primary" disabled={!hasSelection} onClick={markPaid}>批量标记为已打款</Button>
									</Space>
									<div className="text-black/45">数据来源：审核通过（待打款）的订单</div>
								</div>
								<Table<CustomerPayTask>
									rowKey="id"
									rowSelection={{ selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys) }}
									dataSource={tasks}
									columns={columns}
									pagination={{ pageSize: 10 }}
								/>
							</Card>
						),
					},
					{
						key: 'promoter',
						label: '推客佣金付款',
						children: (
							<Card>
								<div className="flex items-center justify-between mb-3">
									<div className="text-black/88">来自【推客管理-财务结算】的数据汇总</div>
									<Button type="link" onClick={() => navigate('/promoters/settlement')}>打开财务结算</Button>
								</div>
								<Table<CorpSettlement>
									rowKey="id"
									dataSource={corp}
									columns={[
										{ title: '结算单ID', dataIndex: 'id', width: 180 },
										{ title: '合作方名称', dataIndex: 'partnerName' },
										{ title: '结算周期', dataIndex: 'period' },
										{ title: '总金额（元）', dataIndex: 'totalAmount' },
										{ title: '状态', dataIndex: 'status', render: (v: CorpSettlement['status']) => <Tag color={v === '已结算' ? 'success' : 'processing'}>{v}</Tag> },
									]}
									pagination={{ pageSize: 10 }}
								/>
							</Card>
						),
					},
				]}
			/>
		</div>
	)
 }


