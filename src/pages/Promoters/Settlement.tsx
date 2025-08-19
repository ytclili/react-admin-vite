import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Card, DatePicker, Descriptions, Input, Modal, Select, Space, Table, Tabs, Tag, message } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

type WithdrawStatus = '待审核' | '已处理' | '已驳回'
interface WithdrawRequest {
	id: string
	promoterId: string
	promoterName: string
	phone: string
	avatar: string
	amount: number
	createdAt: string
	status: WithdrawStatus
}

type SettlementStatus = '待结算' | '已结算'
interface SettlementItemDetail {
	orderNo: string
	promoterName: string
	amount: number
	createdAt: string
}
interface CorpSettlementOrder {
	id: string
	partnerId: string
	partnerName: string
	period: string // YYYY-MM
	accountInfo?: string
	totalAmount: number
	status: SettlementStatus
	details: SettlementItemDetail[]
	createdAt: string
}

interface PartnerOption { value: string; label: string; accountInfo?: string }

const STORAGE_WITHDRAW = 'promoter_withdraw_requests'
const STORAGE_CORP_SETTLEMENTS = 'promoter_corp_settlements'
const STORAGE_PARTNERS = 'promoter_partners'

function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadPartners(): PartnerOption[] {
	try {
		const raw = localStorage.getItem(STORAGE_PARTNERS)
		if (!raw) return []
		const arr = JSON.parse(raw) as Array<{ id: string; name: string; publicAccountInfo?: string }>
		return arr.map(i => ({ value: i.id, label: i.name, accountInfo: i.publicAccountInfo }))
	} catch { return [] }
}

function defaultWithdraws(): WithdrawRequest[] {
	return [
		{ id: 'w1', promoterId: 'pm1', promoterName: '张三', phone: '13800001111', avatar: 'https://i.pravatar.cc/64?img=1', amount: 1200, createdAt: nowString(), status: '待审核' },
		{ id: 'w2', promoterId: 'pm2', promoterName: '李四', phone: '13900002222', avatar: 'https://i.pravatar.cc/64?img=2', amount: 300, createdAt: nowString(), status: '已处理' },
		{ id: 'w3', promoterId: 'pm3', promoterName: '王五', phone: '13700003333', avatar: 'https://i.pravatar.cc/64?img=3', amount: 500, createdAt: nowString(), status: '已驳回' },
	]
}

