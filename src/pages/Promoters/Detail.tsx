import { useEffect, useMemo, useState } from 'react'
import { Avatar, Badge, Button, Card, Col, DatePicker, Descriptions, Form, Input, Row, Select, Space, Statistic, Table, Tabs, Tag, message } from 'antd'
import dayjs from 'dayjs'
import { useLocation } from 'react-router-dom'

type PromoterType = '个人' | '团队成员'
type PromoterStatus = '正常' | '冻结'

interface PromoterRecord {
  id: string
  name: string
  phone: string
  avatar: string
  type: PromoterType
  partnerId?: string
  partnerName?: string
  leaderName?: string
  groupId?: string
  groupName?: string
  canDevelopChildren: boolean
  status: PromoterStatus
  createdAt: string
}

interface CommissionItem {
  id: string
  orderNo: string
  type: '购车分成' | '线索分成' | '团队管理奖'
  amount: number
  status: '待结算' | '已结算' | '已失效'
  createdAt: string
  settledAt?: string
}

const STORAGE_PROMOTERS = 'promoters_list'
const STORAGE_GROUPS = 'promoter_strategy_groups'

function loadPromoters(): PromoterRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROMOTERS)
    if (raw) return JSON.parse(raw)
    return []
  } catch { return [] }
}

function loadGroups(): Array<{ id: string; name: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_GROUPS)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

function makeCommissionSeed(pid: string): CommissionItem[] {
  const now = new Date()
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return [
    { id: `c-${pid}-1`, orderNo: 'O202401010001', type: '购车分成', amount: 300, status: '已结算', createdAt: ymd(now), settledAt: ymd(now) },
    { id: `c-${pid}-2`, orderNo: 'O202401020002', type: '线索分成', amount: 20, status: '待结算', createdAt: ymd(now) },
    { id: `c-${pid}-3`, orderNo: 'O202401030003', type: '团队管理奖', amount: 50, status: '已失效', createdAt: ymd(now), settledAt: ymd(now) },
  ]
}

