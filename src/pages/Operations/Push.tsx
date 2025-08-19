import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Radio, Space, Table, Tag, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'

 type AudienceType = '全部用户' | '指定用户'
 type TaskStatus = '已安排' | '已发送' | '已取消'

 interface PushTask {
	id: string
	title: string
	content: string
	audienceType: AudienceType
	targetUsers?: string[]
	scheduledAt?: string
	sentAt?: string
	createdAt: string
	status: TaskStatus
 }

 const STORAGE_KEY = 'operations_push_tasks'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function defaultTasks(): PushTask[] {
	return [
		{ id: 'pt1', title: '系统维护通知', content: '本周五凌晨1:00-3:00进行系统维护，期间可能影响服务访问。', audienceType: '全部用户', createdAt: nowString(), status: '已安排', scheduledAt: dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm') },
		{ id: 'pt2', title: '新活动上线', content: '参与购车返现活动，限时优惠，详情见小程序首页横幅。', audienceType: '指定用户', targetUsers: ['13800001111', '13900002222'], createdAt: nowString(), status: '已发送', sentAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm') },
	]
 }

 function loadTasks(): PushTask[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed: PushTask[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultTasks()
				localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultTasks()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }

 function saveTasks(list: PushTask[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
 }

 export default function OperationsPush() {
	const [tasks, setTasks] = useState<PushTask[]>([])
	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<PushTask | null>(null)
	const [form] = Form.useForm()
	const tickRef = useRef<number | null>(null)

	useEffect(() => {
		setTasks(loadTasks())
		if (tickRef.current) window.clearInterval(tickRef.current)
		tickRef.current = window.setInterval(() => {
			setTasks(prev => autoSendIfDue(prev))
		}, 60 * 1000)
		return () => { if (tickRef.current) window.clearInterval(tickRef.current) }
	}, [])

	useEffect(() => { saveTasks(tasks) }, [tasks])

	const list = useMemo(() => {
		return [...tasks].sort((a, b) => dayjs(b.createdAt || 0).valueOf() - dayjs(a.createdAt || 0).valueOf())
	}, [tasks])

	function autoSendIfDue(arr: PushTask[]) {
		const now = dayjs()
		let changed = false
		const updated = arr.map(t => {
			if (t.status === '已安排' && t.scheduledAt && now.isAfter(dayjs(t.scheduledAt))) {
				changed = true
				return { ...t, status: '已发送' as TaskStatus, sentAt: now.format('YYYY-MM-DD HH:mm') }
			}
			return t
		})
		return changed ? updated : arr
	}

	const openCreate = () => {
		setEditing(null)
		setVisible(true)
		form.resetFields()
		form.setFieldsValue({ audienceType: '全部用户' as AudienceType, sendType: 'schedule', scheduledAt: dayjs().add(1, 'hour') })
	}

	const openEdit = (task: PushTask) => {
		setEditing(task)
		setVisible(true)
		form.resetFields()
		form.setFieldsValue({
			title: task.title,
			content: task.content,
			audienceType: task.audienceType,
			targetUsers: task.targetUsers?.join(',') || '',
			sendType: task.scheduledAt ? 'schedule' : 'now',
			scheduledAt: task.scheduledAt ? dayjs(task.scheduledAt) : undefined,
		})
	}

	const submit = async () => {
		try {
			const v = await form.validateFields()
			const sendType = v.sendType as 'now' | 'schedule'
			const payload: PushTask = {
				id: editing ? editing.id : `pt${Date.now()}`,
				title: String(v.title),
				content: String(v.content),
				audienceType: v.audienceType as AudienceType,
				targetUsers: (v.audienceType as AudienceType) === '指定用户' ? String(v.targetUsers || '').split(/[，,\n\s]+/).filter(Boolean) : undefined,
				scheduledAt: sendType === 'schedule' ? (v.scheduledAt as Dayjs)?.format('YYYY-MM-DD HH:mm') : undefined,
				sentAt: sendType === 'now' ? dayjs().format('YYYY-MM-DD HH:mm') : editing?.sentAt,
				createdAt: editing ? editing.createdAt : nowString(),
				status: sendType === 'now' ? '已发送' : '已安排',
			}
			if (editing) {
				setTasks(prev => prev.map(t => (t.id === editing.id ? payload : t)))
				message.success('更新成功')
			} else {
				setTasks(prev => [payload, ...prev])
				message.success(sendType === 'now' ? '已立即发送' : '已创建并安排')
			}
			setVisible(false)
		} catch {}
	}

	const sendNow = (task: PushTask) => {
		if (task.status !== '已安排') return
		setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: '已发送', sentAt: dayjs().format('YYYY-MM-DD HH:mm'), scheduledAt: undefined } : t)))
		message.success('已立即发送')
	}

	const cancelTask = (task: PushTask) => {
		if (task.status !== '已安排') return
		setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: '已取消' } : t)))
		message.success('已取消')
	}

	const removeTask = (task: PushTask) => {
		setTasks(prev => prev.filter(t => t.id !== task.id))
		message.success('已删除')
	}

	const columns: ColumnsType<PushTask> = [
		{ title: '任务ID', dataIndex: 'id', width: 160 },
		{ title: '标题', dataIndex: 'title' },
		{ title: '推送对象', render: (_: any, r: PushTask) => r.audienceType === '全部用户' ? '全部用户' : (
			<Tooltip title={(r.targetUsers || []).join(', ')}>{`指定用户(${r.targetUsers?.length || 0})`}</Tooltip>
		) },
		{ title: '内容预览', dataIndex: 'content', render: (v: string) => v.length > 30 ? v.slice(0, 30) + '…' : v },
		{ title: '推送时间', render: (_: any, r: PushTask) => r.scheduledAt ? r.scheduledAt : (r.sentAt || '-') },
		{ title: '状态', dataIndex: 'status', render: (v: TaskStatus) => {
			const color = v === '已发送' ? 'success' : (v === '已安排' ? 'processing' : 'default')
			return <Tag color={color}>{v}</Tag>
		}},
		{ title: '创建时间', dataIndex: 'createdAt' },
		{ title: '操作', width: 260, render: (_: any, r: PushTask) => (
			<Space>
				<Button size="small" onClick={() => openEdit(r)} disabled={r.status !== '已安排'}>编辑</Button>
				{r.status === '已安排' ? <Button size="small" type="primary" onClick={() => sendNow(r)}>立即发送</Button> : null}
				{r.status === '已安排' ? (
					<Popconfirm title="确认取消该任务？" onConfirm={() => cancelTask(r)}>
						<Button size="small">取消</Button>
					</Popconfirm>
				) : null}
				<Popconfirm title="确定删除该任务？" onConfirm={() => removeTask(r)}>
					<Button size="small" danger>删除</Button>
				</Popconfirm>
			</Space>
		) },
	]

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">消息推送</div>
				<Space>
					<Button type="primary" onClick={openCreate}>新建推送</Button>
				</Space>
			</div>
			<Card>
				<Table<PushTask>
					rowKey="id"
					dataSource={list}
					columns={columns}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				open={visible}
				title={editing ? '编辑推送任务' : '新建推送任务'}
				onCancel={() => setVisible(false)}
				onOk={submit}
				okText="保存"
				width={720}
			>
				<Form form={form} layout="vertical">
					<Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
						<Input maxLength={40} placeholder="如：系统维护通知" />
					</Form.Item>
					<Form.Item name="content" label="推送内容" rules={[{ required: true, message: '请输入推送内容' }]}>
						<Input.TextArea rows={4} maxLength={500} placeholder="推送的文本内容" />
					</Form.Item>
					<Form.Item name="audienceType" label="推送对象" rules={[{ required: true, message: '请选择推送对象' }]}>
						<Radio.Group>
							<Radio value={'全部用户' as AudienceType}>全部用户</Radio>
							<Radio value={'指定用户' as AudienceType}>指定用户</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item noStyle shouldUpdate>
						{() => (form.getFieldValue('audienceType') === ('指定用户' as AudienceType) ? (
							<Form.Item name="targetUsers" label="用户标识（逗号或换行分隔）" rules={[{ required: true, message: '请输入指定用户' }]}>
								<Input.TextArea rows={3} placeholder="可输入手机号或用户ID，逗号或换行分隔" />
							</Form.Item>
						) : null)}
					</Form.Item>
					<Form.Item name="sendType" label="推送时间" rules={[{ required: true, message: '请选择推送时间' }]}>
						<Radio.Group>
							<Radio value={'now'}>立即推送</Radio>
							<Radio value={'schedule'}>定时推送</Radio>
						</Radio.Group>
					</Form.Item>
					<Form.Item noStyle shouldUpdate>
						{() => (form.getFieldValue('sendType') === 'schedule' ? (
							<Form.Item name="scheduledAt" label="定时到达时间" rules={[{ required: true, message: '请选择定时到达时间' }]}>
								<DatePicker showTime format="YYYY-MM-DD HH:mm" />
							</Form.Item>
						) : null)}
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
 }


