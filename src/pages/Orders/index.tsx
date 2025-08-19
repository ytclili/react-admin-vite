import React, { useState, useEffect, useMemo } from 'react'
import {
	Table,
	Button,
	Space,
	Tag,
	Input,
	Select,
	DatePicker,
	Card,
	Row,
	Col,
	message,
} from 'antd'
import {
	SearchOutlined,
	ReloadOutlined,
	DownloadOutlined,
	EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface OrderRecord {
	id: string
	orderNo: string
	userName: string
	userPhone: string
	city: string
	vehicleSKU: string
	subsidyContent: string
	supplier: string
	serviceStore: string
	status: 'pending_supplier' | 'failed' | 'pending_purchase' | 'pending_extension' | 'pending_review' | 'rejected' | 'pending_payment' | 'completed' | 'expired'
	orderSource: 'self' | 'referral'
	validUntil: string
	createTime: string
}

// Mock order data
const mockOrders: OrderRecord[] = [
	{
		id: 'ORD001',
		orderNo: 'ORD202401001',
		userName: '张三',
		userPhone: '138****8888',
		city: '北京',
		vehicleSKU: 'A6L 豪华型',
		subsidyContent: '现金补贴8000元',
		supplier: '供应商A',
		serviceStore: '奥迪北京朝阳店',
		status: 'pending_supplier',
		orderSource: 'self',
		validUntil: '2024-02-15',
		createTime: '2024-01-15 10:30:00',
	},
	{
		id: 'ORD002',
		orderNo: 'ORD202401002',
		userName: '李四',
		userPhone: '139****9999',
		city: '上海',
		vehicleSKU: '宝马5系 领先型',
		subsidyContent: '三者险补贴5000元',
		supplier: '供应商B',
		serviceStore: '宝马上海浦东店',
		status: 'pending_purchase',
		orderSource: 'referral',
		validUntil: '2024-02-14',
		createTime: '2024-01-14 14:20:00',
	},
	{
		id: 'ORD003',
		orderNo: 'ORD202401003',
		userName: '王五',
		userPhone: '137****7777',
		city: '广州',
		vehicleSKU: '奔驰E级 豪华型',
		subsidyContent: '现金补贴10000元',
		supplier: '供应商C',
		serviceStore: '奔驰广州天河店',
		status: 'pending_review',
		orderSource: 'self',
		validUntil: '2024-02-13',
		createTime: '2024-01-13 16:45:00',
	},
	{
		id: 'ORD004',
		orderNo: 'ORD202401004',
		userName: '赵六',
		userPhone: '136****6666',
		city: '深圳',
		vehicleSKU: '丰田凯美瑞 豪华版',
		subsidyContent: '现金补贴2000元',
		supplier: '供应商D',
		serviceStore: '丰田深圳南山店',
		status: 'pending_payment',
		orderSource: 'referral',
		validUntil: '2024-02-12',
		createTime: '2024-01-12 09:15:00',
	},
	{
		id: 'ORD005',
		orderNo: 'ORD202401005',
		userName: '钱七',
		userPhone: '135****5555',
		city: '杭州',
		vehicleSKU: '本田雅阁 锐尊版',
		subsidyContent: '三者险补贴3000元',
		supplier: '供应商E',
		serviceStore: '本田杭州西湖店',
		status: 'completed',
		orderSource: 'self',
		validUntil: '2024-02-11',
		createTime: '2024-01-11 11:30:00',
	},
]

// Mock suppliers data
const mockSuppliers = [
	{ id: 'SUP001', name: '供应商A' },
	{ id: 'SUP002', name: '供应商B' },
	{ id: 'SUP003', name: '供应商C' },
	{ id: 'SUP004', name: '供应商D' },
	{ id: 'SUP005', name: '供应商E' },
]

// Mock cities data
const mockCities = [
	'北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆'
]

// Mock service stores data
const mockServiceStores = [
	'奥迪北京朝阳店', '宝马上海浦东店', '奔驰广州天河店', '丰田深圳南山店', '本田杭州西湖店'
]

export const Orders = () => {
	const [data, setData] = useState<OrderRecord[]>(mockOrders)
	const [filteredData, setFilteredData] = useState<OrderRecord[]>(mockOrders)
	const [loading, setLoading] = useState(false)

	// Search and filter states
	const [searchValue, setSearchValue] = useState('')
	const [statusFilter, setStatusFilter] = useState<string[]>([])
	const [supplierFilter, setSupplierFilter] = useState<string[]>([])
	const [cityFilter, setCityFilter] = useState<string[]>([])
	const [storeFilter, setStoreFilter] = useState<string[]>([])
	const [dateRange, setDateRange] = useState<[string, string] | null>(null)
	const [validityRange, setValidityRange] = useState<[string, string] | null>(null)

	// Calculate statistics
	const statistics = useMemo(() => {
		const stats = {
			pendingSupplier: 0,
			pendingPurchase: 0,
			pendingPayment: 0,
		}

		data.forEach(order => {
			if (order.status === 'pending_supplier') stats.pendingSupplier++
			if (order.status === 'pending_purchase') stats.pendingPurchase++
			if (order.status === 'pending_payment') stats.pendingPayment++
		})

		return stats
	}, [data])

	// Handle search and filtering
	const handleSearch = () => {
		setLoading(true)
		
		let filtered = [...data]

		// Filter by search value (order number, user name, phone, vehicle SKU)
		if (searchValue.trim()) {
			filtered = filtered.filter(
				(item) =>
					item.orderNo.toLowerCase().includes(searchValue.toLowerCase()) ||
					item.userName.includes(searchValue) ||
					item.userPhone.includes(searchValue) ||
					item.vehicleSKU.toLowerCase().includes(searchValue.toLowerCase())
			)
		}

		// Filter by status
		if (statusFilter.length > 0) {
			filtered = filtered.filter((item) => statusFilter.includes(item.status))
		}

		// Filter by supplier
		if (supplierFilter.length > 0) {
			filtered = filtered.filter((item) => supplierFilter.includes(item.supplier))
		}

		// Filter by city
		if (cityFilter.length > 0) {
			filtered = filtered.filter((item) => cityFilter.includes(item.city))
		}

		// Filter by service store
		if (storeFilter.length > 0) {
			filtered = filtered.filter((item) => storeFilter.includes(item.serviceStore))
		}

		// Filter by create time range
		if (dateRange && dateRange[0] && dateRange[1]) {
			filtered = filtered.filter((item) => {
				const createDate = new Date(item.createTime)
				const startDate = new Date(dateRange[0])
				const endDate = new Date(dateRange[1])
				return createDate >= startDate && createDate <= endDate
			})
		}

		// Filter by validity range
		if (validityRange && validityRange[0] && validityRange[1]) {
			filtered = filtered.filter((item) => {
				const validDate = new Date(item.validUntil)
				const startDate = new Date(validityRange[0])
				const endDate = new Date(validityRange[1])
				return validDate >= startDate && validDate <= endDate
			})
		}

		// Simulate API delay
		setTimeout(() => {
			setFilteredData(filtered)
			setLoading(false)
		}, 500)
	}

	const handleReset = () => {
		setSearchValue('')
		setStatusFilter([])
		setSupplierFilter([])
		setCityFilter([])
		setStoreFilter([])
		setDateRange(null)
		setValidityRange(null)
		setFilteredData(data)
	}

	const handleExport = () => {
		message.success('导出功能开发中...')
	}

	const handleViewDetail = (record: OrderRecord) => {
		message.info(`查看订单详情: ${record.orderNo}`)
	}

	// Get status display configuration
	const getStatusConfig = (status: OrderRecord['status']) => {
		const statusConfig = {
			pending_supplier: { color: 'processing', text: '待供应商审核' },
			failed: { color: 'error', text: '领取失败' },
			pending_purchase: { color: 'warning', text: '待购车' },
			pending_extension: { color: 'processing', text: '待延期审核' },
			pending_review: { color: 'processing', text: '待购车审核' },
			rejected: { color: 'error', text: '审核驳回' },
			pending_payment: { color: 'success', text: '审核通过（待打款）' },
			completed: { color: 'success', text: '已完成' },
			expired: { color: 'default', text: '已失效' },
		}
		return statusConfig[status]
	}

	// Table columns
	const columns: ColumnsType<OrderRecord> = [
		{
			title: '订单号',
			dataIndex: 'orderNo',
			key: 'orderNo',
			width: 150,
			render: (text, record) => (
				<Button type="link" onClick={() => handleViewDetail(record)}>
					{text}
				</Button>
			),
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
			title: '城市',
			dataIndex: 'city',
			key: 'city',
			width: 100,
		},
		{
			title: '车型SKU',
			dataIndex: 'vehicleSKU',
			key: 'vehicleSKU',
			width: 150,
		},
		{
			title: '补贴内容',
			dataIndex: 'subsidyContent',
			key: 'subsidyContent',
			width: 150,
		},
		{
			title: '所属供应商',
			dataIndex: 'supplier',
			key: 'supplier',
			width: 120,
		},
		{
			title: '服务门店',
			dataIndex: 'serviceStore',
			key: 'serviceStore',
			width: 150,
		},
		{
			title: '订单状态',
			dataIndex: 'status',
			key: 'status',
			width: 140,
			render: (status: OrderRecord['status']) => {
				const config = getStatusConfig(status)
				return <Tag color={config.color}>{config.text}</Tag>
			},
		},
		{
			title: '订单来源',
			dataIndex: 'orderSource',
			key: 'orderSource',
			width: 100,
			render: (source: OrderRecord['orderSource']) => (
				<Tag color={source === 'self' ? 'blue' : 'green'}>
					{source === 'self' ? '自购' : '推客'}
				</Tag>
			),
		},
		{
			title: '凭证有效期至',
			dataIndex: 'validUntil',
			key: 'validUntil',
			width: 140,
		},
		{
			title: '创建时间',
			dataIndex: 'createTime',
			key: 'createTime',
			width: 160,
		},
		{
			title: '操作',
			key: 'action',
			width: 100,
			render: (_, record) => (
				<Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
					详情
				</Button>
			),
		},
	]

	return (
		<div className="p-6 space-y-6">
			{/* Statistics Cards */}
			<Row gutter={16}>
				<Col span={6}>
					<Card>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">{statistics.pendingSupplier}</div>
							<div className="text-gray-600">待供应商审核</div>
						</div>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">{statistics.pendingPurchase}</div>
							<div className="text-gray-600">待购车审核</div>
						</div>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">{statistics.pendingPayment}</div>
							<div className="text-gray-600">待打款</div>
						</div>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<div className="text-center">
							<div className="text-2xl font-bold text-gray-600">{filteredData.length}</div>
							<div className="text-gray-600">总订单数</div>
						</div>
					</Card>
				</Col>
			</Row>

			{/* Search Area */}
			<Card title="查询条件" className="shadow-sm">
				<div className="space-y-4">
					{/* First row */}
					<Row gutter={16}>
						<Col span={6}>
							<Search
								placeholder="订单号/用户姓名/手机号/车型SKU"
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								allowClear
							/>
						</Col>
						<Col span={6}>
							<Select
								mode="multiple"
								placeholder="订单状态"
								value={statusFilter}
								onChange={setStatusFilter}
								style={{ width: '100%' }}
								allowClear
							>
								<Option value="pending_supplier">待供应商审核</Option>
								<Option value="failed">领取失败</Option>
								<Option value="pending_purchase">待购车</Option>
								<Option value="pending_extension">待延期审核</Option>
								<Option value="pending_review">待购车审核</Option>
								<Option value="rejected">审核驳回</Option>
								<Option value="pending_payment">审核通过（待打款）</Option>
								<Option value="completed">已完成</Option>
								<Option value="expired">已失效</Option>
							</Select>
						</Col>
						<Col span={6}>
							<Select
								mode="multiple"
								placeholder="所属供应商"
								value={supplierFilter}
								onChange={setSupplierFilter}
								style={{ width: '100%' }}
								allowClear
							>
								{mockSuppliers.map(supplier => (
									<Option key={supplier.id} value={supplier.name}>{supplier.name}</Option>
								))}
							</Select>
						</Col>
						<Col span={6}>
							<Select
								mode="multiple"
								placeholder="城市"
								value={cityFilter}
								onChange={setCityFilter}
								style={{ width: '100%' }}
								allowClear
							>
								{mockCities.map(city => (
									<Option key={city} value={city}>{city}</Option>
								))}
							</Select>
						</Col>
					</Row>

					{/* Second row */}
					<Row gutter={16}>
						<Col span={6}>
							<Select
								mode="multiple"
								placeholder="服务门店"
								value={storeFilter}
								onChange={setStoreFilter}
								style={{ width: '100%' }}
								allowClear
							>
								{mockServiceStores.map(store => (
									<Option key={store} value={store}>{store}</Option>
								))}
							</Select>
						</Col>
						<Col span={6}>
							<RangePicker
								placeholder={['订单创建时间', '订单创建时间']}
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
								style={{ width: '100%' }}
							/>
						</Col>
						<Col span={6}>
							<RangePicker
								placeholder={['凭证有效期', '凭证有效期']}
								onChange={(dates) => {
									if (dates) {
										setValidityRange([
											dates[0]?.format('YYYY-MM-DD') || '',
											dates[1]?.format('YYYY-MM-DD') || '',
										])
									} else {
										setValidityRange(null)
									}
								}}
								style={{ width: '100%' }}
							/>
						</Col>
						<Col span={6}>
							<Space>
								<Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
									查询
								</Button>
								<Button icon={<ReloadOutlined />} onClick={handleReset}>
									重置
								</Button>
								<Button icon={<DownloadOutlined />} onClick={handleExport}>
									导出
								</Button>
							</Space>
						</Col>
					</Row>
				</div>
			</Card>

			{/* Table Area */}
			<Card title="订单列表" className="shadow-sm">
				<Table
					columns={columns}
					dataSource={filteredData}
					rowKey="id"
					loading={loading}
					pagination={{
						total: filteredData.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `共 ${total} 条记录`,
					}}
					scroll={{ x: 1500 }}
				/>
			</Card>
		</div>
	)
}
