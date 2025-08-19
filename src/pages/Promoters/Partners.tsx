import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Radio, Row, Select, Space, Table, Tag, message } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { useNavigate } from 'react-router-dom'

type SettlementMethod = '对公结算' | '钱包结算'
type PartnerStatus = '合作中' | '已终止'

interface PartnerRecord {
	id: string
	name: string
	account: string
	settlementMethod: SettlementMethod
	publicAccountInfo?: string
	contactName: string
	contactPhone: string
	promoterCount: number
	status: PartnerStatus
	createdAt: string
	password?: string
}

const STORAGE_KEY = 'promoter_partners'

function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultPartners(): PartnerRecord[] {
	return [
		{
			id: 'p1',
			name: '星河汽车销售集团',
			account: 'xinghe_admin',
			settlementMethod: '对公结算',
			publicAccountInfo: '开户名：星河汽车集团\n开户行：招商银行北京分行\n账号：6222333344445555',
			contactName: '王丽',
			contactPhone: '13800000001',
			promoterCount: 42,
			status: '合作中',
			createdAt: nowString(),
		},
		{
			id: 'p2',
			name: '晨曦渠道团队',
			account: 'chenxi_team',
			settlementMethod: '钱包结算',
			contactName: '李强',
			contactPhone: '13900000002',
			promoterCount: 17,
			status: '合作中',
			createdAt: nowString(),
		},
	]
}

