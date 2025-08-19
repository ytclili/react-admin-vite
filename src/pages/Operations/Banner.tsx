import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, DatePicker, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

 type BannerStatus = '待上线' | '已上线' | '已下线'
 type JumpType = '内部页面' | '外部H5链接' | '不跳转'

 interface BannerRecord {
	id: string
	title: string
	imageUrl: string
	jumpType: JumpType
	link?: string
	sort: number
	startTime?: string
	endTime?: string
	createdAt: string
	manualOverride?: 'online' | 'offline'
 }

 const STORAGE_KEY = 'operations_banners'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function defaultBanners(): BannerRecord[] {
	return [
		{ id: 'b1', title: '夏季促销', imageUrl: 'https://via.placeholder.com/750x300?text=Banner+1', jumpType: '外部H5链接', link: 'https://example.com/summer', sort: 0, startTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm'), createdAt: nowString() },
		{ id: 'b2', title: '新品上市', imageUrl: 'https://via.placeholder.com/750x300?text=Banner+2', jumpType: '不跳转', sort: 1, startTime: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'), endTime: dayjs().add(10, 'day').format('YYYY-MM-DD HH:mm'), createdAt: nowString() },
		{ id: 'b3', title: '秒杀活动', imageUrl: 'https://via.placeholder.com/750x300?text=Banner+3', jumpType: '内部页面', link: '/pages/activity', sort: 2, startTime: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm'), endTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'), createdAt: nowString() },
	]
 }

 function loadBanners(): BannerRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed: BannerRecord[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultBanners()
				localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultBanners()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }

 function saveBanners(list: BannerRecord[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
 }

 function computeStatus(item: BannerRecord, now = dayjs()): BannerStatus {
	if (item.manualOverride === 'online') return '已上线'
	if (item.manualOverride === 'offline') return '已下线'
	const start = item.startTime ? dayjs(item.startTime) : null
	const end = item.endTime ? dayjs(item.endTime) : null
	if (start && now.isBefore(start)) return '待上线'
	if (end && now.isAfter(end)) return '已下线'
	if (start && end) {
		return now.isAfter(start) && now.isBefore(end) ? '已上线' : '待上线'
	}
	// 无时间限制默认已上线
	return '已上线'
 }

 export default function OperationsBanner() {
	const [form] = Form.useForm()
	const [list, setList] = useState<BannerRecord[]>([])
	const [query, setQuery] = useState<{ title?: string; status?: BannerStatus | '全部' }>({})
	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<BannerRecord | null>(null)
	const [modalForm] = Form.useForm()
	const timerRef = useRef<number | null>(null)

	useEffect(() => {
		setList(sortBanners(loadBanners()))
		// 定时刷新状态标签
		if (timerRef.current) window.clearInterval(timerRef.current)
		timerRef.current = window.setInterval(() => {
			setList(prev => [...prev])
		}, 60 * 1000)
		return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
	}, [])

	useEffect(() => { saveBanners(list) }, [list])

	const filtered = useMemo(() => {
		const now = dayjs()
		return list.filter(i => {
			if (query.title && !i.title.includes(query.title)) return false
			if (query.status && query.status !== '全部') {
				if (computeStatus(i, now) !== query.status) return false
			}
			return true
		})
	}, [list, query])

	function sortBanners(arr: BannerRecord[]) {
		return [...arr].sort((a, b) => a.sort - b.sort || dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
	}

	const onSearch = () => {
		const v = form.getFieldsValue()
		setQuery({ title: v.q_title || undefined, status: v.q_status || undefined })
	}

	const onReset = () => {
		form.resetFields()
		setQuery({})
	}

	const openCreate = () => {
		setEditing(null)
		setVisible(true)
		modalForm.resetFields()
		modalForm.setFieldsValue({ jumpType: '不跳转' as JumpType, sort: 0 })
	}

	const openEdit = (rec: BannerRecord) => {
		setEditing(rec)
		setVisible(true)
		modalForm.resetFields()
		modalForm.setFieldsValue({
			title: rec.title,
			imageUrl: rec.imageUrl,
			jumpType: rec.jumpType,
			link: rec.link,
			sort: rec.sort,
			range: rec.startTime && rec.endTime ? [dayjs(rec.startTime), dayjs(rec.endTime)] : undefined,
		})
	}

	const submit = async () => {
		try {
			const values = await modalForm.validateFields()
			const range: Dayjs[] | undefined = values.range
			const payload: BannerRecord = {
				id: editing ? editing.id : `b${Date.now()}`,
				title: String(values.title),
				imageUrl: String(values.imageUrl),
				jumpType: values.jumpType as JumpType,
				link: values.jumpType === ('不跳转' as JumpType) ? undefined : (values.link ? String(values.link) : undefined),
				sort: Number(values.sort || 0),
				startTime: range && range[0] ? range[0].format('YYYY-MM-DD HH:mm') : undefined,
				endTime: range && range[1] ? range[1].format('YYYY-MM-DD HH:mm') : undefined,
				createdAt: editing ? editing.createdAt : nowString(),
				manualOverride: editing?.manualOverride,
			}
			if (editing) {
				setList(prev => sortBanners(prev.map(i => (i.id === editing.id ? payload : i))))
				message.success('更新成功')
			} else {
				setList(prev => sortBanners([payload, ...prev]))
				message.success('创建成功')
			}
			setVisible(false)
		} catch {}
	}

	const handleDelete = (rec: BannerRecord) => {
		setList(prev => prev.filter(i => i.id !== rec.id))
		message.success('已删除')
	}

	const moveUp = (rec: BannerRecord) => {
		setList(prev => {
			const arr = [...prev]
			const idx = arr.findIndex(i => i.id === rec.id)
			if (idx > 0) {
				const a = arr[idx - 1]
				const b = arr[idx]
				const tmp = a.sort
				a.sort = b.sort
				b.sort = tmp
			}
			return sortBanners(arr)
		})
	}

	const moveDown = (rec: BannerRecord) => {
		setList(prev => {
			const arr = [...prev]
			const idx = arr.findIndex(i => i.id === rec.id)
			if (idx >= 0 && idx < arr.length - 1) {
				const a = arr[idx]
				const b = arr[idx + 1]
				const tmp = a.sort
				a.sort = b.sort
				b.sort = tmp
			}
			return sortBanners(arr)
		})
	}

	const changeSort = (rec: BannerRecord, val: number | null) => {
		setList(prev => sortBanners(prev.map(i => (i.id === rec.id ? { ...i, sort: Number(val || 0) } : i))))
	}

	const setOnlineNow = (rec: BannerRecord) => {
		setList(prev => prev.map(i => (i.id === rec.id ? { ...i, manualOverride: 'online' } : i)))
		message.success('已立即上线')
	}
	const setOfflineNow = (rec: BannerRecord) => {
		setList(prev => prev.map(i => (i.id === rec.id ? { ...i, manualOverride: 'offline' } : i)))
		message.success('已立即下线')
	}
	const resetSchedule = (rec: BannerRecord) => {
		setList(prev => prev.map(i => (i.id === rec.id ? { ...i, manualOverride: undefined } : i)))
		message.success('已恢复定时')
	}

	// Upload helpers
	const beforeUpload: UploadProps['beforeUpload'] = (file) => {
		const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
		if (!isImage) {
			message.warning('仅支持 JPG/PNG')
			return Upload.LIST_IGNORE
		}
		const isLt2M = file.size / 1024 / 1024 < 2
		if (!isLt2M) {
			message.warning('图片大小需小于2MB')
			return Upload.LIST_IGNORE
		}
		return false // 阻止自动上传
	}

	const handleUploadChange: UploadProps['onChange'] = async (info) => {
		if (info.fileList.length > 0) {
			const file = info.fileList[0].originFileObj as File
			if (file) {
				const base64 = await readFileAsBase64(file)
				modalForm.setFieldsValue({ imageUrl: base64 })
			}
		}
	}

	function readFileAsBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result))
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	const columns: ColumnsType<BannerRecord> = [
		{
			title: '排序', dataIndex: 'sort', width: 160,
			render: (_: any, r: BannerRecord) => (
				<Space>
					<InputNumber min={0} value={r.sort} onChange={(v) => changeSort(r, v)} />
					<Button size="small" icon={<ArrowUpOutlined />} onClick={() => moveUp(r)} />
					<Button size="small" icon={<ArrowDownOutlined />} onClick={() => moveDown(r)} />
				</Space>
			),
		},
		{ title: '图片预览', dataIndex: 'imageUrl', render: (v: string) => <Image src={v} width={120} height={48} style={{ objectFit: 'cover' }} /> },
		{ title: '标题', dataIndex: 'title' },
		{ title: '跳转链接', dataIndex: 'link', render: (v: string | undefined, r: BannerRecord) => r.jumpType === '不跳转' ? '-' : (v || '-') },
		{ title: '状态', render: (_: any, r: BannerRecord) => {
			const st = computeStatus(r)
			const color = st === '已上线' ? 'success' : (st === '待上线' ? 'processing' : 'default')
			return <Tag color={color}>{st}</Tag>
		}},
		{ title: '展示时间', render: (_: any, r: BannerRecord) => r.startTime && r.endTime ? `${r.startTime} ~ ${r.endTime}` : '-' },
		{ title: '创建时间', dataIndex: 'createdAt' },
		{ title: '操作', width: 280, render: (_: any, r: BannerRecord) => {
			const st = computeStatus(r)
			return (
				<Space>
					<Button size="small" onClick={() => openEdit(r)}>编辑</Button>
					<Popconfirm title="确定删除该Banner？" onConfirm={() => handleDelete(r)}>
						<Button size="small" danger>删除</Button>
					</Popconfirm>
					{st !== '已上线' ? <Button size="small" type="primary" onClick={() => setOnlineNow(r)}>立即上线</Button> : null}
					{st === '已上线' ? <Button size="small" onClick={() => setOfflineNow(r)}>立即下线</Button> : null}
					{r.manualOverride ? <Button size="small" onClick={() => resetSchedule(r)}>恢复定时</Button> : null}
				</Space>
			)
		}},
	]

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">Banner管理</div>
				<Space>
					<Button type="primary" onClick={openCreate} icon={<PlusOutlined />}>新增Banner</Button>
				</Space>
			</div>
			<Card>
				<Form form={form} layout="inline" className="w-full flex flex-wrap gap-3">
					<Form.Item name="q_title" label="标题">
						<Input placeholder="支持模糊搜索" allowClear style={{ width: 260 }} />
					</Form.Item>
					<Form.Item name="q_status" label="状态">
						<Select style={{ width: 200 }} allowClear placeholder="全部" options={[{ value: '全部', label: '全部' }, { value: '待上线', label: '待上线' }, { value: '已上线', label: '已上线' }, { value: '已下线', label: '已下线' }]} />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSearch}>查询</Button>
						<Button onClick={onReset}>重置</Button>
					</Space>
				</Form>
			</Card>
			<Card>
				<Table<BannerRecord>
					rowKey="id"
					dataSource={filtered}
					columns={columns}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				open={visible}
				title={editing ? '编辑Banner' : '新增Banner'}
				onCancel={() => setVisible(false)}
				onOk={submit}
				okText="保存"
				width={720}
			>
				<Form form={modalForm} layout="vertical">
					<Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
						<Input maxLength={50} placeholder="用于运营识别" />
					</Form.Item>
					<Form.Item label="Banner图片" required>
						<Form.Item name="imageUrl" noStyle rules={[{ required: true, message: '请上传Banner图片' }]}>
							<Input type="hidden" />
						</Form.Item>
						<Upload listType="picture-card" maxCount={1} beforeUpload={beforeUpload} onChange={handleUploadChange}>
							<div>
								<PlusOutlined />
								<div style={{ marginTop: 8 }}>上传</div>
							</div>
						</Upload>
						<div className="text-black/45 text-xs">建议尺寸 750x300px，大小不超过 2MB</div>
					</Form.Item>
					<Form.Item name="jumpType" label="跳转类型" rules={[{ required: true, message: '请选择跳转类型' }]}>
						<Select options={[{ value: '内部页面', label: '内部页面' }, { value: '外部H5链接', label: '外部H5链接' }, { value: '不跳转', label: '不跳转' }]} />
					</Form.Item>
					<Form.Item noStyle shouldUpdate>
						{() => (modalForm.getFieldValue('jumpType') !== ('不跳转' as JumpType) ? (
							<Form.Item name="link" label="跳转链接" rules={modalForm.getFieldValue('jumpType') === ('外部H5链接' as JumpType) ? [{ required: true, message: '请输入跳转链接' }] : []}>
								<Input placeholder={modalForm.getFieldValue('jumpType') === ('内部页面' as JumpType) ? '如：/pages/home' : '如：https://example.com'} />
							</Form.Item>
						) : null)}
					</Form.Item>
					<Form.Item name="sort" label="排序">
						<InputNumber min={0} style={{ width: 200 }} placeholder="默认0，越小越靠前" />
					</Form.Item>
					<Form.Item name="range" label="展示时间" rules={[{ required: true, message: '请选择展示时间' }]}>
						<DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
 }


