import React, { useState } from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, Modal, Form, Tree, message } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Search } = Input
const { Option } = Select
const { confirm } = Modal

interface RoleData {
	key: string
	id: string
	name: string
	description: string
	accountCount: number
	createdAt: string
	permissions: string[]
}

const Roles: React.FC = () => {
	const [isModalVisible, setIsModalVisible] = useState(false)
	const [editingRole, setEditingRole] = useState<RoleData | null>(null)
	const [form] = Form.useForm()

	// 权限树数据
	const permissionTreeData = [
		{
			title: '车型管理',
			key: 'vehicle',
			children: [
				{
					title: '品牌管理',
					key: 'vehicle-brand',
					children: [
						{ title: '查看列表', key: 'vehicle-brand-list' },
						{ title: '新增品牌', key: 'vehicle-brand-create' },
						{ title: '编辑品牌', key: 'vehicle-brand-edit' },
						{ title: '删除品牌', key: 'vehicle-brand-delete' },
					]
				},
				{
					title: '车型管理',
					key: 'vehicle-model',
					children: [
						{ title: '查看列表', key: 'vehicle-model-list' },
						{ title: '新增车型', key: 'vehicle-model-create' },
						{ title: '编辑车型', key: 'vehicle-model-edit' },
						{ title: '删除车型', key: 'vehicle-model-delete' },
					]
				}
			]
		},
		{
			title: 'SKU管理',
			key: 'sku',
			children: [
				{ title: '查看列表', key: 'sku-list' },
				{ title: '新增SKU', key: 'sku-create' },
				{ title: '编辑SKU', key: 'sku-edit' },
				{ title: '删除SKU', key: 'sku-delete' },
				{ title: '上下架', key: 'sku-toggle' },
			]
		},
		{
			title: '订单管理',
			key: 'orders',
			children: [
				{
					title: '订单列表',
					key: 'orders-list',
					children: [
						{ title: '查看列表', key: 'orders-list-view' },
						{ title: '查看详情', key: 'orders-list-detail' },
						{ title: '导出订单', key: 'orders-list-export' },
					]
				},
				{
					title: '审核管理',
					key: 'orders-audit',
					children: [
						{ title: '查看列表', key: 'orders-audit-view' },
						{ title: '审核通过', key: 'orders-audit-approve' },
						{ title: '审核拒绝', key: 'orders-audit-reject' },
					]
				}
			]
		},
		{
			title: '供应商管理',
			key: 'suppliers',
			children: [
				{ title: '查看列表', key: 'suppliers-list' },
				{ title: '新增供应商', key: 'suppliers-create' },
				{ title: '编辑供应商', key: 'suppliers-edit' },
				{ title: '删除供应商', key: 'suppliers-delete' },
			]
		},
		{
			title: '用户管理',
			key: 'users',
			children: [
				{ title: '查看列表', key: 'users-list' },
				{ title: '查看详情', key: 'users-detail' },
				{ title: '编辑用户', key: 'users-edit' },
			]
		},
		{
			title: '推客管理',
			key: 'promoters',
			children: [
				{ title: '查看列表', key: 'promoters-list' },
				{ title: '查看详情', key: 'promoters-detail' },
				{ title: '编辑推客', key: 'promoters-edit' },
				{ title: '分成策略管理', key: 'promoters-commission' },
				{ title: '合作方管理', key: 'promoters-partners' },
				{ title: '财务结算', key: 'promoters-settlement' },
			]
		},
		{
			title: '运营管理',
			key: 'operations',
			children: [
				{ title: 'Banner管理', key: 'operations-banner' },
				{ title: '消息推送', key: 'operations-push' },
				{ title: '素材管理', key: 'operations-assets' },
				{ title: '标签管理', key: 'operations-tags' },
				{ title: '文案管理', key: 'operations-copywriting' },
				{ title: '意见反馈', key: 'operations-feedback' },
			]
		},
		{
			title: '财务中心',
			key: 'finance',
			children: [
				{ title: '财务概览', key: 'finance-overview' },
				{ title: '供应商结算管理', key: 'finance-suppliers' },
				{ title: '付款管理', key: 'finance-payments' },
			]
		},
		{
			title: '权限管理',
			key: 'permissions',
			children: [
				{ title: '角色管理', key: 'permissions-roles' },
				{ title: '账号管理', key: 'permissions-accounts' },
			]
		}
	]

	const columns = [
		{
			title: '角色ID',
			dataIndex: 'id',
			key: 'id',
			width: 120,
		},
		{
			title: '角色名称',
			dataIndex: 'name',
			key: 'name',
			width: 150,
		},
		{
			title: '描述',
			dataIndex: 'description',
			key: 'description',
			ellipsis: true,
		},
		{
			title: '关联账号数',
			dataIndex: 'accountCount',
			key: 'accountCount',
			width: 120,
			render: (count: number) => (
				<Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
			),
		},
		{
			title: '创建时间',
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 180,
		},
		{
			title: '操作',
			key: 'action',
			width: 150,
			render: (_: any, record: RoleData) => (
				<Space size="middle">
					<Button 
						type="link" 
						icon={<EditOutlined />}
						onClick={() => handleEditRole(record)}
					>
						编辑权限
					</Button>
					<Button 
						type="link" 
						danger 
						icon={<DeleteOutlined />}
						disabled={record.accountCount > 0}
						onClick={() => handleDeleteRole(record)}
					>
						删除
					</Button>
				</Space>
			),
		},
	]

	const data: RoleData[] = [
		{
			key: '1',
			id: 'ROLE_001',
			name: '超级管理员',
			description: '拥有所有权限，可以管理整个系统',
			accountCount: 1,
			createdAt: '2024-01-01 10:00:00',
			permissions: ['vehicle', 'sku', 'orders', 'suppliers', 'users', 'promoters', 'operations', 'finance', 'permissions'],
		},
		{
			key: '2',
			id: 'ROLE_002',
			name: '订单运营',
			description: '负责订单相关业务的管理和运营',
			accountCount: 3,
			createdAt: '2024-01-02 14:30:00',
			permissions: ['orders', 'users'],
		},
		{
			key: '3',
			id: 'ROLE_003',
			name: '财务专员',
			description: '负责财务相关业务的管理',
			accountCount: 2,
			createdAt: '2024-01-03 09:15:00',
			permissions: ['finance', 'orders-audit'],
		},
		{
			key: '4',
			id: 'ROLE_004',
			name: '运营专员',
			description: '负责运营相关业务的管理',
			accountCount: 0,
			createdAt: '2024-01-04 16:45:00',
			permissions: ['operations', 'promoters'],
		},
	]

	const handleAddRole = () => {
		setEditingRole(null)
		form.resetFields()
		setIsModalVisible(true)
	}

	const handleEditRole = (role: RoleData) => {
		setEditingRole(role)
		form.setFieldsValue({
			name: role.name,
			description: role.description,
			permissions: role.permissions,
		})
		setIsModalVisible(true)
	}

	const handleDeleteRole = (role: RoleData) => {
		if (role.accountCount > 0) {
			message.warning('该角色已被账号使用，无法删除')
			return
		}

		confirm({
			title: '确认删除',
			icon: <ExclamationCircleOutlined />,
			content: `确定要删除角色"${role.name}"吗？`,
			onOk() {
				message.success('删除成功')
				// 这里应该调用API删除角色
			},
		})
	}

	const handleModalOk = () => {
		form.validateFields().then((values) => {
			if (editingRole) {
				message.success('编辑成功')
			} else {
				message.success('新增成功')
			}
			setIsModalVisible(false)
			form.resetFields()
			// 这里应该调用API保存角色
		})
	}

	const handleModalCancel = () => {
		setIsModalVisible(false)
		form.resetFields()
	}

	return (
		<div>
			<Card title="角色管理" extra={
				<Button type="primary" icon={<PlusOutlined />} onClick={handleAddRole}>
					新增角色
				</Button>
			}>
				<div style={{ marginBottom: 16 }}>
					<Space>
						<Search
							placeholder="搜索角色名称"
							allowClear
							enterButton={<SearchOutlined />}
							style={{ width: 200 }}
						/>
						<Select placeholder="状态筛选" style={{ width: 120 }} allowClear>
							<Option value="active">启用</Option>
							<Option value="inactive">禁用</Option>
						</Select>
					</Space>
				</div>
				<Table 
					columns={columns} 
					dataSource={data}
					scroll={{ x: 1000 }}
				/>
			</Card>

			<Modal
				title={editingRole ? '编辑角色' : '新增角色'}
				open={isModalVisible}
				onOk={handleModalOk}
				onCancel={handleModalCancel}
				width={600}
				destroyOnClose
			>
				<Form
					form={form}
					layout="vertical"
					initialValues={{ permissions: [] }}
				>
					<Form.Item
						name="name"
						label="角色名称"
						rules={[{ required: true, message: '请输入角色名称' }]}
					>
						<Input placeholder="请输入角色名称" />
					</Form.Item>
					<Form.Item
						name="description"
						label="角色描述"
						rules={[{ required: true, message: '请输入角色描述' }]}
					>
						<Input.TextArea 
							placeholder="请输入角色描述" 
							rows={3}
						/>
					</Form.Item>
					<Form.Item
						name="permissions"
						label="权限配置"
						rules={[{ required: true, message: '请选择权限' }]}
					>
						<Tree
							checkable
							treeData={permissionTreeData}
							height={300}
							style={{ border: '1px solid #d9d9d9', padding: '8px' }}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}

export default Roles