export default function PromoterDetail() {
  const location = useLocation()
  const sp = new URLSearchParams(location.search)
  const promoterId = sp.get('promoterId') || ''

  const [promoter, setPromoter] = useState<PromoterRecord | null>(null)
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [commissions, setCommissions] = useState<CommissionItem[]>([])
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'))

  useEffect(() => {
    setGroups(loadGroups())
    const list = loadPromoters()
    const target = list.find(i => i.id === promoterId) || list[0] || null
    setPromoter(target)
    setCommissions(makeCommissionSeed(target?.id || 'demo'))
  }, [promoterId])

  const stats = useMemo(() => {
    // mock summarized stats
    return {
      cover: 1234,
      users: 560,
      usersToday: 12,
      couponToday: 20,
      couponValidToday: 15,
      ordersToday: 3,
      ordersTotal: 40,
      ordersPendingPurchase: 5,
      ordersDone: 28,
      commissionTotal: commissions.filter(c => c.status === '已结算').reduce((s, c) => s + c.amount, 0),
    }
  }, [commissions])

  const changeGroup = (gid?: string) => {
    if (!promoter) return
    const gname = groups.find(g => g.id === gid)?.name
    const updated = { ...promoter, groupId: gid, groupName: gname }
    setPromoter(updated)
    // persist
    const list = loadPromoters().map(p => p.id === updated.id ? updated : p)
    localStorage.setItem(STORAGE_PROMOTERS, JSON.stringify(list))
    message.success('策略组已更新')
  }

  const toggleDevelop = (val: boolean) => {
    if (!promoter) return
    const updated = { ...promoter, canDevelopChildren: val }
    setPromoter(updated)
    const list = loadPromoters().map(p => p.id === updated.id ? updated : p)
    localStorage.setItem(STORAGE_PROMOTERS, JSON.stringify(list))
    message.success('发展下级权限已更新')
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="text-lg font-semibold">推客详情</div>
      {promoter ? (
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={promoter.avatar} size={64} />
            <div className="space-y-1">
              <div className="text-base font-medium">{promoter.name} <Tag color={promoter.type === '个人' ? 'green' : 'purple'}>{promoter.type}</Tag></div>
              <div className="text-black/60">ID：{promoter.id} ｜ 手机：{promoter.phone} ｜ 状态：<Tag color={promoter.status === '正常' ? 'success' : 'default'}>{promoter.status}</Tag></div>
            </div>
          </div>
        </Card>
      ) : null}

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                <Row gutter={16}>
                  <Col span={12}>
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="合作方">{promoter?.partnerName || '-'}</Descriptions.Item>
                      <Descriptions.Item label="上级/小组长">{promoter?.leaderName || '-'}</Descriptions.Item>
                      <Descriptions.Item label="创建时间">{promoter?.createdAt}</Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col span={12}>
                    <Form layout="vertical">
                      <Form.Item label="所属策略组">
                        <Select allowClear value={promoter?.groupId} style={{ width: 240 }} onChange={(v) => changeGroup(v)} options={groups.map(g => ({ value: g.id, label: g.name }))} />
                      </Form.Item>
                      <Form.Item label="发展下级权限">
                        <Select value={promoter?.canDevelopChildren ? '是' : '否'} style={{ width: 240 }} onChange={(v) => toggleDevelop(v === '是')} options={[{ value: '是', label: '是' }, { value: '否', label: '否' }]} />
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'hierarchy',
            label: '层级关系',
            children: (
              <Card>
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" title="上级">
                      <div>{promoter?.leaderName || '-'}</div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="直接下级">
                      <div className="text-black/45">无下级（示例占位）</div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'performance',
            label: '业绩数据',
            children: (
              <Card>
                <Space className="mb-3">
                  <DatePicker picker="month" value={dayjs(month)} onChange={(d) => setMonth(d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM'))} />
                  <Button onClick={() => setMonth(dayjs().format('YYYY-MM'))}>本月</Button>
                  <Button onClick={() => setMonth('total')}>总计</Button>
                </Space>
                <Row gutter={16}>
                  <Col span={6}><Card><Statistic title="推广覆盖（次）" value={stats.cover} /></Card></Col>
                  <Col span={6}><Card><Statistic title="总用户数" value={stats.users} /></Card></Col>
                  <Col span={6}><Card><Statistic title="今日新增用户" value={stats.usersToday} /></Card></Col>
                  <Col span={6}><Card><Statistic title="今日领券用户" value={stats.couponToday} /></Card></Col>
                </Row>
                <Row gutter={16} className="mt-3">
                  <Col span={6}><Card><Statistic title="今日新增订单" value={stats.ordersToday} /></Card></Col>
                  <Col span={6}><Card><Statistic title="累计订单" value={stats.ordersTotal} /></Card></Col>
                  <Col span={6}><Card><Statistic title="当前待购车订单" value={stats.ordersPendingPurchase} /></Card></Col>
                  <Col span={6}><Card><Statistic title="累计成交订单" value={stats.ordersDone} /></Card></Col>
                </Row>
                <Row gutter={16} className="mt-3">
                  <Col span={6}><Card><Statistic title="累计佣金（元）" value={stats.commissionTotal} precision={2} /></Card></Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'commission',
            label: '佣金明细',
            children: (
              <Card>
                <Table
                  rowKey="id"
                  dataSource={commissions}
                  pagination={{ pageSize: 10 }}
                  columns={[
                    { title: '佣金ID', dataIndex: 'id', width: 160 },
                    { title: '关联订单号', dataIndex: 'orderNo' },
                    { title: '佣金类型', dataIndex: 'type' },
                    { title: '佣金金额(元)', dataIndex: 'amount' },
                    { title: '状态', dataIndex: 'status', render: (v: CommissionItem['status']) => (
                      <Tag color={v === '待结算' ? 'default' : v === '已结算' ? 'success' : 'error'}>{v}</Tag>
                    ) },
                    { title: '创建时间', dataIndex: 'createdAt' },
                    { title: '结算时间', dataIndex: 'settledAt', render: (v?: string) => v || '-' },
                  ]}
                />
              </Card>
            )
          },
        ]}
      />
    </div>
  )
}


