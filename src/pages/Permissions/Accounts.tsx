import React, { useState } from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, Modal, Form, message, Switch, Avatar } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, KeyOutlined, UserOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

const { Search } = Input
const { Option } = Select
const { confirm } = Modal

interface AccountData {
	key: string
	id: string
	username: string
	realName: string
	roles: string[]
	lastLoginTime: string
	lastLoginIp: string
	status: 'active' | 'inactive'
}

const Accounts: React.FC = () => {
	const [isModalVisible, setIsModalVisible] = useState(false)
	const [editingAccount, setEditingAccount] = useState<AccountData | null>(null)
	const [form] = Form.useForm()

	// 角色选项数据
	const roleOptions = [
		{ label: '超级管理员', value: '超级管理员' },
		{ label: '订单运营', value: '订单运营' },
		{ label: '财务专员', value: '财务专员' },
		{ label: '运营专员', value: '运营专员' },
	]

	const columns = [
		{
			title: '用户ID',
			dataIndex: 'id',
			key: 'id',
			width: 120,
		},
		{
			title: '登录账号',
			dataIndex: 'username',
			key: 'username',
			width: 150,
			render: (username: string) => (
				<Space>
					<Avatar icon={<UserOutlined />} size="small" />
					<span>{username}</span>
				</Space>
			),
		},
		{
			title: '姓名',
			dataIndex: 'realName',
			key: 'realName',
			width: 120,
		},
		{
			title: '所属角色',
			dataIndex: 'roles',
			key: 'roles',
			width: 200,
			render: (roles: string[]) => (
				<>
					{roles.map(role => (
						<Tag key={role} color="blue">{role}</Tag>
					))}
				</>
			),
		},
		{
			title: '最后登录时间/IP',
			key: 'lastLogin',
			width: 200,
			render: (_: any, record: AccountData) => (
				<div>
					<div>{record.lastLoginTime}</div>
					<div style={{ fontSize: '12px', color: '#999' }}>{record.lastLoginIp}</div>
				</div>
			),
		},
		{
			title: '状态',
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status: string, record: AccountData) => (
				<Switch
					checked={status === 'active'}
					onChange={(checked) => handleStatusChange(record, checked)}
					checkedChildren="启用"
					unCheckedChildren="禁用"
				/>
			),
		},
		{
			title: '操作',
			key: 'action',
			width: 200,
			render: (_: any, record: AccountData) => (
				<Space size="middle">
					<Button 
						type="link" 
						icon={<EditOutlined />}
						onClick={() => handleEditAccount(record)}
					>
						编辑
					</Button>
					<Button 
						type="link" 
						icon={<KeyOutlined />}
						onClick={() => handleResetPassword(record)}
					>
						重置密码
					</Button>
				</Space>
			),
		},
	]

	const data: AccountData[] = [
		{
			key: '1',
			id: 'USER_001',
			username: 'admin',
			realName: '张三',
			roles: ['超级管理员'],
			lastLoginTime: '2024-01-15 10:30:00',
			lastLoginIp: '192.168.1.100',
			status: 'active',
		},
		{
			key: '2',
			id: 'USER_002',
			username: 'operator1',
			realName: '李四',
			roles: ['订单运营'],
			lastLoginTime: '2024-01-14 15:20:00',
			lastLoginIp: '192.168.1.101',
			status: 'active',
		},
		{
			key: '3',
			id: 'USER_003',
			username: 'operator2',
			realName: '王五',
			roles: ['订单运营'],
			lastLoginTime: '2024-01-14 09:15:00',
			lastLoginIp: '192.168.1.102',
			status: 'active',
		},
		{
			key: '4',
			id: 'USER_004',
			username: 'finance1',
			realName: '赵六',
			roles: ['财务专员'],
			lastLoginTime: '2024-01-13 16:45:00',
			lastLoginIp: '192.168.1.103',
			status: 'active',
		},
		{
			key: '5',
			id: 'USER_005',
			username: 'finance2',
			realName: '钱七',
			roles: ['财务专员'],
			lastLoginTime: '2024-01-12 11:30:00',
			lastLoginIp: '192.168.1.104',
			status: 'inactive',
		},
		{
			key: '6',
			id: 'USER_006',
			username: 'operations',
			realName: '孙八',
			roles: ['运营专员'],
			lastLoginTime: '2024-01-10 14:20:00',
			lastLoginIp: '192.168.1.105',
			status: 'active',
		},
	]

	const handleAddAccount = () => {
		setEditingAccount(null)
		form.resetFields()
		setIsModalVisible(true)
	}

	const handleEditAccount = (account: AccountData) => {
		setEditingAccount(account)
		form.setFieldsValue({
			username: account.username,
			realName: account.realName,
			roles: account.roles,
		})
		setIsModalVisible(true)
	}

	const handleStatusChange = (account: AccountData, checked: boolean) => {
		const newStatus = checked ? 'active' : 'inactive'
		const action = checked ? '启用' : '禁用'
		
		confirm({
			title: '确认操作',
			icon: <ExclamationCircleOutlined />,
			content: `确定要${action}账号"${account.username}"吗？`,
			onOk() {
				message.success(`${action}成功`)
				// 这里应该调用API更新账号状态
			},
		})
	}

	const handleResetPassword = (account: AccountData) => {
		confirm({
			title: '确认重置密码',
			icon: <ExclamationCircleOutlined />,
			content: `确定要为账号"${account.username}"重置密码吗？重置后将生成随机密码。`,
			onOk() {
				// 生成随机密码
				const randomPassword = Math.random().toString(36).slice(-8)
				message.success(`密码重置成功，新密码：${randomPassword}`)
				// 这里应该调用API重置密码
			},
		})
	}

	const handleModalOk = () => {
		form.validateFields().then((values) => {
			if (editingAccount) {
				message.success('编辑成功')
			} else {
				message.success('新增成功')
			}
			setIsModalVisible(false)
			form.resetFields()
			// 这里应该调用API保存账号
		})
	}

	const handleModalCancel = () => {
		setIsModalVisible(false)
		form.resetFields()
	}

	return (
		<div>
			<Card title="账号管理" extra={
				<Button type="primary" icon={<PlusOutlined />} onClick={handleAddAccount}>
					新增账号
				</Button>
			}>
				{/* 查询区域 */}
				<div style={{ marginBottom: 16, padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
					<Space wrap>
						<Search
							placeholder="搜索账号"
							allowClear
							enterButton={<SearchOutlined />}
							style={{ width: 200 }}
						/>
						<Search
							placeholder="搜索姓名"
							allowClear
							enterButton={<SearchOutlined />}
							style={{ width: 200 }}
						/>
						<Select placeholder="所属角色" style={{ width: 150 }} allowClear>
							{roleOptions.map(role => (
								<Option key={role.value} value={role.value}>{role.label}</Option>
							))}
						</Select>
						<Select placeholder="状态" style={{ width: 120 }} allowClear>
							<Option value="active">启用</Option>
							<Option value="inactive">禁用</Option>
						</Select>
						<Button type="primary" icon={<SearchOutlined />}>
							查询
						</Button>
						<Button>
							重置
						</Button>
					</Space>
				</div>

				<Table 
					columns={columns} 
					dataSource={data}
					scroll={{ x: 1200 }}
				/>
			</Card>

			<Modal
				title={editingAccount ? '编辑账号' : '新增账号'}
				open={isModalVisible}
				onOk={handleModalOk}
				onCancel={handleModalCancel}
				width={500}
				destroyOnClose
			>
				<Form
					form={form}
					layout="vertical"
					initialValues={{ roles: [] }}
				>
					<Form.Item
						name="username"
						label="登录账号"
						rules={[
							{ required: true, message: '请输入登录账号' },
							{ pattern: /^[a-zA-Z0-9_]{4,20}$/, message: '账号只能包含字母、数字、下划线，长度4-20位' }
						]}
					>
						<Input 
							placeholder="请输入登录账号" 
							disabled={!!editingAccount} // 编辑时不允许修改账号
						/>
					</Form.Item>
					<Form.Item
						name="realName"
						label="姓名"
						rules={[{ required: true, message: '请输入姓名' }]}
					>
						<Input placeholder="请输入姓名" />
					</Form.Item>
					{!editingAccount && (
						<Form.Item
							name="password"
							label="初始密码"
							rules={[
								{ required: true, message: '请输入初始密码' },
								{ min: 6, message: '密码长度不能少于6位' }
							]}
						>
							<Input.Password placeholder="请输入初始密码" />
						</Form.Item>
					)}
					<Form.Item
						name="roles"
						label="所属角色"
						rules={[{ required: true, message: '请选择所属角色' }]}
					>
						<Select
							mode="multiple"
							placeholder="请选择所属角色"
							options={roleOptions}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}

export default Accounts
