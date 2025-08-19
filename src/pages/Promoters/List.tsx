import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Card, Form, Input, Select, Space, Switch, Table, Tag, message } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

type PromoterType = '个人' | '团队成员'
type PromoterStatus = '正常' | '冻结'

interface PromoterRecord {
	id: string
	name: string
	phone: string
	avatar: string
	type: PromoterType
	partnerId?: string
	partnerName?: string
	leaderName?: string
	groupId?: string
	groupName?: string
	canDevelopChildren: boolean
	status: PromoterStatus
	createdAt: string
}

interface PartnerOption { value: string; label: string }
interface GroupOption { value: string; label: string }

const STORAGE_PROMOTERS = 'promoters_list'
const STORAGE_PARTNERS = 'promoter_partners'
const STORAGE_GROUPS = 'promoter_strategy_groups'

function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadPartners(): PartnerOption[] {
	try {
		const raw = localStorage.getItem(STORAGE_PARTNERS)
		if (!raw) return []
		const arr = JSON.parse(raw) as Array<{ id: string; name: string }>
		return arr.map(i => ({ value: i.id, label: i.name }))
	} catch {
		return []
	}
}

function loadGroups(): GroupOption[] {
	try {
		const raw = localStorage.getItem(STORAGE_GROUPS)
		if (!raw) return []
		const arr = JSON.parse(raw) as Array<{ id: string; name: string }>
		return arr.map(i => ({ value: i.id, label: i.name }))
	} catch {
		return []
	}
}

function defaultPromoters(partners: PartnerOption[], groups: GroupOption[]): PromoterRecord[] {
	return [
		{
			id: 'pm1',
			name: '张三',
			phone: '13800001111',
			avatar: 'https://i.pravatar.cc/64?img=1',
			type: '个人',
			groupId: groups[0]?.value,
			groupName: groups[0]?.label,
			canDevelopChildren: true,
			status: '正常',
			createdAt: nowString(),
		},
		{
			id: 'pm2',
			name: '李四',
			phone: '13900002222',
			avatar: 'https://i.pravatar.cc/64?img=2',
			type: '团队成员',
			partnerId: partners[0]?.value,
			partnerName: partners[0]?.label,
			leaderName: '王主管',
			groupId: groups[0]?.value,
			groupName: groups[0]?.label,
			canDevelopChildren: false,
			status: '正常',
			createdAt: nowString(),
		},
	]
}

