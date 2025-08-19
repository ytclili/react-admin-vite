import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space, Tag, Input, Select, DatePicker, Avatar, Popconfirm, message, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SearchOutlined, ReloadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

type UserStatus = 'normal' | 'disabled'

interface UserRecord {
	id: string
	promoterId?: string
	taibaoId?: string
	avatar?: string
	nickname: string
	phone?: string
	completedOrders: number
	totalSubsidy: number // yuan
	registerTime: string
	lastLoginTime?: string
	status: UserStatus
}

const USERS_KEY = 'users'

function loadUsers(): UserRecord[] {
	try {
		const raw = localStorage.getItem(USERS_KEY)
		if (raw) return JSON.parse(raw)
		const now = new Date().toLocaleString()
		const seed: UserRecord[] = [
			{ id: 'U10001', promoterId: 'P9001', taibaoId: 'T8001', avatar: 'https://i.pravatar.cc/60?img=1', nickname: '小明', phone: '13800001111', completedOrders: 3, totalSubsidy: 2600, registerTime: now, lastLoginTime: now, status: 'normal' },
			{ id: 'U10002', promoterId: 'P9002', taibaoId: 'T8002', avatar: 'https://i.pravatar.cc/60?img=2', nickname: '小红', phone: '13900002222', completedOrders: 0, totalSubsidy: 0, registerTime: now, lastLoginTime: now, status: 'normal' },
			{ id: 'U10003', promoterId: 'P9003', taibaoId: 'T8003', avatar: 'https://i.pravatar.cc/60?img=3', nickname: '老王', phone: '13700003333', completedOrders: 5, totalSubsidy: 8800, registerTime: now, lastLoginTime: now, status: 'disabled' },
		]
		localStorage.setItem(USERS_KEY, JSON.stringify(seed))
		return seed
	} catch { return [] }
}

function saveUsers(list: UserRecord[]) {
	localStorage.setItem(USERS_KEY, JSON.stringify(list))
}

