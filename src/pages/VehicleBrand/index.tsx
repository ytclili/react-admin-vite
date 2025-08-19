import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Upload, 
  Image, 
  Switch, 
  message,
  Popconfirm,
  Tag
} from 'antd'
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  ShopOutlined, 
  CarOutlined,
  UploadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input

interface BrandData {
  id: string
  logo: string
  name: string
  firstLetter: string
  storeCount: number
  vehicleCount: number
  status: 'enabled' | 'disabled'
  createTime: string
}

const mockData: BrandData[] = [
  {
    id: 'BR001',
    logo: 'https://via.placeholder.com/40x40/000000/FFFFFF?text=A',
    name: '奥迪',
    firstLetter: 'A',
    storeCount: 24,
    vehicleCount: 56,
    status: 'enabled',
    createTime: '2023-01-15 14:23'
  },
  {
    id: 'BR002',
    logo: 'https://via.placeholder.com/40x40/0066CC/FFFFFF?text=B',
    name: '宝马',
    firstLetter: 'B',
    storeCount: 18,
    vehicleCount: 42,
    status: 'enabled',
    createTime: '2023-02-10 09:45'
  },
  {
    id: 'BR003',
    logo: 'https://via.placeholder.com/40x40/CCCCCC/FFFFFF?text=M',
    name: '奔驰',
    firstLetter: 'B',
    storeCount: 21,
    vehicleCount: 38,
    status: 'enabled',
    createTime: '2023-02-12 11:30'
  },
  {
    id: 'BR004',
    logo: 'https://via.placeholder.com/40x40/666666/FFFFFF?text=T',
    name: '丰田',
    firstLetter: 'F',
    storeCount: 15,
    vehicleCount: 33,
    status: 'enabled',
    createTime: '2023-03-05 16:20'
  },
  {
    id: 'BR005',
    logo: 'https://via.placeholder.com/40x40/0066CC/FFFFFF?text=H',
    name: '本田',
    firstLetter: 'B',
    storeCount: 12,
    vehicleCount: 27,
    status: 'disabled',
    createTime: '2023-03-20 10:15'
  }
]

export const VehicleBrand = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<BrandData[]>(mockData)
  const [filteredData, setFilteredData] = useState<BrandData[]>(mockData)
  const [searchValue, setSearchValue] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandData | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Search functionality
  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (!value.trim()) {
      setFilteredData(data)
    } else {
      const filtered = data.filter(brand => 
        brand.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredData(filtered)
    }
  }

  const handleReset = () => {
    setSearchValue('')
    setFilteredData(data)
  }

  // Modal operations
  const showModal = (brand?: BrandData) => {
    if (brand) {
      setEditingBrand(brand)
      form.setFieldsValue({
        name: brand.name,
        firstLetter: brand.firstLetter,
        logo: brand.logo
      })
    } else {
      setEditingBrand(null)
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingBrand(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
              if (editingBrand) {
          // Update existing brand
          const updatedData = data.map(brand => 
            brand.id === editingBrand.id 
              ? { 
                  ...brand, 
                  name: values.name as string, 
                  firstLetter: values.firstLetter as string, 
                  logo: values.logo as string 
                }
              : brand
          )
          setData(updatedData)
          setFilteredData(updatedData)
          message.success('品牌更新成功')
        } else {
          // Add new brand
          const newBrand: BrandData = {
            id: `BR${String(data.length + 1).padStart(3, '0')}`,
            logo: values.logo as string,
            name: values.name as string,
            firstLetter: values.firstLetter as string,
            storeCount: 0,
            vehicleCount: 0,
            status: 'enabled',
            createTime: new Date().toLocaleString()
          }
          const newData = [...data, newBrand]
          setData(newData)
          setFilteredData(newData)
          message.success('品牌添加成功')
        }
      
      handleCancel()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Status toggle
  const handleStatusChange = (brand: BrandData) => {
    const newStatus = brand.status === 'enabled' ? 'disabled' : 'enabled'
    const updatedData = data.map(b => 
      b.id === brand.id ? { ...b, status: newStatus } : b
    )
    setData(updatedData)
    setFilteredData(updatedData)
    message.success(`品牌${newStatus === 'enabled' ? '启用' : '禁用'}成功`)
  }

  // Table columns
  const columns: ColumnsType<BrandData> = [
    {
      title: '品牌ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '品牌Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 80,
      render: (logo: string) => (
        <Image
          width={40}
          height={40}
          src={logo}
          style={{ borderRadius: '50%' }}
        />
      ),
    },
    {
      title: '品牌名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '首字母',
      dataIndex: 'firstLetter',
      key: 'firstLetter',
      width: 80,
      align: 'center',
    },
    {
      title: '门店数量',
      dataIndex: 'storeCount',
      key: 'storeCount',
      width: 100,
      align: 'center',
    },
    {
      title: '车型数量',
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 100,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === 'enabled' ? 'green' : 'red'}>
          {status === 'enabled' ? '启用' : '禁用'}
        </Tag>
      ),
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
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<ShopOutlined />}
            onClick={() => navigate('/vehicle/brand/stores')}
          >
            管理门店
          </Button>
          <Button 
            type="link" 
            icon={<CarOutlined />}
            onClick={() => message.info('进入车型管理页面')}
          >
            管理车型
          </Button>
          <Popconfirm
            title={`确定要${record.status === 'enabled' ? '禁用' : '启用'}该品牌吗？`}
            onConfirm={() => handleStatusChange(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger={record.status === 'enabled'}
            >
              {record.status === 'enabled' ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      {/* Search Area */}
      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">品牌名称：</span>
            <Search
              placeholder="请输入品牌名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
          </div>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* Operation Area */}
      <div className="mb-4">
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          新增品牌
        </Button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">品牌列表</h3>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingBrand ? '编辑品牌' : '新增品牌'}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSubmit}
        confirmLoading={loading}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: true }}
        >
          <Form.Item
            name="name"
            label="品牌名称"
            rules={[
              { required: true, message: '请输入品牌名称' },
              { max: 20, message: '品牌名称不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入品牌名称" />
          </Form.Item>

          <Form.Item
            name="logo"
            label="品牌Logo"
            rules={[
              { required: true, message: '请上传品牌Logo' }
            ]}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                if (fileList.length > 0) {
                  const file = fileList[0]
                  if (file.size && file.size > 2 * 1024 * 1024) {
                    message.error('图片大小不能超过2MB')
                    return false
                  }
                  if (!['image/jpeg', 'image/png'].includes(file.type || '')) {
                    message.error('只支持JPG/PNG格式')
                    return false
                  }
                }
              }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="firstLetter"
            label="首字母"
            rules={[
              { required: true, message: '请输入首字母' },
              { pattern: /^[A-Z]$/, message: '请输入单个大写字母' }
            ]}
          >
            <Input placeholder="请输入首字母（A-Z）" maxLength={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