function loadPromoters(): PromoterRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_PROMOTERS)
		if (raw) return JSON.parse(raw)
		const partners = loadPartners()
		const groups = loadGroups()
		const seed = defaultPromoters(partners, groups)
		localStorage.setItem(STORAGE_PROMOTERS, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function savePromoters(list: PromoterRecord[]) {
	localStorage.setItem(STORAGE_PROMOTERS, JSON.stringify(list))
}

export default function PromoterList() {
	const location = useLocation()
	const navigate = useNavigate()
	const [form] = Form.useForm()
	const [promoters, setPromoters] = useState<PromoterRecord[]>([])
	const [partners, setPartners] = useState<PartnerOption[]>([])
	const [groups, setGroups] = useState<GroupOption[]>([])
	const [query, setQuery] = useState<{ keyword?: string; partnerId?: string; groupId?: string }>({})
	const [initTag, setInitTag] = useState<{ partnerName?: string } | null>(null)

	useEffect(() => {
		setPartners(loadPartners())
		setGroups(loadGroups())
	}, [])

	useEffect(() => {
		setPromoters(loadPromoters())
	}, [partners.length, groups.length])

	useEffect(() => {
		const sp = new URLSearchParams(location.search)
		const pid = sp.get('partnerId') || undefined
		const pname = sp.get('partnerName') || undefined
		if (pid) {
			setQuery(prev => ({ ...prev, partnerId: pid }))
			form.setFieldsValue({ q_partner: pid })
			setInitTag(pname ? { partnerName: pname } : null)
		}
	}, [location.search])

	useEffect(() => {
		savePromoters(promoters)
	}, [promoters])

	const filtered = useMemo(() => {
		return promoters.filter(p => {
			if (query.keyword) {
				const kw = query.keyword
				if (!p.id.includes(kw) && !p.name.includes(kw) && !p.phone.includes(kw)) return false
			}
			if (query.partnerId && p.partnerId !== query.partnerId) return false
			if (query.groupId && p.groupId !== query.groupId) return false
			return true
		})
	}, [promoters, query])

	const onSearch = () => {
		const v = form.getFieldsValue()
		setQuery({ keyword: v.q_kw || undefined, partnerId: v.q_partner || undefined, groupId: v.q_group || undefined })
	}

	const onReset = () => {
		form.resetFields()
		setQuery({})
		setInitTag(null)
	}

	const toggleDevelop = (rec: PromoterRecord, val: boolean) => {
		setPromoters(prev => prev.map(i => (i.id === rec.id ? { ...i, canDevelopChildren: val } : i)))
	}

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">推客列表</div>
				<Space>
					<Button onClick={() => { const seed = defaultPromoters(partners, groups); localStorage.setItem(STORAGE_PROMOTERS, JSON.stringify(seed)); setPromoters(loadPromoters()); message.success('已填充示例数据'); }}>填充示例数据</Button>
				</Space>
			</div>
			<Card>
				<Form form={form} layout="inline" className="w-full flex flex-wrap gap-3">
					<Form.Item name="q_kw" label="推客ID/姓名/手机号">
						<Input placeholder="请输入关键词" allowClear style={{ width: 260 }} />
					</Form.Item>
					<Form.Item name="q_partner" label="所属合作方">
						<Select allowClear placeholder="全部" style={{ width: 220 }} options={partners} />
					</Form.Item>
					<Form.Item name="q_group" label="所属策略组">
						<Select allowClear placeholder="全部" style={{ width: 220 }} options={groups} />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSearch}>查询</Button>
						<Button onClick={onReset}>重置</Button>
					</Space>
				</Form>
				{initTag?.partnerName ? (
					<div className="mt-3"><Tag color="blue">来自合作方：{initTag.partnerName}</Tag></div>
				) : null}
			</Card>
			<Card>
				<Table
					rowKey="id"
					dataSource={filtered}
					pagination={{ pageSize: 10 }}
					columns={[
						{ title: '推客ID', dataIndex: 'id', width: 120 },
						{ title: '推客信息', render: (_: any, r: PromoterRecord) => (
							<Space>
								<Avatar src={r.avatar} size={32} />
								<div>
									<div>{r.name}</div>
									<div className="text-black/45 text-xs">{r.phone}</div>
								</div>
							</Space>
						) },
						{ title: '推客类型', dataIndex: 'type', width: 120, render: (v: PromoterType) => <Tag color={v === '个人' ? 'green' : 'purple'}>{v}</Tag> },
						{ title: '所属合作方', dataIndex: 'partnerName', render: (v?: string) => v || '-' },
						{ title: '上级/小组长', dataIndex: 'leaderName', render: (v?: string) => v || '-' },
						{ title: '所属策略组', dataIndex: 'groupName', render: (v?: string) => v || '-' },
						{ title: '发展下级权限', dataIndex: 'canDevelopChildren', width: 160, render: (_: any, r: PromoterRecord) => <Switch checkedChildren="是" unCheckedChildren="否" checked={r.canDevelopChildren} onChange={(val) => toggleDevelop(r, val)} /> },
						{ title: '状态', dataIndex: 'status', width: 120, render: (v: PromoterStatus) => <Tag color={v === '正常' ? 'success' : 'default'}>{v}</Tag> },
						{ title: '操作', width: 120, render: (_: any, r: PromoterRecord) => <Button type="link" onClick={() => navigate(`/promoters/detail?promoterId=${r.id}`)}>详情</Button> },
					]}
				/>
			</Card>
		</div>
	)
}