function loadPartners(): PartnerRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed: PartnerRecord[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultPartners()
				localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultPartners()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function savePartners(list: PartnerRecord[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function PromoterPartners() {
	const navigate = useNavigate()
	const [partners, setPartners] = useState<PartnerRecord[]>([])
	const [query, setQuery] = useState<{ name?: string; settlementMethod?: SettlementMethod | undefined }>({})
	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<PartnerRecord | null>(null)
	const [form] = Form.useForm()

	const [pwdVisible, setPwdVisible] = useState(false)
	const [pwdForm] = Form.useForm()
	const [pwdTarget, setPwdTarget] = useState<PartnerRecord | null>(null)

	useEffect(() => {
		setPartners(loadPartners())
	}, [])

	useEffect(() => {
		savePartners(partners)
	}, [partners])

	const filtered = useMemo(() => {
		return partners.filter(p => {
			if (query.name && !p.name.includes(query.name)) return false
			if (query.settlementMethod && p.settlementMethod !== query.settlementMethod) return false
			return true
		})
	}, [partners, query])

	const onSearch = () => {
		const values = form.getFieldsValue()
		setQuery({ name: values.q_name || undefined, settlementMethod: values.q_settlement || undefined })
	}

	const onReset = () => {
		form.resetFields(['q_name', 'q_settlement'])
		setQuery({})
	}

	const openCreate = () => {
		setEditing(null)
		setVisible(true)
		form.resetFields()
		form.setFieldsValue({ settlementMethod: '钱包结算' as SettlementMethod, status: '合作中' as PartnerStatus })
	}

	const openEdit = (rec: PartnerRecord) => {
		setEditing(rec)
		setVisible(true)
		form.setFieldsValue({
			name: rec.name,
			contactName: rec.contactName,
			contactPhone: rec.contactPhone,
			settlementMethod: rec.settlementMethod,
			publicAccountInfo: rec.publicAccountInfo,
			account: rec.account,
			status: rec.status,
		})
	}

	const submit = async () => {
		try {
			const values = await form.validateFields()
			const isCorp = values.settlementMethod === ('对公结算' as SettlementMethod)
			if (isCorp && !values.publicAccountInfo) {
				message.warning('对公结算需填写对公账户信息')
				return
			}
			if (!editing) {
				// create
				const exists = partners.some(p => p.account === values.account)
				if (exists) {
					message.warning('后台登录账号已存在')
					return
				}
				const newItem: PartnerRecord = {
					id: `p${Date.now()}`,
					name: String(values.name),
					account: String(values.account),
					settlementMethod: values.settlementMethod as SettlementMethod,
					publicAccountInfo: values.publicAccountInfo ? String(values.publicAccountInfo) : undefined,
					contactName: String(values.contactName),
					contactPhone: String(values.contactPhone),
					promoterCount: Math.floor(Math.random() * 50),
					status: values.status as PartnerStatus,
					createdAt: nowString(),
					password: String(values.password),
				}
				setPartners(prev => [newItem, ...prev])
				message.success('创建成功')
			} else {
				// update
				const updated: PartnerRecord = {
					...editing,
					name: String(values.name),
					settlementMethod: values.settlementMethod as SettlementMethod,
					publicAccountInfo: values.publicAccountInfo ? String(values.publicAccountInfo) : undefined,
					contactName: String(values.contactName),
					contactPhone: String(values.contactPhone),
					status: values.status as PartnerStatus,
				}
				setPartners(prev => prev.map(p => (p.id === editing.id ? updated : p)))
				message.success('更新成功')
			}
			setVisible(false)
		} catch {}
	}

	const managePromoters = (rec: PartnerRecord) => {
		navigate(`/promoters/list?partnerId=${encodeURIComponent(rec.id)}&partnerName=${encodeURIComponent(rec.name)}`)
	}

	const confirmTerminate = (rec: PartnerRecord) => {
		const newStatus: PartnerStatus = rec.status === '合作中' ? '已终止' : '合作中'
		setPartners(prev => prev.map(p => (p.id === rec.id ? { ...p, status: newStatus } : p)))
		message.success(newStatus === '合作中' ? '已恢复合作' : '已终止合作')
	}

	const openResetPwd = (rec: PartnerRecord) => {
		setPwdTarget(rec)
		setPwdVisible(true)
		pwdForm.resetFields()
	}

	const submitResetPwd = async () => {
		try {
			const values = await pwdForm.validateFields()
			setPartners(prev => prev.map(p => (p.id === pwdTarget?.id ? { ...p, password: String(values.newPwd) } : p)))
			message.success('密码已重置')
			setPwdVisible(false)
		} catch {}
	}

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">合作方管理</div>
				<Space>
					<Button onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPartners())); setPartners(loadPartners()); message.success('已填充示例数据'); }}>填充示例数据</Button>
					<Button type="primary" onClick={openCreate}>新增合作方</Button>
				</Space>
			</div>
			<Card>
				<Form form={form} layout="inline" className="w-full flex flex-wrap gap-3">
					<Form.Item name="q_name" label="合作方名称">
						<Input placeholder="请输入名称" allowClear style={{ width: 240 }} />
					</Form.Item>
					<Form.Item name="q_settlement" label="结算方式">
						<Select allowClear placeholder="全部" style={{ width: 200 }} options={[{ value: '对公结算', label: '对公结算' }, { value: '钱包结算', label: '钱包结算' }]} />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSearch}>查询</Button>
						<Button onClick={onReset}>重置</Button>
					</Space>
				</Form>
			</Card>
			<Card>
				<Table
					rowKey="id"
					dataSource={filtered}
					pagination={{ pageSize: 10 }}
					columns={[
						{ title: '合作方ID', dataIndex: 'id', width: 120 },
						{ title: '合作方名称', dataIndex: 'name' },
						{ title: '后台登录账号', dataIndex: 'account' },
						{ title: '结算方式', dataIndex: 'settlementMethod', render: (v: SettlementMethod) => <Tag color={v === '对公结算' ? 'blue' : 'green'}>{v}</Tag> },
						{ title: '联系人/电话', render: (_: any, r: PartnerRecord) => `${r.contactName} / ${r.contactPhone}` },
						{ title: '旗下推客数', dataIndex: 'promoterCount', width: 120 },
						{ title: '状态', dataIndex: 'status', width: 120, render: (v: PartnerStatus) => <Tag color={v === '合作中' ? 'success' : 'default'}>{v}</Tag> },
						{
							title: '操作',
							width: 300,
							render: (_: any, r: PartnerRecord) => (
								<Space>
									<Button size="small" onClick={() => openEdit(r)}>编辑</Button>
									<Button size="small" onClick={() => managePromoters(r)}>管理推客</Button>
									<Button size="small" onClick={() => openResetPwd(r)}>重置密码</Button>
									<Popconfirm title={r.status === '合作中' ? '确定终止合作？' : '确定恢复合作？'} onConfirm={() => confirmTerminate(r)}>
										<Button size="small" danger={r.status === '合作中'}>{r.status === '合作中' ? '终止合作' : '恢复合作'}</Button>
									</Popconfirm>
								</Space>
							),
						},
					]}
				/>
			</Card>

			<Modal
				open={visible}
				title={editing ? '编辑合作方' : '新增合作方'}
				onCancel={() => setVisible(false)}
				onOk={submit}
				okText="保存"
			>
				<Form form={form} layout="vertical">
					<Form.Item name="name" label="合作方名称" rules={[{ required: true, message: '请输入合作方名称' }]}>
						<Input maxLength={40} />
					</Form.Item>
					<Row gutter={12}>
						<Col span={12}>
							<Form.Item name="contactName" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
								<Input maxLength={20} />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item name="contactPhone" label="电话" rules={[{ required: true, message: '请输入联系电话' }]}>
								<Input maxLength={20} />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item name="settlementMethod" label="结算方式" rules={[{ required: true, message: '请选择结算方式' }]}>
						<Radio.Group>
							<Radio value={'对公结算' as SettlementMethod}>对公结算</Radio>
							<Radio value={'钱包结算' as SettlementMethod}>钱包结算</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item shouldUpdate noStyle>
						{() => (form.getFieldValue('settlementMethod') === ('对公结算' as SettlementMethod) ? (
							<Form.Item name="publicAccountInfo" label="对公账户信息" rules={[{ required: true, message: '请输入对公账户信息' }]}>
								<TextArea rows={4} placeholder="开户名/开户行/账号 等" />
							</Form.Item>
						) : null)}
					</Form.Item>
					<Row gutter={12}>
						<Col span={12}>
							<Form.Item name="account" label="后台登录账号" rules={editing ? [] : [{ required: true, message: '请输入后台登录账号' }]}>
								<Input disabled={!!editing} maxLength={30} />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item name="password" label="初始密码" rules={editing ? [] : [{ required: true, message: '请输入初始密码' }, { validator: (_, v) => v && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? Promise.resolve() : Promise.reject('至少8位，包含字母和数字') }]}>
								<Input.Password placeholder="请设置为强密码" visibilityToggle={!editing} disabled={!!editing} />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
						<Select style={{ width: 200 }} options={[{ value: '合作中', label: '合作中' }, { value: '已终止', label: '已终止' }]} />
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				open={pwdVisible}
				title={`重置密码 - ${pwdTarget?.name || ''}`}
				onCancel={() => setPwdVisible(false)}
				onOk={submitResetPwd}
				okText="保存"
			>
				<Form form={pwdForm} layout="vertical">
					<Form.Item name="newPwd" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { validator: (_, v) => v && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v) ? Promise.resolve() : Promise.reject('至少8位，包含字母和数字') }]}>
						<Input.Password placeholder="请设置为强密码" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}


