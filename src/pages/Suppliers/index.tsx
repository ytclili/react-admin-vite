import { useEffect, useState } from 'react'
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select

type SupplierType = 'brand' | 'channel'
type SupplierStatus = 'enabled' | 'disabled'

interface SupplierRecord {
	id: string
	name: string
	type: SupplierType
	contactName?: string
	contactPhone?: string
	skuCount: number
	status: SupplierStatus
	createTime: string
}

const SUPPLIERS_KEY = 'suppliers'

function loadSuppliers(): SupplierRecord[] {
	try {
		const raw = localStorage.getItem(SUPPLIERS_KEY)
		if (!raw) return []
		return JSON.parse(raw)
	} catch {
		return []
	}
}

function saveSuppliers(list: SupplierRecord[]) {
	localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list))
}

function seedIfEmpty() {
	const existing = loadSuppliers()
	if (existing.length === 0) {
		const now = new Date().toLocaleString()
		const seeded: SupplierRecord[] = [
			{ id: 'SUP001', name: '理想汽车销售有限公司', type: 'brand', contactName: '赵经理', contactPhone: '13800001111', skuCount: 8, status: 'enabled', createTime: now },
			{ id: 'SUP002', name: '北京XX经销商集团', type: 'channel', contactName: '钱主管', contactPhone: '13900002222', skuCount: 12, status: 'enabled', createTime: now },
			{ id: 'SUP003', name: '华南渠道联盟', type: 'channel', contactName: '孙总', contactPhone: '13700003333', skuCount: 5, status: 'disabled', createTime: now },
		]
		saveSuppliers(seeded)
	}
}

