import { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space, InputNumber, Tag, message, Modal, Select, Card } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useLocation } from 'react-router-dom'

interface StrategyRow {
	id: string
	skuId: string
	supplierName?: string
	settlementSubsidy: number
	userSubsidy?: number
	distributorCommission?: number
	quota: number
	remainQuota: number
	status: 'enabled' | 'disabled'
	effectiveRange?: [string, string]
	// view only
	skuName?: string
}

interface SKUOption { id: string; name: string }

const STRATEGY_STORAGE_KEY = 'demo_sku_strategies'
const SKU_STORAGE_KEY = 'demo_skus'

function useQuery() {
	const { search } = useLocation()
	return useMemo(() => new URLSearchParams(search), [search])
}

function loadStrategies(): StrategyRow[] {
	try {
		const raw = localStorage.getItem(STRATEGY_STORAGE_KEY)
		return raw ? JSON.parse(raw) : []
	} catch { return [] }
}

function saveStrategies(list: StrategyRow[]) {
	localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(list))
}

function loadAllSkus(): SKUOption[] {
	try {
		const raw = localStorage.getItem(SKU_STORAGE_KEY)
		const arr = raw ? JSON.parse(raw) : []
		return arr.map((s: any) => ({ id: s.id, name: s.name }))
	} catch { return [] }
}

export default function SuppliersManage() {
	const query = useQuery()
	const supplierId = query.get('supplierId') || ''
	const supplierName = query.get('supplierName') || ''

	const [rows, setRows] = useState<StrategyRow[]>([])
	const [allSkus, setAllSkus] = useState<SKUOption[]>([])
	const [selectVisible, setSelectVisible] = useState(false)
	const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([])

	useEffect(() => {
		const all = loadStrategies()
		const skus = loadAllSkus()
		setAllSkus(skus)
		const filtered = all.filter(s => s.supplierName === supplierName)
		setRows(attachSkuNames(filtered, skus))
	}, [])

	function attachSkuNames(list: StrategyRow[], skus: SKUOption[]): StrategyRow[] {
		const map = new Map(skus.map(s => [s.id, s.name]))
		return list.map(r => ({ ...r, skuName: map.get(r.skuId) || r.skuId }))
	}

	const columns: ColumnsType<StrategyRow> = [
		{ title: '车型SKU', dataIndex: 'skuName', key: 'skuName', width: 220 },
		{ title: '结算补贴(元)', dataIndex: 'settlementSubsidy', key: 'settlementSubsidy', width: 140, render: (v, r) => (
			<InputNumber min={0} precision={2} value={v} onChange={(nv) => updateRow(r.id, { settlementSubsidy: Number(nv) })} />
		)},
		{ title: '用户补贴(元)', dataIndex: 'userSubsidy', key: 'userSubsidy', width: 140, render: (v, r) => (
			<InputNumber min={0} precision={2} value={v} onChange={(nv) => updateRow(r.id, { userSubsidy: Number(nv) })} />
		)},
		{ title: '分销佣金(元)', dataIndex: 'distributorCommission', key: 'distributorCommission', width: 140, render: (v, r) => (
			<InputNumber min={0} precision={2} value={v} onChange={(nv) => updateRow(r.id, { distributorCommission: Number(nv) })} />
		)},
		{ title: '平台利润(元)', key: 'platformProfit', width: 140, render: (_, r) => (
			<span>{Number(r.settlementSubsidy) - Number(r.userSubsidy || 0) - Number(r.distributorCommission || 0)}</span>
		)},
		{ title: '补贴名额', dataIndex: 'quota', key: 'quota', width: 120, render: (v, r) => (
			<InputNumber min={0} value={v} onChange={(nv) => updateRow(r.id, { quota: Number(nv) })} />
		)},
		{ title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center', render: (s: StrategyRow['status']) => (
			<Tag color={s === 'enabled' ? 'green' : 'default'}>{s === 'enabled' ? '启用' : '禁用'}</Tag>
		)},
		{ title: '操作', key: 'action', width: 140, render: (_, r) => (
			<Space size="small">
				<Button danger type="link" onClick={() => unlink(r)}>解除关联</Button>
			</Space>
		)},
	]

	function mergeSaveById(id: string, patch: Partial<StrategyRow>) {
		const full = loadStrategies()
		const merged = full.map(r => r.id === id ? { ...r, ...patch } : r)
		saveStrategies(merged)
	}

	function updateRow(id: string, patch: Partial<StrategyRow>) {
		const next = rows.map(r => r.id === id ? { ...r, ...patch } : r)
		setRows(next)
		mergeSaveById(id, patch)
	}

	function unlink(r: StrategyRow) {
		// here we simply set disabled to simulate disabling in SKU module
		updateRow(r.id, { status: 'disabled' })
		message.success('已解除关联，策略已禁用')
	}

	function openAssociate() {
		setSelectedSkuIds([])
		setSelectVisible(true)
	}

	function confirmAssociate() {
		const addedCore = selectedSkuIds
			.filter(id => !rows.some(r => r.skuId === id))
			.map(id => ({
				id: `STG${String(Date.now()).slice(-6)}-${id}`,
				skuId: id,
				supplierName,
				settlementSubsidy: 0,
				userSubsidy: 0,
				distributorCommission: 0,
				quota: 0,
				remainQuota: 0,
				status: 'disabled' as const,
			}))
		const full = loadStrategies()
		const merged = [...full, ...addedCore]
		saveStrategies(merged)
		const addedView = attachSkuNames(addedCore, allSkus)
		const next = [...rows, ...addedView]
		setRows(next)
		message.success('已关联所选SKU')
		setSelectVisible(false)
	}

	return (
		<div className="p-6 space-y-4">
			<div className="text-black/45">供应商管理 / <span className="text-black/80">{supplierName || '未命名供应商'}</span> / 管理补贴车型</div>
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">已关联的SKU与补贴策略</h3>
				<Button type="primary" onClick={openAssociate}>关联新车型</Button>
			</div>
			<Table columns={columns} dataSource={rows} rowKey="id" pagination={{ pageSize: 10 }} />

			<Modal title="关联新车型" open={selectVisible} onOk={confirmAssociate} onCancel={() => setSelectVisible(false)} destroyOnClose>
				<Select
					mode="multiple"
					style={{ width: '100%' }}
					placeholder="搜索并选择要关联的SKU"
					value={selectedSkuIds}
					onChange={setSelectedSkuIds}
					showSearch
					filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
					options={allSkus.map(s => ({ value: s.id, label: s.name }))}
				/>
				<div className="text-gray-500 mt-2">已选择：{selectedSkuIds.length} 个</div>
			</Modal>
		</div>
	)
}