function loadWithdraws(): WithdrawRequest[] {
	try {
		const raw = localStorage.getItem(STORAGE_WITHDRAW)
		if (raw) {
			const parsed = JSON.parse(raw) as WithdrawRequest[]
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultWithdraws()
				localStorage.setItem(STORAGE_WITHDRAW, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultWithdraws()
		localStorage.setItem(STORAGE_WITHDRAW, JSON.stringify(seed))
		return seed
	} catch { return [] }
}

function saveWithdraws(list: WithdrawRequest[]) {
	localStorage.setItem(STORAGE_WITHDRAW, JSON.stringify(list))
}

function loadCorpSettlements(): CorpSettlementOrder[] {
	try {
		const raw = localStorage.getItem(STORAGE_CORP_SETTLEMENTS)
		if (raw) return JSON.parse(raw)
		localStorage.setItem(STORAGE_CORP_SETTLEMENTS, JSON.stringify([]))
		return []
	} catch { return [] }
}

function saveCorpSettlements(list: CorpSettlementOrder[]) {
	localStorage.setItem(STORAGE_CORP_SETTLEMENTS, JSON.stringify(list))
}

export default function PromoterSettlement() {
	const [partners, setPartners] = useState<PartnerOption[]>([])
	const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([])
	const [corpOrders, setCorpOrders] = useState<CorpSettlementOrder[]>([])

	const [rejectModalOpen, setRejectModalOpen] = useState(false)
	const [rejectTarget, setRejectTarget] = useState<WithdrawRequest | null>(null)
	const [rejectReason, setRejectReason] = useState('')

	const [corpPartnerId, setCorpPartnerId] = useState<string | undefined>()
	const [corpPeriod, setCorpPeriod] = useState<Dayjs>(dayjs().subtract(1, 'month'))
	const [detailOpen, setDetailOpen] = useState(false)
	const [detailOrder, setDetailOrder] = useState<CorpSettlementOrder | null>(null)

	useEffect(() => {
		setPartners(loadPartners())
		setWithdraws(loadWithdraws())
		setCorpOrders(loadCorpSettlements())
	}, [])

	useEffect(() => { saveWithdraws(withdraws) }, [withdraws])
	useEffect(() => { saveCorpSettlements(corpOrders) }, [corpOrders])

	const pendingWithdrawCount = useMemo(() => withdraws.filter(w => w.status === '待审核').length, [withdraws])

	const approveWithdraw = (rec: WithdrawRequest) => {
		setWithdraws(prev => prev.map(w => (w.id === rec.id ? { ...w, status: '已处理' as WithdrawStatus } : w)))
		message.success('已审核通过（请在线下完成打款）')
	}

	const openReject = (rec: WithdrawRequest) => {
		setRejectTarget(rec)
		setRejectReason('')
		setRejectModalOpen(true)
	}

	const submitReject = () => {
		if (!rejectTarget) return
		setWithdraws(prev => prev.map(w => (w.id === rejectTarget.id ? { ...w, status: '已驳回' as WithdrawStatus } : w)))
		setRejectModalOpen(false)
		message.success('已驳回申请')
	}

	const generateCorpSettlement = () => {
		if (!corpPartnerId || !corpPeriod) {
			message.warning('请选择合作方与结算周期')
			return
		}
		const periodStr = corpPeriod.format('YYYY-MM')
		// prevent duplicate
		if (corpOrders.some(o => o.partnerId === corpPartnerId && o.period === periodStr)) {
			message.info('该合作方在该周期的结算单已存在')
			return
		}
		// mock details and total
		const details: SettlementItemDetail[] = Array.from({ length: Math.floor(Math.random() * 5) + 3 }).map((_, idx) => ({
			orderNo: `O${periodStr.replace('-', '')}00${idx + 1}`,
			promoterName: `成员${idx + 1}`,
			amount: Math.floor(Math.random() * 400) + 100,
			createdAt: `${periodStr}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
		}))
		const total = details.reduce((s, d) => s + d.amount, 0)
		const partner = partners.find(p => p.value === corpPartnerId)
		const order: CorpSettlementOrder = {
			id: `S${Date.now()}`,
			partnerId: corpPartnerId,
			partnerName: partner?.label || '',
			period: periodStr,
			accountInfo: partner?.accountInfo,
			totalAmount: total,
			status: '待结算',
			details,
			createdAt: nowString(),
		}
		setCorpOrders(prev => [order, ...prev])
		message.success('已生成结算单')
	}

	const markSettled = (order: CorpSettlementOrder) => {
		setCorpOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: '已结算' as SettlementStatus } : o)))
		message.success('已标记为已结算')
	}

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="text-lg font-semibold">财务结算</div>
			<Tabs
				items={[
					{
						key: 'withdraw',
						label: (
							<span>个人提现审核 {pendingWithdrawCount > 0 ? <Tag color="red">{pendingWithdrawCount}</Tag> : null}</span>
						),
						children: (
							<Card>
								<Table
									rowKey="id"
									dataSource={withdraws}
									pagination={{ pageSize: 10 }}
									columns={[
										{ title: '申请ID', dataIndex: 'id', width: 160 },
										{ title: '推客信息', render: (_: any, r: WithdrawRequest) => (
											<Space>
												<Avatar src={r.avatar} size={32} />
												<div>
													<div>{r.promoterName}</div>
													<div className="text-black/45 text-xs">{r.phone}</div>
												</div>
											</Space>
										) },
										{ title: '申请金额（元）', dataIndex: 'amount' },
										{ title: '申请时间', dataIndex: 'createdAt' },
										{ title: '状态', dataIndex: 'status', render: (v: WithdrawStatus) => <Tag color={v === '待审核' ? 'processing' : v === '已处理' ? 'success' : 'default'}>{v}</Tag> },
										{ title: '操作', render: (_: any, r: WithdrawRequest) => (
											<Space>
												<Button size="small" type="primary" disabled={r.status !== '待审核'} onClick={() => approveWithdraw(r)}>审核通过</Button>
												<Button size="small" danger disabled={r.status !== '待审核'} onClick={() => openReject(r)}>驳回</Button>
											</Space>
										) },
									]}
								/>
							</Card>
						),
					},
					{
						key: 'corp',
						label: '合作方对公结算',
						children: (
							<div className="space-y-3">
								<Card>
									<Space wrap>
										<Select style={{ width: 260 }} placeholder="选择合作方" value={corpPartnerId} onChange={setCorpPartnerId} options={partners} />
										<DatePicker picker="month" value={corpPeriod} onChange={(d) => setCorpPeriod(d || dayjs().subtract(1,'month'))} />
										<Button type="primary" onClick={generateCorpSettlement}>生成结算单</Button>
									</Space>
								</Card>
								<Card>
									<Table
										rowKey="id"
										dataSource={corpOrders}
										pagination={{ pageSize: 10 }}
										columns={[
											{ title: '结算单ID', dataIndex: 'id', width: 180 },
											{ title: '合作方名称', dataIndex: 'partnerName' },
											{ title: '结算周期', dataIndex: 'period' },
											{ title: '总金额（元）', dataIndex: 'totalAmount' },
											{ title: '状态', dataIndex: 'status', render: (v: SettlementStatus) => <Tag color={v === '已结算' ? 'success' : 'processing'}>{v}</Tag> },
											{ title: '操作', render: (_: any, r: CorpSettlementOrder) => (
												<Space>
													<Button size="small" onClick={() => { setDetailOrder(r); setDetailOpen(true) }}>查看详情</Button>
													<Button size="small" type="primary" disabled={r.status === '已结算'} onClick={() => markSettled(r)}>标记为已结算</Button>
												</Space>
											) },
										]}
									/>
								</Card>
							</div>
						),
					},
				]}
			/>

			<Modal open={rejectModalOpen} title={`驳回提现申请 - ${rejectTarget?.promoterName || ''}`} onCancel={() => setRejectModalOpen(false)} onOk={submitReject} okText="确认驳回">
				<Input.TextArea rows={3} placeholder="请输入驳回原因（选填）" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
			</Modal>

			<Modal open={detailOpen} title="结算单详情" onCancel={() => setDetailOpen(false)} footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>} width={720}>
				{detailOrder ? (
					<div className="space-y-3">
						<Descriptions bordered size="small" column={1}>
							<Descriptions.Item label="合作方">{detailOrder.partnerName}</Descriptions.Item>
							<Descriptions.Item label="结算周期">{detailOrder.period}</Descriptions.Item>
							<Descriptions.Item label="银行账户信息">{detailOrder.accountInfo || '-'}</Descriptions.Item>
							<Descriptions.Item label="佣金总额">{detailOrder.totalAmount} 元</Descriptions.Item>
						</Descriptions>
						<Card size="small" title="佣金明细">
							<Table
								rowKey={(r) => r.orderNo}
								dataSource={detailOrder.details}
								pagination={false}
								columns={[
									{ title: '关联订单号', dataIndex: 'orderNo', width: 180 },
									{ title: '成员', dataIndex: 'promoterName' },
									{ title: '金额（元）', dataIndex: 'amount' },
									{ title: '产生时间', dataIndex: 'createdAt' },
								]}
							/>
						</Card>
					</div>
				) : null}
			</Modal>
		</div>
	)
}


