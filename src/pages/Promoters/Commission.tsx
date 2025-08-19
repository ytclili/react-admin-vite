import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Radio, Row, Select, Space, Table, Tag, message } from 'antd'

type RuleType = '购车分成' | '线索分成' | '团队管理奖'
type CalcMethod = '固定金额' | '结算补贴百分比'

interface CommissionRule {
	id: string
	name: string
	type: RuleType
	calcMethod: CalcMethod
	value: number
	createdAt: string
}

interface StrategyGroup {
	id: string
	name: string
	purchaseRuleId?: string
	leadRuleId?: string
	teamRuleId?: string
	createdAt: string
}

const STORAGE_RULES_KEY = 'promoter_rules'
const STORAGE_GROUPS_KEY = 'promoter_strategy_groups'

function defaultRules(): CommissionRule[] {
	return [
		{ id: 'r1', name: '基础购车分成', type: '购车分成', calcMethod: '结算补贴百分比', value: 10, createdAt: nowString() },
		{ id: 'r2', name: '基础线索奖励', type: '线索分成', calcMethod: '固定金额', value: 20, createdAt: nowString() },
		{ id: 'r3', name: '团队管理基础奖', type: '团队管理奖', calcMethod: '固定金额', value: 50, createdAt: nowString() },
	]
}

function defaultGroups(): StrategyGroup[] {
	return [
		{ id: 'g1', name: '个人推客默认组', purchaseRuleId: 'r1', leadRuleId: 'r2', teamRuleId: 'r3', createdAt: nowString() },
	]
}

