import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Upload, 
  Image, 
  Select, 
  message,
  Popconfirm,
  Tag,
  InputNumber
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UploadOutlined,
  TagsOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface VehicleModelData {
  id: string
  image: string
  name: string
  brandId: string
  brandName: string
  year: string
  price: number
  createTime: string
  description?: string
}

interface BrandData {
  id: string
  name: string
  status: 'enabled' | 'disabled'
}

// Mock brand data (only enabled brands)
const mockBrands: BrandData[] = [
  { id: 'BR001', name: '奥迪', status: 'enabled' },
  { id: 'BR002', name: '宝马', status: 'enabled' },
  { id: 'BR003', name: '奔驰', status: 'enabled' },
  { id: 'BR004', name: '丰田', status: 'enabled' },
  { id: 'BR005', name: '本田', status: 'disabled' }, // This one should be filtered out
]

const mockVehicleModels: VehicleModelData[] = [
  {
    id: 'VM001',
    image: 'https://via.placeholder.com/80x60/000000/FFFFFF?text=A6L',
    name: 'A6L',
    brandId: 'BR001',
    brandName: '奥迪',
    year: '2024款',
    price: 42.98,
    createTime: '2023-12-15 14:23',
    description: '奥迪A6L是一款豪华中大型轿车，采用最新设计语言，配备先进科技配置。'
  },
  {
    id: 'VM002',
    image: 'https://via.placeholder.com/80x60/0066CC/FFFFFF?text=5系',
    name: '宝马5系',
    brandId: 'BR002',
    brandName: '宝马',
    year: '2024款',
    price: 44.99,
    createTime: '2023-12-10 09:45',
    description: '宝马5系是宝马品牌的中大型豪华轿车，以运动性能和豪华舒适著称。'
  },
  {
    id: 'VM003',
    image: 'https://via.placeholder.com/80x60/CCCCCC/FFFFFF?text=E级',
    name: '奔驰E级',
    brandId: 'BR003',
    brandName: '奔驰',
    year: '2023款',
    price: 43.68,
    createTime: '2023-11-20 11:30',
    description: '奔驰E级是奔驰品牌的中大型豪华轿车，以优雅设计和豪华配置闻名。'
  },
  {
    id: 'VM004',
    image: 'https://via.placeholder.com/80x60/666666/FFFFFF?text=凯美瑞',
    name: '凯美瑞',
    brandId: 'BR004',
    brandName: '丰田',
    year: '2024款',
    price: 17.98,
    createTime: '2023-11-15 16:20',
    description: '丰田凯美瑞是一款中型轿车，以可靠性和经济性著称。'
  }
]

