import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Avatar, Tag, Tabs, Descriptions, Table, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'

type UserStatus = 'normal' | 'disabled'

interface UserRecord {
	id: string
	promoterId?: string
	taibaoId?: string
	avatar?: string
	nickname: string
	phone?: string
	completedOrders: number
	totalSubsidy: number
	registerTime: string
	lastLoginTime?: string
	status: UserStatus
	openid?: string
	loginIp?: string
}

interface UserOrderRecord {
	orderNo: string
	skuName: string
	subsidyContent: string
	status: string
	createTime: string
}

interface FundRecord {
	flowNo: string
	orderNo: string
	amount: number
	payTime: string
	operator: string
}

interface LoginLogRecord {
	loginTime: string
	ip: string
	device: string
}

const USERS_KEY = 'users'

function loadUsers(): UserRecord[] {
	try {
		const raw = localStorage.getItem(USERS_KEY)
		return raw ? JSON.parse(raw) : []
	} catch { return [] }
}

export default function UserDetail() {
	const location = useLocation()
	const navigate = useNavigate()
	const state = (location.state as any) || {}
	const userId: string = state?.userId || ''

	const [user, setUser] = useState<UserRecord | null>(null)
	const [orders, setOrders] = useState<UserOrderRecord[]>([])
	const [funds, setFunds] = useState<FundRecord[]>([])
	const [logs, setLogs] = useState<LoginLogRecord[]>([])

	useEffect(() => {
		const list = loadUsers()
		const found = userId ? list.find(u => u.id === userId) : list[0]
		const u: UserRecord = found || {
			id: 'U-UNKNOWN', nickname: '未知用户', completedOrders: 0, totalSubsidy: 0,
			registerTime: new Date().toLocaleString(), status: 'normal'
		}
		setUser(u)
		// mock related data
		setOrders([
			{ orderNo: 'ORD202401001', skuName: 'A6L 豪华型', subsidyContent: '现金补贴2000元', status: '已完成', createTime: '2024-01-12 10:22:00' },
			{ orderNo: 'ORD202401005', skuName: '凯美瑞 2.5L 豪华版', subsidyContent: '三者险补贴3000元', status: '审核通过（待打款）', createTime: '2024-01-16 15:05:00' },
		])
		setFunds([
			{ flowNo: 'F2024010001', orderNo: 'ORD202401001', amount: 2000, payTime: '2024-01-20 09:30:00', operator: '财务A' },
		])
		setLogs([
			{ loginTime: u.lastLoginTime || new Date().toLocaleString(), ip: u.loginIp || '10.0.0.1', device: 'iPhone 14, iOS 17' },
			{ loginTime: '2024-01-10 12:00:00', ip: '10.0.0.2', device: 'WeChat Android' },
		])
	}, [userId])

	const orderColumns: ColumnsType<UserOrderRecord> = [
		{ title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160, render: (text) => (
			<Button type="link" onClick={() => navigate('/orders', { state: { orderNo: text } })}>{text}</Button>
		)},
		{ title: '车型SKU', dataIndex: 'skuName', key: 'skuName', width: 200 },
		{ title: '补贴内容', dataIndex: 'subsidyContent', key: 'subsidyContent', width: 180 },
		{ title: '订单状态', dataIndex: 'status', key: 'status', width: 180 },
		{ title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
	]

	const fundColumns: ColumnsType<FundRecord> = [
		{ title: '流水号', dataIndex: 'flowNo', key: 'flowNo', width: 160 },
		{ title: '关联订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
		{ title: '金额(元)', dataIndex: 'amount', key: 'amount', width: 120, render: (v) => v.toFixed(2) },
		{ title: '打款时间', dataIndex: 'payTime', key: 'payTime', width: 180 },
		{ title: '操作人', dataIndex: 'operator', key: 'operator', width: 140 },
	]

	const logColumns: ColumnsType<LoginLogRecord> = [
		{ title: '登录时间', dataIndex: 'loginTime', key: 'loginTime', width: 180 },
		{ title: '登录IP', dataIndex: 'ip', key: 'ip', width: 140 },
		{ title: '设备信息', dataIndex: 'device', key: 'device', width: 260 },
	]

	return (
		<div className="p-6 space-y-4">
			{user && (
				<Card>
					<div className="flex items-center justify-between">
						<Space size={16}>
							<Avatar size={56} src={user.avatar}>{user.nickname?.[0]}</Avatar>
							<div>
								<div className="text-lg font-medium">{user.nickname}
									<span className="ml-3 text-gray-500 text-sm">用户ID：{user.id}</span>
								</div>
								<div className="text-gray-500">手机号：{user.phone || '-'}</div>
							</div>
						</Space>
						<Tag color={user.status === 'normal' ? 'green' : 'red'}>{user.status === 'normal' ? '正常' : '禁用'}</Tag>
					</div>
				</Card>
			)}

			<Tabs
				items={[
					{
						key: 'base',
						label: '基本信息',
						children: (
							<Card>
								<Descriptions column={2} bordered size="small">
									<Descriptions.Item label="注册时间">{user?.registerTime}</Descriptions.Item>
									<Descriptions.Item label="最后登录时间">{user?.lastLoginTime || '-'}</Descriptions.Item>
									<Descriptions.Item label="登录IP">{user?.loginIp || '10.0.0.1'}</Descriptions.Item>
									<Descriptions.Item label="微信OpenID">{user?.openid || 'openid_xxx'}</Descriptions.Item>
								</Descriptions>
							</Card>
						),
					},
					{
						key: 'orders',
						label: '订单记录',
						children: (
							<Card>
								<Table columns={orderColumns} dataSource={orders} rowKey="orderNo" pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
							</Card>
						),
					},
					{
						key: 'funds',
						label: '资金记录',
						children: (
							<Card>
								<Table columns={fundColumns} dataSource={funds} rowKey="flowNo" pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
							</Card>
						),
					},
					{
						key: 'logs',
						label: '登录日志',
						children: (
							<Card>
								<Table columns={logColumns} dataSource={logs} rowKey={(r) => r.loginTime + r.ip} pagination={{ pageSize: 10 }} scroll={{ x: 700 }} />
							</Card>
						),
					},
				]}
			/>
		</div>
	)
}