function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function loadRules(): CommissionRule[] {
	try {
		const raw = localStorage.getItem(STORAGE_RULES_KEY)
		if (raw) {
			const parsed: CommissionRule[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultRules()
				localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultRules()
		localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function saveRules(rules: CommissionRule[]) {
	localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(rules))
}

function loadGroups(): StrategyGroup[] {
	try {
		const raw = localStorage.getItem(STORAGE_GROUPS_KEY)
		if (raw) {
			const parsed: StrategyGroup[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultGroups()
				localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultGroups()
		localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(seed))
		return seed
	} catch {
		return []
	}
}

function saveGroups(groups: StrategyGroup[]) {
	localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups))
}

export default function PromoterCommission() {
	const [rules, setRules] = useState<CommissionRule[]>([])
	const [groups, setGroups] = useState<StrategyGroup[]>([])

	const [ruleModalOpen, setRuleModalOpen] = useState(false)
	const [editingRule, setEditingRule] = useState<CommissionRule | null>(null)
	const [ruleForm] = Form.useForm()

	const [groupModalOpen, setGroupModalOpen] = useState(false)
	const [editingGroup, setEditingGroup] = useState<StrategyGroup | null>(null)
	const [groupForm] = Form.useForm()

	useEffect(() => {
		setRules(loadRules())
		setGroups(loadGroups())
	}, [])

	useEffect(() => {
		saveRules(rules)
	}, [rules])

	useEffect(() => {
		saveGroups(groups)
	}, [groups])

	const purchaseRules = useMemo(() => rules.filter(r => r.type === '购车分成'), [rules])
	const leadRules = useMemo(() => rules.filter(r => r.type === '线索分成'), [rules])
	const teamRules = useMemo(() => rules.filter(r => r.type === '团队管理奖'), [rules])

	const referencedRuleIds = useMemo(() => new Set(groups.flatMap(g => [g.purchaseRuleId, g.leadRuleId, g.teamRuleId]).filter(Boolean) as string[]), [groups])

	const handleCreateRule = () => {
		setEditingRule(null)
		ruleForm.resetFields()
		setRuleModalOpen(true)
	}

	const handleEditRule = (rule: CommissionRule) => {
		setEditingRule(rule)
		ruleForm.setFieldsValue(rule)
		setRuleModalOpen(true)
	}

	const handleDeleteRule = (rule: CommissionRule) => {
		if (referencedRuleIds.has(rule.id)) {
			message.warning('该规则已被策略组引用，无法删除')
			return
		}
		setRules(prev => prev.filter(r => r.id !== rule.id))
		message.success('删除成功')
	}

	const submitRule = async () => {
		try {
			const values = await ruleForm.validateFields()
			const payload: CommissionRule = {
				id: editingRule ? editingRule.id : `r${Date.now()}`,
				name: String(values.name),
				type: values.type as RuleType,
				calcMethod: values.calcMethod as CalcMethod,
				value: Number(values.value || 0),
				createdAt: editingRule ? editingRule.createdAt : nowString(),
			}
			if (editingRule) {
				if (referencedRuleIds.has(editingRule.id) && editingRule.type !== payload.type) {
					message.warning('该规则已被策略组引用，不能修改类型')
					return
				}
				setRules(prev => prev.map(r => (r.id === editingRule.id ? payload : r)))
				message.success('更新成功')
			} else {
				setRules(prev => [payload, ...prev])
				message.success('创建成功')
			}
			setRuleModalOpen(false)
		} catch {}
	}

	const handleCreateGroup = () => {
		setEditingGroup(null)
		groupForm.resetFields()
		setGroupModalOpen(true)
	}

	const handleEditGroup = (g: StrategyGroup) => {
		setEditingGroup(g)
		groupForm.setFieldsValue(g)
		setGroupModalOpen(true)
	}

	const handleDeleteGroup = (g: StrategyGroup) => {
		setGroups(prev => prev.filter(i => i.id !== g.id))
		message.success('删除成功')
	}

	const submitGroup = async () => {
		try {
			const values = await groupForm.validateFields()
			const payload: StrategyGroup = {
				id: editingGroup ? editingGroup.id : `g${Date.now()}`,
				name: String(values.name),
				purchaseRuleId: values.purchaseRuleId || undefined,
				leadRuleId: values.leadRuleId || undefined,
				teamRuleId: values.teamRuleId || undefined,
				createdAt: editingGroup ? editingGroup.createdAt : nowString(),
			}
			if (!payload.purchaseRuleId && !payload.leadRuleId && !payload.teamRuleId) {
				message.warning('至少选择一个分成规则')
				return
			}
			if (editingGroup) {
				setGroups(prev => prev.map(i => (i.id === editingGroup.id ? payload : i)))
				message.success('更新成功')
			} else {
				setGroups(prev => [payload, ...prev])
				message.success('创建成功')
			}
			setGroupModalOpen(false)
		} catch {}
	}

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="text-lg font-semibold">分成策略管理</div>
			<Row gutter={16}>
				<Col span={12}>
					<Card title="分成规则配置" extra={<Space><Button onClick={() => { localStorage.setItem(STORAGE_RULES_KEY, JSON.stringify(defaultRules())); setRules(loadRules()); message.success('已填充示例规则'); }}>填充示例数据</Button><Button type="primary" onClick={handleCreateRule}>新增规则</Button></Space>}>
						<Table
							rowKey="id"
							dataSource={rules}
							pagination={{ pageSize: 5 }}
							columns={[
								{ title: '规则名称', dataIndex: 'name' },
								{ title: '规则类型', dataIndex: 'type', render: (v: RuleType) => <Tag color="blue">{v}</Tag> },
								{ title: '计算方式', dataIndex: 'calcMethod', render: (v: CalcMethod) => <Tag color={v === '固定金额' ? 'green' : 'purple'}>{v}</Tag> },
								{ title: '数值', dataIndex: 'value', render: (_: any, r: CommissionRule) => r.calcMethod === '固定金额' ? `${r.value} 元` : `${r.value}%` },
								{ title: '创建时间', dataIndex: 'createdAt' },
								{
									title: '操作',
									render: (_: any, r: CommissionRule) => (
										<Space>
											<Button size="small" onClick={() => handleEditRule(r)}>编辑</Button>
											<Popconfirm title="确定删除该规则？" onConfirm={() => handleDeleteRule(r)}>
												<Button size="small" danger disabled={referencedRuleIds.has(r.id)}>删除</Button>
											</Popconfirm>
										</Space>
									),
								},
							]}
						/>
					</Card>
				</Col>
				<Col span={12}>
					<Card title="分成策略组" extra={<Space><Button onClick={() => { localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(defaultGroups())); setGroups(loadGroups()); message.success('已填充示例策略组'); }}>填充示例数据</Button><Button type="primary" onClick={handleCreateGroup}>新增策略组</Button></Space>}>
						<Table
							rowKey="id"
							dataSource={groups}
							pagination={{ pageSize: 5 }}
							columns={[
								{ title: '策略组名称', dataIndex: 'name' },
								{ title: '购车分成规则', dataIndex: 'purchaseRuleId', render: (id?: string) => rules.find(r => r.id === id)?.name || '-' },
								{ title: '线索分成规则', dataIndex: 'leadRuleId', render: (id?: string) => rules.find(r => r.id === id)?.name || '-' },
								{ title: '团队管理规则', dataIndex: 'teamRuleId', render: (id?: string) => rules.find(r => r.id === id)?.name || '-' },
								{ title: '创建时间', dataIndex: 'createdAt' },
								{
									title: '操作',
									render: (_: any, r: StrategyGroup) => (
										<Space>
											<Button size="small" onClick={() => handleEditGroup(r)}>编辑</Button>
											<Popconfirm title="确定删除该策略组？" onConfirm={() => handleDeleteGroup(r)}>
												<Button size="small" danger>删除</Button>
											</Popconfirm>
										</Space>
									),
								},
							]}
						/>
					</Card>
				</Col>
			</Row>

			<Modal
				open={ruleModalOpen}
				title={editingRule ? '编辑规则' : '新增规则'}
				onCancel={() => setRuleModalOpen(false)}
				onOk={submitRule}
				okText="保存"
			>
				<Form form={ruleForm} layout="vertical" initialValues={{ calcMethod: '固定金额' as CalcMethod }}>
					<Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
						<Input maxLength={20} placeholder="如：高级购车分成" />
					</Form.Item>
					<Form.Item name="type" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
						<Select
							options={[
								{ value: '购车分成', label: '购车分成' },
								{ value: '线索分成', label: '线索分成' },
								{ value: '团队管理奖', label: '团队管理奖' },
							]}
						/>
					</Form.Item>
					<Form.Item name="calcMethod" label="计算方式" rules={[{ required: true, message: '请选择计算方式' }]}>
						<Radio.Group>
							<Radio value={'固定金额' as CalcMethod}>固定金额</Radio>
							<Radio value={'结算补贴百分比' as CalcMethod}>结算补贴百分比</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item name="value" label="数值" rules={[{ required: true, message: '请输入数值' }]}>
						<InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="固定金额为元，百分比为%" />
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				open={groupModalOpen}
				title={editingGroup ? '编辑策略组' : '新增策略组'}
				onCancel={() => setGroupModalOpen(false)}
				onOk={submitGroup}
				okText="保存"
			>
				<Form form={groupForm} layout="vertical">
					<Form.Item name="name" label="策略组名称" rules={[{ required: true, message: '请输入策略组名称' }]}>
						<Input maxLength={30} placeholder="如：个人推客默认组" />
					</Form.Item>
					<Form.Item name="purchaseRuleId" label="购车分成规则">
						<Select allowClear placeholder="选择一条规则" options={purchaseRules.map(r => ({ value: r.id, label: `${r.name}（${r.calcMethod === '固定金额' ? r.value + '元' : r.value + '%'}）` }))} />
					</Form.Item>
					<Form.Item name="leadRuleId" label="线索分成规则">
						<Select allowClear placeholder="选择一条规则" options={leadRules.map(r => ({ value: r.id, label: `${r.name}（${r.calcMethod === '固定金额' ? r.value + '元' : r.value + '%'}）` }))} />
					</Form.Item>
					<Form.Item name="teamRuleId" label="团队管理规则">
						<Select allowClear placeholder="选择一条规则" options={teamRules.map(r => ({ value: r.id, label: `${r.name}（${r.calcMethod === '固定金额' ? r.value + '元' : r.value + '%'}）` }))} />
					</Form.Item>
					<div className="text-black/45">至少选择一个分成规则；若三项均为空，则无法保存。</div>
				</Form>
			</Modal>
		</div>
	)
}


