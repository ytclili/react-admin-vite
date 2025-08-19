import React, { useState } from 'react'
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select

interface StoreData {
  id: string
  name: string
  address: string
  phone: string
  manager: string
  status: 'active' | 'inactive'
  createTime: string
}

const mockStoreData: StoreData[] = [
  {
    id: 'ST001',
    name: '奥迪北京朝阳店',
    address: '北京市朝阳区建国门外大街1号',
    phone: '010-12345678',
    manager: '张经理',
    status: 'active',
    createTime: '2023-01-15 14:23'
  },
  {
    id: 'ST002',
    name: '奥迪上海浦东店',
    address: '上海市浦东新区陆家嘴环路1000号',
    phone: '021-87654321',
    manager: '李经理',
    status: 'active',
    createTime: '2023-02-10 09:45'
  },
  {
    id: 'ST003',
    name: '奥迪广州天河店',
    address: '广州市天河区珠江新城花城大道85号',
    phone: '020-11223344',
    manager: '王经理',
    status: 'inactive',
    createTime: '2023-02-12 11:30'
  }
]

export const StoreManage = () => {
  const [data, setData] = useState<StoreData[]>(mockStoreData)
  const [filteredData, setFilteredData] = useState<StoreData[]>(mockStoreData)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingStore, setEditingStore] = useState<StoreData | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Search and filter functionality
  const handleSearch = () => {
    let filtered = data
    
    if (searchValue.trim()) {
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(store => store.status === statusFilter)
    }
    
    setFilteredData(filtered)
  }

  const handleReset = () => {
    setSearchValue('')
    setStatusFilter('all')
    setFilteredData(data)
  }

  // Modal operations
  const showModal = (store?: StoreData) => {
    if (store) {
      setEditingStore(store)
      form.setFieldsValue({
        name: store.name,
        address: store.address,
        phone: store.phone,
        manager: store.manager
      })
    } else {
      setEditingStore(null)
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingStore(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (editingStore) {
        // Update existing store
        const updatedData = data.map(store => 
          store.id === editingStore.id 
            ? { ...store, ...values }
            : store
        )
        setData(updatedData)
        setFilteredData(updatedData)
        message.success('门店更新成功')
      } else {
        // Add new store
        const newStore: StoreData = {
          id: `ST${String(data.length + 1).padStart(3, '0')}`,
          name: values.name,
          address: values.address,
          phone: values.phone,
          manager: values.manager,
          status: 'active',
          createTime: new Date().toLocaleString()
        }
        const newData = [...data, newStore]
        setData(newData)
        setFilteredData(newData)
        message.success('门店添加成功')
      }
      
      handleCancel()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete store
  const handleDelete = (store: StoreData) => {
    const newData = data.filter(item => item.id !== store.id)
    setData(newData)
    setFilteredData(newData)
    message.success('门店删除成功')
  }

  // Table columns
  const columns: ColumnsType<StoreData> = [
    {
      title: '门店ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '门店名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '门店地址',
      dataIndex: 'address',
      key: 'address',
      width: 300,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: '门店经理',
      dataIndex: 'manager',
      key: 'manager',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '营业中' : '已关闭'}
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
          <Popconfirm
            title="确定要删除该门店吗？"
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">门店名称：</span>
            <Search
              placeholder="请输入门店名称"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">状态：</span>
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部</Option>
              <Option value="active">营业中</Option>
              <Option value="inactive">已关闭</Option>
            </Select>
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
          新增门店
        </Button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">门店列表</h3>
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
        title={editingStore ? '编辑门店' : '新增门店'}
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
            name="name"
            label="门店名称"
            rules={[
              { required: true, message: '请输入门店名称' },
              { max: 50, message: '门店名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入门店名称" />
          </Form.Item>

          <Form.Item
            name="address"
            label="门店地址"
            rules={[
              { required: true, message: '请输入门店地址' },
              { max: 200, message: '门店地址不能超过200个字符' }
            ]}
          >
            <Input.TextArea placeholder="请输入门店地址" rows={3} />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: '请输入正确的电话号码' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="manager"
            label="门店经理"
            rules={[
              { required: true, message: '请输入门店经理' },
              { max: 20, message: '门店经理不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入门店经理" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}