export const Users = () => {
	const navigate = useNavigate()

	const [users, setUsers] = useState<UserRecord[]>([])
	const [filtered, setFiltered] = useState<UserRecord[]>([])
	const [loading, setLoading] = useState(false)

	// filters
	const [idOrNameOrPhone, setIdOrNameOrPhone] = useState('')
	const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
	const [registerRange, setRegisterRange] = useState<[string, string] | null>(null)

	useEffect(() => {
		const list = loadUsers()
		setUsers(list)
		setFiltered(list)
	}, [])

	const handleSearch = () => {
		setLoading(true)
		let list = [...users]
		if (idOrNameOrPhone.trim()) {
			const q = idOrNameOrPhone.trim().toLowerCase()
			list = list.filter(u =>
				u.id.toLowerCase().includes(q) ||
				(u.nickname || '').toLowerCase().includes(q) ||
				(u.phone || '').includes(idOrNameOrPhone.trim())
			)
		}
		if (statusFilter !== 'all') {
			list = list.filter(u => u.status === statusFilter)
		}
		if (registerRange && registerRange[0] && registerRange[1]) {
			list = list.filter(u => {
				const t = new Date(u.registerTime)
				return t >= new Date(registerRange[0]) && t <= new Date(registerRange[1])
			})
		}
		setTimeout(() => {
			setFiltered(list)
			setLoading(false)
		}, 200)
	}

	const handleReset = () => {
		setIdOrNameOrPhone('')
		setStatusFilter('all')
		setRegisterRange(null)
		setFiltered(users)
	}

	const handleExport = () => {
		const headers = ['用户ID','推客ID','太保ID','用户昵称','手机号','累计订单数','累计补贴(元)','注册时间','最后登录时间','状态']
		const rows = filtered.map(u => [u.id, u.promoterId || '', u.taibaoId || '', u.nickname, u.phone || '', String(u.completedOrders), String(u.totalSubsidy.toFixed(2)), u.registerTime, u.lastLoginTime || '', u.status === 'normal' ? '正常' : '禁用'])
		const csv = '\ufeff' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `用户列表_${Date.now()}.csv`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	const toDetail = (u: UserRecord) => {
		navigate('/users/detail', { state: { userId: u.id } })
	}

	const toggleStatus = (u: UserRecord) => {
		const newStatus: UserStatus = u.status === 'normal' ? 'disabled' : 'normal'
		const list = users.map(x => x.id === u.id ? { ...x, status: newStatus } : x)
		setUsers(list)
		saveUsers(list)
		setTimeout(handleSearch, 0)
		message.success(newStatus === 'disabled' ? '已禁用该用户' : '已启用该用户')
	}

	const columns: ColumnsType<UserRecord> = [
		{ title: '用户ID', dataIndex: 'id', key: 'id', width: 140, render: (text, record) => (
			<Button type="link" onClick={() => toDetail(record)}>{text}</Button>
		)},
		{ title: '推客ID', dataIndex: 'promoterId', key: 'promoterId', width: 120 },
		{ title: '太保ID', dataIndex: 'taibaoId', key: 'taibaoId', width: 120 },
		{ title: '用户信息', key: 'userInfo', width: 220, render: (_, r) => (
			<Space size={12}>
				<Avatar src={r.avatar} size={32}>{r.nickname?.[0]}</Avatar>
				<span>{r.nickname}</span>
			</Space>
		)},
		{ title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
		{ title: '累计订单数', dataIndex: 'completedOrders', key: 'completedOrders', width: 120, align: 'center', render: (v: number, r) => (
			<Button type="link" onClick={() => message.info(`筛选用户 ${r.id} 已完成订单（示例）`)}>{v}</Button>
		)},
		{ title: '累计补贴(元)', dataIndex: 'totalSubsidy', key: 'totalSubsidy', width: 140, render: (v: number) => v.toFixed(2) },
		{ title: '注册时间', dataIndex: 'registerTime', key: 'registerTime', width: 180 },
		{ title: '最后登录时间', dataIndex: 'lastLoginTime', key: 'lastLoginTime', width: 180 },
		{ title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center', render: (s: UserStatus) => <Tag color={s === 'normal' ? 'green' : 'red'}>{s === 'normal' ? '正常' : '禁用'}</Tag> },
		{ title: '操作', key: 'action', width: 160, render: (_, r) => (
			<Space size="small">
				<Button type="link" icon={<EyeOutlined />} onClick={() => toDetail(r)}>详情</Button>
				<Popconfirm title={`确定要${r.status === 'normal' ? '禁用' : '启用'}该用户吗？`} onConfirm={() => toggleStatus(r)}>
					<Button type="link" danger={r.status === 'normal'}>{r.status === 'normal' ? '禁用' : '启用'}</Button>
				</Popconfirm>
			</Space>
		)},
	]

	return (
		<div className="p-6 space-y-4">
			<Card title="查询条件" className="shadow-sm">
				<Space size={16} wrap>
					<Search placeholder="用户ID/昵称/手机号" allowClear value={idOrNameOrPhone} onChange={(e) => setIdOrNameOrPhone(e.target.value)} onSearch={handleSearch} style={{ width: 240 }} />
					<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
						<Option value="all">全部状态</Option>
						<Option value="normal">正常</Option>
						<Option value="disabled">禁用</Option>
					</Select>
					<RangePicker
						placeholder={['注册开始时间','注册结束时间']}
						onChange={(dates) => {
							if (dates) setRegisterRange([dates[0]?.format('YYYY-MM-DD') || '', dates[1]?.format('YYYY-MM-DD') || ''])
							else setRegisterRange(null)
						}}
					/>
					<Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>查询</Button>
					<Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
					<Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
				</Space>
			</Card>

			<Card title="用户列表" className="shadow-sm">
				<Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
			</Card>
		</div>
	)
}
