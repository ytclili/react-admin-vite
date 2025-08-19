import { useEffect, useMemo, useState } from 'react'
import {
	Table,
	Button,
	Space,
	Modal,
	Form,
	Input,
	InputNumber,
	Upload,
	Tag,
	message,
} from 'antd'
import { PlusOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useLocation, useNavigate } from 'react-router-dom'

const { TextArea } = Input

interface SKURecord {
	id: string
	modelId: string
	modelName: string
	name: string
	price: number
	image?: string
	description?: string
	status: 'on' | 'off'
	createTime: string
}

interface StrategyRecord {
	id: string
	skuId: string
	supplierName: string
	settlementSubsidy: number
	userSubsidy?: number
	distributorCommission?: number
	platformProfit?: number // derived
	quota: number
	remainQuota: number
	status: 'enabled' | 'disabled'
	effectiveRange?: [string, string]
}

const SKU_STORAGE_KEY = 'demo_skus'
const STRATEGY_STORAGE_KEY = 'demo_sku_strategies'

function useQuery() {
	const { search } = useLocation()
	return useMemo(() => new URLSearchParams(search), [search])
}

function loadSkus(): SKURecord[] {
	try {
		const raw = localStorage.getItem(SKU_STORAGE_KEY)
		if (raw) return JSON.parse(raw)
		// seed with more diverse data
		const seed: SKURecord[] = [
			{ id: 'SK001', modelId: 'VM001', modelName: 'A6L', name: 'A6L 豪华型', price: 42.98, status: 'off', createTime: '2024-01-02 10:00' },
			{ id: 'SK002', modelId: 'VM002', modelName: '宝马5系', name: '530Li 领先型', price: 44.99, status: 'off', createTime: '2024-01-05 09:30' },
			{ id: 'SK003', modelId: 'VM001', modelName: 'A6L', name: 'A6L 运动型', price: 45.98, status: 'on', createTime: '2024-01-08 14:20' },
			{ id: 'SK004', modelId: 'VM003', modelName: '奔驰E级', name: 'E300L 豪华型', price: 48.68, status: 'off', createTime: '2024-01-10 11:15' },
			{ id: 'SK005', modelId: 'VM004', modelName: '丰田凯美瑞', name: '凯美瑞 2.5L 豪华版', price: 21.98, status: 'on', createTime: '2024-01-12 16:45' },
		]
		localStorage.setItem(SKU_STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function saveSkus(skus: SKURecord[]) {
	localStorage.setItem(SKU_STORAGE_KEY, JSON.stringify(skus))
}

function loadStrategies(): StrategyRecord[] {
	try {
		const raw = localStorage.getItem(STRATEGY_STORAGE_KEY)
		if (raw) return JSON.parse(raw)
		const seed: StrategyRecord[] = [
			{ id: 'STG001', skuId: 'SK001', supplierName: '供应商A', settlementSubsidy: 12000, userSubsidy: 8000, distributorCommission: 2000, platformProfit: 2000, quota: 100, remainQuota: 80, status: 'enabled' },
			{ id: 'STG002', skuId: 'SK001', supplierName: '供应商B', settlementSubsidy: 11000, userSubsidy: 7000, distributorCommission: 2500, platformProfit: 1500, quota: 50, remainQuota: 25, status: 'disabled' },
			{ id: 'STG003', skuId: 'SK002', supplierName: '供应商C', settlementSubsidy: 10000, userSubsidy: 5000, distributorCommission: 2000, platformProfit: 3000, quota: 40, remainQuota: 40, status: 'disabled' },
			{ id: 'STG004', skuId: 'SK003', supplierName: '供应商D', settlementSubsidy: 15000, userSubsidy: 10000, distributorCommission: 3000, platformProfit: 2000, quota: 80, remainQuota: 60, status: 'enabled' },
			{ id: 'STG005', skuId: 'SK005', supplierName: '供应商E', settlementSubsidy: 8000, userSubsidy: 5000, distributorCommission: 1500, platformProfit: 1500, quota: 120, remainQuota: 100, status: 'enabled' },
		]
		localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function saveStrategies(list: StrategyRecord[]) {
	localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(list))
}

function getFrontDisplaySubsidy(skuId: string, strategies: StrategyRecord[]) {
	const enabled = strategies.filter(s => s.skuId === skuId && s.status === 'enabled')
	if (enabled.length === 0) return 0
	return Math.max(...enabled.map(s => s.userSubsidy || 0))
}

export const SKU = () => {
	const query = useQuery()
	const navigate = useNavigate()
	const modelName = query.get('modelName')
	const modelId = query.get('modelId')

	const [skus, setSkus] = useState<SKURecord[]>([])
	const [strategies, setStrategies] = useState<StrategyRecord[]>([])
	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<SKURecord | null>(null)
	const [form] = Form.useForm()

	useEffect(() => {
		const s = loadSkus()
		const st = loadStrategies()
		setSkus(s)
		setStrategies(st)
	}, [])

	const filteredSkus = useMemo(() => {
		// If modelId exists, filter by modelId; otherwise show all SKUs
		if (modelId) {
			return skus.filter(s => s.modelId === modelId)
		}
		return skus
	}, [skus, modelId])

	const columns: ColumnsType<SKURecord> = [
		{ title: 'SKU ID', dataIndex: 'id', key: 'id', width: 120 },
		{ title: 'SKU名称', dataIndex: 'name', key: 'name', width: 220 },
		// Only show model name column when displaying all SKUs
		...(modelId ? [] : [{ title: '所属车型', dataIndex: 'modelName', key: 'modelName', width: 120 }]),
		{ title: '官方指导价', dataIndex: 'price', key: 'price', width: 140, render: (v: number) => `¥${v.toFixed(2)}万` },
		{ title: '前台展示补贴', key: 'front', width: 160, render: (_, r) => `${(getFrontDisplaySubsidy(r.id, strategies) / 100).toFixed(2)} 元` },
		{ title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center', render: (s: SKURecord['status']) => <Tag color={s === 'on' ? 'green' : 'default'}>{s === 'on' ? '上架' : '下架'}</Tag> },
		{
			title: '操作', key: 'action', width: 320, render: (_, record) => (
				<Space size="small">
					<Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>编辑</Button>
					<Button type="link" onClick={() => onManageStrategies(record)}>管理补贴策略</Button>
					{record.status === 'off' ? (
						<Button type="link" onClick={() => onShelf(record, true)}>上架</Button>
					) : (
						<Button type="link" danger onClick={() => onShelf(record, false)}>下架</Button>
					)}
				</Space>
			)
		},
	]

	function onAdd() {
		setEditing(null)
		form.resetFields()
		// If we have a model context, set it; otherwise leave empty for user to select
		if (modelName) {
			form.setFieldsValue({ model: modelName })
		}
		setVisible(true)
	}

	function onEdit(rec: SKURecord) {
		setEditing(rec)
		form.setFieldsValue({
			model: rec.modelName,
			name: rec.name,
			price: rec.price,
			description: rec.description,
		})
		setVisible(true)
	}

	function onManageStrategies(rec: SKURecord) {
		navigate(`/sku/strategies?skuId=${encodeURIComponent(rec.id)}&skuName=${encodeURIComponent(rec.name)}`)
	}

	function onShelf(rec: SKURecord, toOn: boolean) {
		if (toOn) {
			const hasEnabled = strategies.some(s => s.skuId === rec.id && s.status === 'enabled')
			if (!hasEnabled) {
				message.error('无法上架，请先配置并启用至少一条有效的供应商补贴策略')
				return
			}
		}
		const newSkus: SKURecord[] = skus.map(s => (s.id === rec.id ? { ...s, status: (toOn ? 'on' : 'off') as 'on' | 'off' } : s))
		setSkus(newSkus)
		saveSkus(newSkus)
		message.success(toOn ? '上架成功' : '下架成功')
	}

	async function onSubmit() {
		try {
			const values = await form.validateFields()
			const newList = [...skus]
			if (editing) {
				const idx = newList.findIndex(s => s.id === editing.id)
				newList[idx] = { ...editing, name: values.name, price: values.price, description: values.description }
				setSkus(newList)
				saveSkus(newList)
				message.success('SKU更新成功')
			} else {
				const id = `SK${String(Date.now()).slice(-6)}`
				const rec: SKURecord = {
					id,
					modelId: modelId || `VM-${Date.now()}`, // Generate a unique ID if no model context
					modelName: modelName || values.modelName || '未命名车型',
					name: values.name,
					price: values.price,
					image: undefined,
					description: values.description,
					status: 'off',
					createTime: new Date().toLocaleString(),
				}
				newList.push(rec)
				setSkus(newList)
				saveSkus(newList)
				message.success('SKU创建成功')
			}
			setVisible(false)
			setEditing(null)
		} catch (e) {
			// ignore
		}
	}

	return (
		<div className="space-y-4">
			{modelName ? (
				<div className="text-black/45">车型管理 / <span className="text-black/80">{modelName}</span> / SKU管理</div>
			) : (
				<div className="text-black/45">SKU管理</div>
			)}

			<div>
				<Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>新增SKU</Button>
			</div>

			<div className="bg-white rounded-lg border border-[#F0F0F0]">
				<div className="p-4 border-b border-[#F0F0F0]">
					<h3 className="text-lg font-medium">SKU列表</h3>
				</div>
				<Table
					columns={columns}
					dataSource={filteredSkus}
					rowKey="id"
					pagination={{ pageSize: 10 }}
				/>
			</div>

			<Modal
				title={editing ? '编辑SKU' : '新增SKU'}
				open={visible}
				onCancel={() => { setVisible(false); setEditing(null) }}
				onOk={onSubmit}
				okText="保存"
				confirmLoading={false}
				width={640}
				destroyOnClose
			>
				<Form form={form} layout="vertical">
					{modelName ? (
						<Form.Item label="所属车型" name="model">
							<Input disabled />
						</Form.Item>
					) : (
						<Form.Item label="所属车型" name="modelName" rules={[{ required: true, message: '请选择所属车型' }]}>
							<Input placeholder="请输入所属车型名称" />
						</Form.Item>
					)}
					<Form.Item label="SKU名称" name="name" rules={[{ required: true, message: '请输入SKU名称' }, { max: 50, message: '不超过50字符' }]}>
						<Input placeholder="如：530Li 领先型 M运动套装" />
					</Form.Item>
					<Form.Item label="官方指导价" name="price" rules={[{ required: true, message: '请输入官方指导价' }]}>
						<InputNumber min={0} precision={2} addonAfter="万元" style={{ width: '100%' }} />
					</Form.Item>
					<Form.Item label="SKU图片" name="image">
						<Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
							<div>
								<UploadOutlined />
								<div style={{ marginTop: 8 }}>上传</div>
							</div>
						</Upload>
					</Form.Item>
					<Form.Item label="配置简介" name="description">
						<TextArea rows={4} maxLength={500} showCount placeholder="用于描述该配置的亮点" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
