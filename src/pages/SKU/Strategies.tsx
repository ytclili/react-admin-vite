import React, { useEffect, useMemo, useState } from 'react'
import { Table, Button, Space, Modal, Form, InputNumber, Tag, DatePicker, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useLocation } from 'react-router-dom'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface StrategyRecord {
  id: string
  skuId: string
  supplierName: string
  settlementSubsidy: number
  userSubsidy?: number
  distributorCommission?: number
  platformProfit?: number
  quota: number
  remainQuota: number
  status: 'enabled' | 'disabled'
  effectiveRange?: [string, string]
}

const STRATEGY_STORAGE_KEY = 'demo_sku_strategies'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

function loadStrategies(): StrategyRecord[] {
  try {
    const raw = localStorage.getItem(STRATEGY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStrategies(list: StrategyRecord[]) {
  localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(list))
}

export default function Strategies() {
  const query = useQuery()
  const skuId = query.get('skuId') || ''
  const skuName = query.get('skuName') || '未命名SKU'

  const [strategies, setStrategies] = useState<StrategyRecord[]>([])
  const [visible, setVisible] = useState(false)
  const [editing, setEditing] = useState<StrategyRecord | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    setStrategies(loadStrategies())
  }, [])

  const list = useMemo(() => strategies.filter(s => s.skuId === skuId), [strategies, skuId])

  function openEdit(rec: StrategyRecord) {
    setEditing(rec)
    form.setFieldsValue({
      userSubsidy: rec.userSubsidy,
      distributorCommission: rec.distributorCommission,
      quota: rec.quota,
      effectiveRange: rec.effectiveRange ? [dayjs(rec.effectiveRange[0]), dayjs(rec.effectiveRange[1])] : undefined,
      status: rec.status === 'enabled' ? 1 : 0,
    })
    setVisible(true)
  }

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      const newList = [...strategies]
      const idx = newList.findIndex(s => s.id === (editing as StrategyRecord).id)
      const range = values.effectiveRange as any
      const next = {
        ...editing!,
        userSubsidy: values.userSubsidy,
        distributorCommission: values.distributorCommission,
        platformProfit: (editing!.settlementSubsidy || 0) - (values.userSubsidy || 0) - (values.distributorCommission || 0),
        quota: values.quota,
        status: values.status === 1 ? 'enabled' as const : 'disabled' as const,
        effectiveRange: range ? [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')] : undefined,
      }

      // 启用状态校验
      if (next.status === 'enabled') {
        if (next.userSubsidy == null || next.distributorCommission == null) {
          message.error('信息不完整，无法启用')
          return
        }
      }

      newList[idx] = next
      setStrategies(newList)
      saveStrategies(newList)
      message.success('策略已保存')
      setVisible(false)
      setEditing(null)
    } catch {}
  }

  const columns: ColumnsType<StrategyRecord> = [
    { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName', width: 160 },
    { title: '结算补贴(元)', dataIndex: 'settlementSubsidy', key: 'settlementSubsidy', width: 140 },
    { title: '用户补贴(元)', dataIndex: 'userSubsidy', key: 'userSubsidy', width: 140 },
    { title: '分销佣金(元)', dataIndex: 'distributorCommission', key: 'distributorCommission', width: 140 },
    { title: '平台利润(元)', dataIndex: 'platformProfit', key: 'platformProfit', width: 140, render: (_, r) => (r.settlementSubsidy - (r.userSubsidy || 0) - (r.distributorCommission || 0)) },
    { title: '补贴名额', dataIndex: 'quota', key: 'quota', width: 120 },
    { title: '剩余名额', dataIndex: 'remainQuota', key: 'remainQuota', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center', render: (s) => <Tag color={s === 'enabled' ? 'green' : 'default'}>{s === 'enabled' ? '启用' : '禁用'}</Tag> },
    { title: '操作', key: 'action', width: 120, render: (_, r) => <Button type="link" onClick={() => openEdit(r)}>编辑</Button> },
  ]

  return (
    <div className="space-y-4">
      <div className="text-black/45">... / SKU管理 / <span className="text-black/80">{skuName}</span> / 管理补贴策略</div>
      <div className="bg-white rounded-lg border border-[#F0F0F0]">
        <div className="p-4 border-b border-[#F0F0F0]">
          <h3 className="text-lg font-medium">补贴策略列表</h3>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </div>

      <Modal
        title={editing ? `编辑策略 - ${editing.supplierName}` : ''}
        open={visible}
        onCancel={() => { setVisible(false); setEditing(null) }}
        onOk={onSubmit}
        okText="保存"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户补贴金额(元)" name="userSubsidy" rules={[{ required: true, message: '请输入用户补贴金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="分销基础佣金(元)" name="distributorCommission" rules={[{ required: true, message: '请输入分销基础佣金' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="补贴名额" name="quota" rules={[{ required: true, message: '请输入补贴名额' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="生效日期" name="effectiveRange">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            {/* 1=启用, 0=禁用 */}
            <InputNumber min={0} max={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