export const Suppliers = () => {
	const navigate = useNavigate()

	const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
	const [filtered, setFiltered] = useState<SupplierRecord[]>([])
	const [loading, setLoading] = useState(false)

	const [nameLike, setNameLike] = useState('')
	const [typeFilter, setTypeFilter] = useState<SupplierType | 'all'>('all')
	const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all')

	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<SupplierRecord | null>(null)
	const [form] = Form.useForm()

	useEffect(() => {
		seedIfEmpty()
		const s = loadSuppliers()
		setSuppliers(s)
		setFiltered(s)
	}, [])

	const handleSearch = () => {
		let list = [...suppliers]
		if (nameLike.trim()) {
			list = list.filter(x => x.name.includes(nameLike))
		}
		if (typeFilter !== 'all') {
			list = list.filter(x => x.type === typeFilter)
		}
		if (statusFilter !== 'all') {
			list = list.filter(x => x.status === statusFilter)
		}
		setFiltered(list)
	}

	const handleReset = () => {
		setNameLike('')
		setTypeFilter('all')
		setStatusFilter('all')
		setFiltered(suppliers)
	}

	const showModal = (rec?: SupplierRecord) => {
		setEditing(rec || null)
		if (rec) {
			form.setFieldsValue({
				name: rec.name,
				type: rec.type,
				contactName: rec.contactName,
				contactPhone: rec.contactPhone,
			})
		} else {
			form.resetFields()
		}
		setVisible(true)
	}

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields()
			setLoading(true)
			const newList = [...suppliers]
			if (editing) {
				const idx = newList.findIndex(s => s.id === editing.id)
				newList[idx] = {
					...editing,
					name: values.name as string,
					type: values.type as SupplierType,
					contactName: values.contactName as string,
					contactPhone: values.contactPhone as string,
				}
				setSuppliers(newList)
				saveSuppliers(newList)
				message.success('供应商更新成功')
			} else {
				const id = `SUP${String(Date.now()).slice(-5)}`
				const rec: SupplierRecord = {
					id,
					name: values.name as string,
					type: values.type as SupplierType,
					contactName: values.contactName as string,
					contactPhone: values.contactPhone as string,
					skuCount: 0,
					status: 'enabled',
					createTime: new Date().toLocaleString(),
				}
				newList.unshift(rec)
				setSuppliers(newList)
				saveSuppliers(newList)
				message.success('供应商创建成功')
			}
			setVisible(false)
			setEditing(null)
			setTimeout(handleSearch, 0)
		} finally {
			setLoading(false)
		}
	}

	const toggleStatus = (rec: SupplierRecord) => {
		const newStatus: SupplierStatus = rec.status === 'enabled' ? 'disabled' : 'enabled'
		const newList = suppliers.map(s => s.id === rec.id ? { ...s, status: newStatus } : s)
		setSuppliers(newList)
		saveSuppliers(newList)
		setTimeout(handleSearch, 0)
		message.success(newStatus === 'enabled' ? '已启用' : '已禁用')
	}

	const onManageSkus = (rec: SupplierRecord) => {
		navigate(`/suppliers/manage?supplierId=${encodeURIComponent(rec.id)}&supplierName=${encodeURIComponent(rec.name)}`)
	}

	const columns: ColumnsType<SupplierRecord> = [
		{ title: '供应商ID', dataIndex: 'id', key: 'id', width: 140 },
		{ title: '供应商名称', dataIndex: 'name', key: 'name', width: 220 },
		{ title: '供应商类型', dataIndex: 'type', key: 'type', width: 120, render: (t: SupplierType) => t === 'brand' ? '品牌方' : '渠道商' },
		{ title: '联系人', key: 'contact', width: 180, render: (_, r) => `${r.contactName || '-'} / ${r.contactPhone || '-'}` },
		{ title: '关联SKU数', dataIndex: 'skuCount', key: 'skuCount', width: 120, align: 'center' },
		{ title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center', render: (s: SupplierStatus) => <Tag color={s === 'enabled' ? 'green' : 'red'}>{s === 'enabled' ? '启用' : '禁用'}</Tag> },
		{ title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
		{
			title: '操作', key: 'action', width: 320, render: (_, record) => (
				<Space size="small">
					<Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
					<Button type="link" onClick={() => onManageSkus(record)}>管理补贴车型</Button>
					<Popconfirm title={`确定要${record.status === 'enabled' ? '禁用' : '启用'}该供应商吗？`} onConfirm={() => toggleStatus(record)}>
						<Button type="link" danger={record.status === 'enabled'}>{record.status === 'enabled' ? '禁用' : '启用'}</Button>
					</Popconfirm>
				</Space>
			)
		},
	]

	return (
		<div className="p-6 space-y-4">
			<div className="p-4 bg-white rounded-lg border border-gray-200">
				<Space size={16} wrap>
					<div className="flex items-center gap-2">
						<span className="text-gray-600">供应商名称：</span>
						<Search placeholder="输入名称" value={nameLike} onChange={(e) => setNameLike(e.target.value)} onSearch={handleSearch} style={{ width: 220 }} />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-600">类型：</span>
						<Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }}>
							<Option value="all">全部</Option>
							<Option value="brand">品牌方</Option>
							<Option value="channel">渠道商</Option>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-600">状态：</span>
						<Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
							<Option value="all">全部</Option>
							<Option value="enabled">启用</Option>
							<Option value="disabled">禁用</Option>
						</Select>
					</div>
					<Button type="primary" onClick={handleSearch}>查询</Button>
					<Button onClick={handleReset}>重置</Button>
				</Space>
			</div>

			<div>
				<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>新增供应商</Button>
			</div>

			<div className="bg-white rounded-lg border border-gray-200">
				<div className="p-4 border-b border-gray-200">
					<h3 className="text-lg font-medium">供应商列表</h3>
				</div>
				<Table columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 10 }} />
			</div>

			<Modal title={editing ? '编辑供应商' : '新增供应商'} open={visible} onCancel={() => { setVisible(false); setEditing(null) }} onOk={handleSubmit} confirmLoading={loading} destroyOnClose>
				<Form form={form} layout="vertical">
					<Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }, { max: 50, message: '不超过50字符' }]}>
						<Input placeholder="如：理想汽车销售有限公司" />
					</Form.Item>
					<Form.Item name="type" label="供应商类型" rules={[{ required: true, message: '请选择类型' }]}>
						<Select placeholder="请选择">
							<Option value="brand">品牌方</Option>
							<Option value="channel">渠道商</Option>
						</Select>
					</Form.Item>
					<Form.Item name="contactName" label="联系人姓名">
						<Input placeholder="联系人姓名" />
					</Form.Item>
					<Form.Item name="contactPhone" label="联系人电话" rules={[{ pattern: /^\d{6,20}$/, message: '请输入正确的电话' }]}>
						<Input placeholder="联系人电话" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
