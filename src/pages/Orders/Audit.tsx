import React, { useState, useEffect } from 'react'
import {
	Table,
	Button,
	Space,
	Tag,
	Input,
	Select,
	DatePicker,
	message,
	Popconfirm,
	Tabs,
	Badge,
	Modal,
	Form,
	Row,
	Col,
	Image,
	Card,
	Divider,
	Typography,
} from 'antd'
import {
	SearchOutlined,
	CheckOutlined,
	CloseOutlined,
	EyeOutlined,
	RotateLeftOutlined,
	RotateRightOutlined,
	ZoomInOutlined,
	ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker
const { Title, Text } = Typography

// Extension Review Interface
interface ExtensionReviewRecord {
	id: string
	orderNo: string
	userName: string
	userPhone: string
	vehicleModel: string
	applyTime: string
	status: 'pending' | 'approved' | 'rejected'
	auditTime?: string
	auditor?: string
	rejectReason?: string
}

// Purchase Certificate Review Interface
interface PurchaseCertificateRecord {
	id: string
	orderNo: string
	userName: string
	userPhone: string
	vehicleModel: string
	subsidyContent: string
	applyTime: string
	status: 'pending' | 'approved' | 'rejected'
	auditTime?: string
	auditor?: string
	rejectReason?: string
}

// Mock data for extension review
const mockExtensionData: ExtensionReviewRecord[] = [
	{
		id: 'EXT001',
		orderNo: 'ORD202401001',
		userName: '张三',
		userPhone: '138****8888',
		vehicleModel: 'A6L 豪华型',
		applyTime: '2024-01-15 10:30:00',
		status: 'pending',
	},
	{
		id: 'EXT002',
		orderNo: 'ORD202401002',
		userName: '李四',
		userPhone: '139****9999',
		vehicleModel: '宝马5系 领先型',
		applyTime: '2024-01-14 14:20:00',
		status: 'pending',
	},
	{
		id: 'EXT003',
		orderNo: 'ORD202401003',
		userName: '王五',
		userPhone: '137****7777',
		vehicleModel: '奔驰E级 豪华型',
		applyTime: '2024-01-13 16:45:00',
		status: 'pending',
	},
]

// Mock data for purchase certificate review
const mockPurchaseData: PurchaseCertificateRecord[] = [
	{
		id: 'PUR001',
		orderNo: 'ORD202401004',
		userName: '赵六',
		userPhone: '136****6666',
		vehicleModel: '丰田凯美瑞 豪华版',
		subsidyContent: '现金补贴2000元',
		applyTime: '2024-01-12 09:15:00',
		status: 'pending',
	},
	{
		id: 'PUR002',
		orderNo: 'ORD202401005',
		userName: '钱七',
		userPhone: '135****5555',
		vehicleModel: '本田雅阁 锐尊版',
		subsidyContent: '三者险补贴3000元',
		applyTime: '2024-01-11 11:30:00',
		status: 'pending',
	},
]

// Mock certificate images
const mockCertificates = {
	extension: [
		'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=定车凭证',
		'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=延期申请',
	],
	purchase: [
		'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=购车发票',
		'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=保险凭证',
		'https://via.placeholder.com/300x200/607D8B/FFFFFF?text=车辆登记证',
	],
}

export const OrdersAudit = () => {
	const [activeTab, setActiveTab] = useState('extension')
	const [extensionData, setExtensionData] = useState<ExtensionReviewRecord[]>(mockExtensionData)
	const [purchaseData, setPurchaseData] = useState<PurchaseCertificateRecord[]>(mockPurchaseData)
	const [filteredExtensionData, setFilteredExtensionData] = useState<ExtensionReviewRecord[]>(mockExtensionData)
	const [filteredPurchaseData, setFilteredPurchaseData] = useState<PurchaseCertificateRecord[]>(mockPurchaseData)
	
	// Search and filter states
	const [searchValue, setSearchValue] = useState('')
	const [dateRange, setDateRange] = useState<[string, string] | null>(null)
	
	// Modal states
	const [auditModalVisible, setAuditModalVisible] = useState(false)
	const [currentRecord, setCurrentRecord] = useState<ExtensionReviewRecord | PurchaseCertificateRecord | null>(null)
	const [rejectModalVisible, setRejectModalVisible] = useState(false)
	const [rejectForm] = Form.useForm()

	// Calculate pending counts for badges
	const pendingExtensionCount = extensionData.filter(item => item.status === 'pending').length
	const pendingPurchaseCount = purchaseData.filter(item => item.status === 'pending').length

	// Handle search and filtering
	const handleSearch = () => {
		let filteredExtension = [...extensionData]
		let filteredPurchase = [...purchaseData]

		// Filter by search value
		if (searchValue.trim()) {
			filteredExtension = filteredExtension.filter(
				(item) =>
					item.orderNo.toLowerCase().includes(searchValue.toLowerCase()) ||
					item.userName.includes(searchValue) ||
					item.userPhone.includes(searchValue)
			)
			filteredPurchase = filteredPurchase.filter(
				(item) =>
					item.orderNo.toLowerCase().includes(searchValue.toLowerCase()) ||
					item.userName.includes(searchValue) ||
					item.userPhone.includes(searchValue)
			)
		}

		// Filter by date range
		if (dateRange && dateRange[0] && dateRange[1]) {
			filteredExtension = filteredExtension.filter((item) => {
				const applyDate = new Date(item.applyTime)
				const startDate = new Date(dateRange[0])
				const endDate = new Date(dateRange[1])
				return applyDate >= startDate && applyDate <= endDate
			})
			filteredPurchase = filteredPurchase.filter((item) => {
				const applyDate = new Date(item.applyTime)
				const startDate = new Date(dateRange[0])
				const endDate = new Date(dateRange[1])
				return applyDate >= startDate && applyDate <= endDate
			})
		}

		setFilteredExtensionData(filteredExtension)
		setFilteredPurchaseData(filteredPurchase)
	}

	const handleReset = () => {
		setSearchValue('')
		setDateRange(null)
		setFilteredExtensionData(extensionData)
		setFilteredPurchaseData(purchaseData)
	}

	// Handle audit actions
	const handleAudit = (record: ExtensionReviewRecord | PurchaseCertificateRecord) => {
		setCurrentRecord(record)
		setAuditModalVisible(true)
	}

	const handleApprove = () => {
		if (!currentRecord) return

		const now = new Date().toLocaleString()
		const currentUser = '当前用户'

		if (activeTab === 'extension') {
			// Handle extension approval
			const updatedData = extensionData.map((item) =>
				item.id === currentRecord.id
					? {
							...item,
							status: 'approved' as const,
							auditTime: now,
							auditor: currentUser,
						}
					: item
			)
			setExtensionData(updatedData)
			message.success('延期申请审核通过，凭证有效期已延长至90天')
		} else {
			// Handle purchase certificate approval
			const updatedData = purchaseData.map((item) =>
				item.id === currentRecord.id
					? {
							...item,
							status: 'approved' as const,
							auditTime: now,
							auditor: currentUser,
						}
					: item
			)
			setPurchaseData(updatedData)
			message.success('购车凭证审核通过，订单状态已更新为"审核通过（待打款）"')
		}

		setAuditModalVisible(false)
		setCurrentRecord(null)
		handleSearch() // Refresh filtered data
	}

	const handleReject = () => {
		setRejectModalVisible(true)
	}

	const handleRejectSubmit = async () => {
		try {
			const values = await rejectForm.validateFields()
			
			if (!currentRecord) return

			const now = new Date().toLocaleString()
			const currentUser = '当前用户'

			if (activeTab === 'extension') {
				// Handle extension rejection
				const updatedData = extensionData.map((item) =>
					item.id === currentRecord.id
						? {
								...item,
								status: 'rejected' as const,
								auditTime: now,
								auditor: currentUser,
								rejectReason: values.rejectReason,
							}
						: item
				)
				setExtensionData(updatedData)
				message.success('延期申请已驳回，订单状态已更新为"待购车"')
			} else {
				// Handle purchase certificate rejection
				const updatedData = purchaseData.map((item) =>
					item.id === currentRecord.id
						? {
								...item,
								status: 'rejected' as const,
								auditTime: now,
								auditor: currentUser,
								rejectReason: values.rejectReason,
							}
						: item
				)
				setPurchaseData(updatedData)
				message.success('购车凭证已驳回，订单状态已更新为"审核驳回"')
			}

			setRejectModalVisible(false)
			setAuditModalVisible(false)
			setCurrentRecord(null)
			rejectForm.resetFields()
			handleSearch() // Refresh filtered data
		} catch (error) {
			// Form validation failed
		}
	}

	// Extension review columns
	const extensionColumns: ColumnsType<ExtensionReviewRecord> = [
		{
			title: '申请ID',
			dataIndex: 'id',
			key: 'id',
			width: 120,
		},
		{
			title: '订单号',
			dataIndex: 'orderNo',
			key: 'orderNo',
			width: 150,
		},
		{
			title: '用户信息',
			key: 'userInfo',
			width: 150,
			render: (_, record) => (
				<div>
					<div>{record.userName}</div>
					<div className="text-gray-500 text-sm">{record.userPhone}</div>
				</div>
			),
		},
		{
			title: '车型',
			dataIndex: 'vehicleModel',
			key: 'vehicleModel',
			width: 150,
		},
		{
			title: '申请时间',
			dataIndex: 'applyTime',
			key: 'applyTime',
			width: 160,
		},
		{
			title: '操作',
			key: 'action',
			width: 100,
			render: (_, record) => (
				<Button type="primary" onClick={() => handleAudit(record)}>
					去审核
				</Button>
			),
		},
	]

	// Purchase certificate columns
	const purchaseColumns: ColumnsType<PurchaseCertificateRecord> = [
		{
			title: '申请ID',
			dataIndex: 'id',
			key: 'id',
			width: 120,
		},
		{
			title: '订单号',
			dataIndex: 'orderNo',
			key: 'orderNo',
			width: 150,
		},
		{
			title: '用户信息',
			key: 'userInfo',
			width: 150,
			render: (_, record) => (
				<div>
					<div>{record.userName}</div>
					<div className="text-gray-500 text-sm">{record.userPhone}</div>
				</div>
			),
		},
		{
			title: '车型',
			dataIndex: 'vehicleModel',
			key: 'vehicleModel',
			width: 150,
		},
		{
			title: '补贴内容',
			dataIndex: 'subsidyContent',
			key: 'subsidyContent',
			width: 150,
		},
		{
			title: '申请时间',
			dataIndex: 'applyTime',
			key: 'applyTime',
			width: 160,
		},
		{
			title: '操作',
			key: 'action',
			width: 100,
			render: (_, record) => (
				<Button type="primary" onClick={() => handleAudit(record)}>
					去审核
				</Button>
			),
		},
	]

	// Tab items with badges
	const tabItems = [
		{
			key: 'extension',
			label: (
				<Badge count={pendingExtensionCount} size="small">
					<span>定车延期审核</span>
				</Badge>
			),
			children: (
				<Table
					columns={extensionColumns}
					dataSource={filteredExtensionData}
					rowKey="id"
					pagination={{
						total: filteredExtensionData.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `共 ${total} 条记录`,
					}}
				/>
			),
		},
		{
			key: 'purchase',
			label: (
				<Badge count={pendingPurchaseCount} size="small">
					<span>购车凭证审核</span>
				</Badge>
			),
			children: (
				<Table
					columns={purchaseColumns}
					dataSource={filteredPurchaseData}
					rowKey="id"
					pagination={{
						total: filteredPurchaseData.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `共 ${total} 条记录`,
					}}
				/>
			),
		},
	]

	return (
		<div className="p-6 space-y-6">
			{/* Search Area */}
			<Card title="通用查询区" className="shadow-sm">
				<div className="flex items-center gap-4 flex-wrap">
					<div className="flex items-center gap-2">
						<span className="text-gray-600">搜索：</span>
						<Search
							placeholder="订单号/用户信息"
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							style={{ width: 250 }}
							allowClear
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-600">申请时间：</span>
						<RangePicker
							onChange={(dates) => {
								if (dates) {
									setDateRange([
										dates[0]?.format('YYYY-MM-DD') || '',
										dates[1]?.format('YYYY-MM-DD') || '',
									])
								} else {
									setDateRange(null)
								}
							}}
						/>
					</div>
					<Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
						查询
					</Button>
					<Button icon={<ReloadOutlined />} onClick={handleReset}>
						重置
					</Button>
				</div>
			</Card>

			{/* Tabs and Task List */}
			<Card title="任务列表区" className="shadow-sm">
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={tabItems}
					className="audit-tabs"
				/>
			</Card>

			{/* Audit Detail Modal */}
			<Modal
				title={`审核详情 - ${currentRecord?.orderNo}`}
				open={auditModalVisible}
				onCancel={() => {
					setAuditModalVisible(false)
					setCurrentRecord(null)
				}}
				footer={null}
				width={1000}
				destroyOnClose
			>
				{currentRecord && (
					<Row gutter={24}>
						{/* Left side - Order information */}
						<Col span={12}>
							<Card title="订单核心信息" size="small">
								<div className="space-y-3">
									<div>
										<Text strong>申请ID：</Text>
										<Text>{currentRecord.id}</Text>
									</div>
									<div>
										<Text strong>订单号：</Text>
										<Text>{currentRecord.orderNo}</Text>
									</div>
									<div>
										<Text strong>用户姓名：</Text>
										<Text>{currentRecord.userName}</Text>
									</div>
									<div>
										<Text strong>联系电话：</Text>
										<Text>{currentRecord.userPhone}</Text>
									</div>
									<div>
										<Text strong>车型：</Text>
										<Text>{currentRecord.vehicleModel}</Text>
									</div>
									{activeTab === 'purchase' && (
										<div>
											<Text strong>补贴内容：</Text>
											<Text>{(currentRecord as PurchaseCertificateRecord).subsidyContent}</Text>
										</div>
									)}
									<div>   
										<Text strong>申请时间：</Text>
										<Text>{currentRecord.applyTime}</Text>
									</div>
								</div>
							</Card>
						</Col>

						{/* Right side - Certificate images */}
						<Col span={12}>
							<Card title="用户上传凭证" size="small">
								<Image.PreviewGroup>
									<div className="space-y-3">
										{(activeTab === 'extension' ? mockCertificates.extension : mockCertificates.purchase).map((image, index) => (
											<div key={index} className="border rounded p-2">
												<Image
													src={image}
													alt={`凭证${index + 1}`}
													width="100%"
													height={140}
													style={{ objectFit: 'cover', borderRadius: 4 }}
													fallback="/vite.svg"
													placeholder={<div style={{ height: 140, background: '#f5f5f5' }} />}
													preview={{
														toolbarRender: (_, { transform, actions }) => [
															<RotateLeftOutlined key="rotateLeft" onClick={() => actions.onRotateLeft()} />,
															<RotateRightOutlined key="rotateRight" onClick={() => actions.onRotateRight()} />,
															<ZoomInOutlined key="zoomIn" onClick={() => actions.onZoomIn()} />,
														],
													}}
												/>
											</div>
										))}
									</div>
								</Image.PreviewGroup>
							</Card>
						</Col>
					</Row>
				)}

				<Divider />

				{/* Audit actions */}
				<div className="flex justify-center gap-4">
					<Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
						审核通过
					</Button>
					<Button danger icon={<CloseOutlined />} onClick={handleReject}>
						审核驳回
					</Button>
				</div>
			</Modal>

			{/* Reject reason modal */}
			<Modal
				title="填写驳回原因"
				open={rejectModalVisible}
				onOk={handleRejectSubmit}
				onCancel={() => {
					setRejectModalVisible(false)
					rejectForm.resetFields()
				}}
				okText="确认驳回"
				cancelText="取消"
			>
				<Form form={rejectForm} layout="vertical">
					<Form.Item
						name="rejectReason"
						label="驳回原因"
						rules={[{ required: true, message: '请填写驳回原因' }]}
					>
						<Select placeholder="请选择驳回原因">
							<Option value="凭证不清晰">凭证不清晰</Option>
							<Option value="信息不完整">信息不完整</Option>
							<Option value="不符合补贴条件">不符合补贴条件</Option>
							<Option value="其他">其他</Option>
						</Select>
					</Form.Item>
					<Form.Item
						name="customReason"
						label="自定义原因"
						hidden={rejectForm.getFieldValue('rejectReason') !== '其他'}
					>
						<Input.TextArea rows={3} placeholder="请输入具体的驳回原因" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}