export const VehicleModel = () => {
  const [data, setData] = useState<VehicleModelData[]>(mockVehicleModels)
  const [filteredData, setFilteredData] = useState<VehicleModelData[]>(mockVehicleModels)
  const [searchValue, setSearchValue] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [yearValue, setYearValue] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingModel, setEditingModel] = useState<VehicleModelData | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Get only enabled brands for the dropdown
  const enabledBrands = mockBrands.filter(brand => brand.status === 'enabled')

  // Search and filter functionality
  const handleSearch = () => {
    let filtered = data
    
    if (selectedBrand) {
      filtered = filtered.filter(model => model.brandId === selectedBrand)
    }
    
    if (searchValue.trim()) {
      filtered = filtered.filter(model => 
        model.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    }
    
    if (yearValue.trim()) {
      filtered = filtered.filter(model => 
        model.year.includes(yearValue)
      )
    }
    
    setFilteredData(filtered)
  }

  const handleReset = () => {
    setSearchValue('')
    setSelectedBrand('')
    setYearValue('')
    setFilteredData(data)
  }

  // Modal operations
  const showModal = (model?: VehicleModelData) => {
    if (model) {
      setEditingModel(model)
      form.setFieldsValue({
        brandId: model.brandId,
        name: model.name,
        year: model.year,
        price: model.price,
        description: model.description
      })
    } else {
      setEditingModel(null)
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingModel(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingModel) {
        // Update existing model
        const updatedData = data.map(model => 
          model.id === editingModel.id 
            ? { 
                ...model, 
                brandId: values.brandId,
                brandName: enabledBrands.find(b => b.id === values.brandId)?.name || '',
                name: values.name,
                year: values.year,
                price: values.price,
                description: values.description
              }
            : model
        )
        setData(updatedData)
        setFilteredData(updatedData)
        message.success('车型更新成功')
      } else {
        // Add new model
        const newModel: VehicleModelData = {
          id: `VM${String(data.length + 1).padStart(3, '0')}`,
          image: 'https://via.placeholder.com/80x60/CCCCCC/FFFFFF?text=NEW',
          name: values.name,
          brandId: values.brandId,
          brandName: enabledBrands.find(b => b.id === values.brandId)?.name || '',
          year: values.year,
          price: values.price || 0,
          createTime: new Date().toLocaleString(),
          description: values.description
        }
        const newData = [...data, newModel]
        setData(newData)
        setFilteredData(newData)
        message.success('车型添加成功')
      }
      
      handleCancel()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete model
  const handleDelete = (model: VehicleModelData) => {
    // Check if model has associated data (simulate check)
    const hasAssociatedData = Math.random() > 0.7 // 30% chance of having associated data
    
    if (hasAssociatedData) {
      message.error('无法删除，请先处理关联数据')
      return
    }
    
    const newData = data.filter(item => item.id !== model.id)
    setData(newData)
    setFilteredData(newData)
    message.success('车型删除成功')
  }

  // Table columns
  const columns: ColumnsType<VehicleModelData> = [
    {
      title: '车型ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '车型图片',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image: string) => (
        <Image
          width={80}
          height={60}
          src={image}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: '车型名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '所属品牌',
      dataIndex: 'brandName',
      key: 'brandName',
      width: 100,
    },
    {
      title: '年款',
      dataIndex: 'year',
      key: 'year',
      width: 100,
    },
    {
      title: '官方指导价',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'center',
      render: (price: number) => (
        <span>¥{price.toFixed(2)}万</span>
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
      width: 200,
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
            icon={<TagsOutlined />}
            onClick={() => message.info('进入SKU管理页面')}
          >
            管理SKU
          </Button>
          <Popconfirm
            title="确定要删除该车型吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              删除
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
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">所属品牌：</span>
            <Select
              placeholder="请选择品牌"
              value={selectedBrand}
              onChange={setSelectedBrand}
              style={{ width: 150 }}
              allowClear
            >
              {enabledBrands.map(brand => (
                <Option key={brand.id} value={brand.id}>
                  {brand.name}
                </Option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">车型名称：</span>
            <Input
              placeholder="请输入车型名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: 150 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">年款：</span>
            <Input
              placeholder="请输入年款"
              value={yearValue}
              onChange={(e) => setYearValue(e.target.value)}
              style={{ width: 120 }}
            />
          </div>
          <Button type="primary" onClick={handleSearch}>查询</Button>
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
          新增车型
        </Button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">车型列表</h3>
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
        title={editingModel ? '编辑车型' : '新增车型'}
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
        >
          <Form.Item
            name="brandId"
            label="所属品牌"
            rules={[
              { required: true, message: '请选择所属品牌' }
            ]}
          >
            <Select placeholder="请选择品牌">
              {enabledBrands.map(brand => (
                <Option key={brand.id} value={brand.id}>
                  {brand.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="车型名称"
            rules={[
              { required: true, message: '请输入车型名称' },
              { max: 50, message: '车型名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入车型名称" />
          </Form.Item>

          <Form.Item
            name="year"
            label="年款"
            rules={[
              { required: true, message: '请输入年款' }
            ]}
          >
            <Input placeholder="建议格式：202X款" />
          </Form.Item>

          <Form.Item
            name="image"
            label="车型图片"
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
            name="price"
            label="官方指导价"
          >
            <InputNumber
              placeholder="请输入价格"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="万元"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="车型简介"
          >
            <TextArea
              placeholder="请输入车型简介"
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
