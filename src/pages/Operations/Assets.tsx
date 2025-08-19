import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, Upload, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile, UploadProps } from 'antd'
import dayjs from 'dayjs'
import { PlusOutlined } from '@ant-design/icons'

 type AssetType = '素材' | '话术' | '其他'

 interface AssetRecord {
	id: string
	type: AssetType
	title: string
	content: string
	images: string[]
	organization?: string
	tags: string[]
	createdAt: string
 }

 const STORAGE_KEY = 'operations_assets'

 function nowString() {
	const d = new Date()
	const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
 }

 function defaultAssets(): AssetRecord[] {
	return [
		{ id: 'a1', type: '素材', title: '理想L7限时返现海报', content: '分享海报至朋友圈，吸引意向客户咨询。', images: ['https://via.placeholder.com/600x400?text=Poster+1'], organization: '官方', tags: ['理想', '限时折扣'], createdAt: nowString() },
		{ id: 'a2', type: '话术', title: '试驾邀约话术模板', content: '您好，我是新车顾问，近期我们有试驾活动，欢迎预约体验～', images: [], organization: '太平洋保险', tags: ['邀约', '试驾'], createdAt: nowString() },
	]
 }

 function loadAssets(): AssetRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const parsed: AssetRecord[] = JSON.parse(raw)
			if (Array.isArray(parsed) && parsed.length === 0) {
				const seed = defaultAssets()
				localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
				return seed
			}
			return parsed
		}
		const seed = defaultAssets()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
		return seed
	} catch { return [] }
 }

 function saveAssets(list: AssetRecord[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
 }

 export default function OperationsAssets() {
	const [form] = Form.useForm()
	const [list, setList] = useState<AssetRecord[]>([])
	const [query, setQuery] = useState<{ type?: AssetType; title?: string }>({})
	const [visible, setVisible] = useState(false)
	const [editing, setEditing] = useState<AssetRecord | null>(null)
	const [modalForm] = Form.useForm()

	useEffect(() => { setList(loadAssets()) }, [])
	useEffect(() => { saveAssets(list) }, [list])

	const filtered = useMemo(() => {
		return [...list]
			.filter(i => (query.type ? i.type === query.type : true))
			.filter(i => (query.title ? i.title.includes(query.title) : true))
			.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
	}, [list, query])

	const onSearch = () => {
		const v = form.getFieldsValue()
		setQuery({ type: v.q_type || undefined, title: v.q_title || undefined })
	}

	const onReset = () => {
		form.resetFields()
		setQuery({})
	}

	const openCreate = () => {
		setEditing(null)
		setVisible(true)
		modalForm.resetFields()
		modalForm.setFieldsValue({ type: '素材' as AssetType, tags: [], images: [] })
	}

	const openEdit = (rec: AssetRecord) => {
		setEditing(rec)
		setVisible(true)
		modalForm.resetFields()
		modalForm.setFieldsValue({
			type: rec.type,
			title: rec.title,
			content: rec.content,
			images: rec.images,
			organization: rec.organization,
			tags: rec.tags,
		})
	}

	const submit = async () => {
		try {
			const v = await modalForm.validateFields()
			const payload: AssetRecord = {
				id: editing ? editing.id : `a${Date.now()}`,
				type: v.type as AssetType,
				title: String(v.title),
				content: String(v.content),
				images: (v.images as string[]) || [],
				organization: v.organization ? String(v.organization) : undefined,
				tags: (v.tags as string[]) || [],
				createdAt: editing ? editing.createdAt : nowString(),
			}
			if (editing) {
				setList(prev => prev.map(i => (i.id === editing.id ? payload : i)))
				message.success('更新成功')
			} else {
				setList(prev => [payload, ...prev])
				message.success('创建成功')
			}
			setVisible(false)
		} catch {}
	}

	const remove = (rec: AssetRecord) => {
		setList(prev => prev.filter(i => i.id !== rec.id))
		message.success('已删除')
	}

	function imagesToFileList(imgs: string[]): UploadFile[] {
		return (imgs || []).map((url, idx) => ({ uid: `${idx}`, url, name: `image-${idx}.png`, status: 'done' }))
	}

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
		return false
	}

	function readFileAsBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(String(reader.result))
			reader.onerror = reject
			reader.readAsDataURL(file)
		})
	}

	const handleUploadChange: UploadProps['onChange'] = async (info) => {
		const files = info.fileList
		const images = await Promise.all(files.map(async f => {
			if (f.originFileObj) return await readFileAsBase64(f.originFileObj as File)
			return (f.url as string) || (f.thumbUrl as string) || ''
		}))
		modalForm.setFieldsValue({ images: images.filter(Boolean) })
	}

	const columns: ColumnsType<AssetRecord> = [
		{ title: '序号', render: (_: any, __: AssetRecord, index: number) => index + 1, width: 80 },
		{ title: '类型', dataIndex: 'type' },
		{ title: '标题', dataIndex: 'title' },
		{ title: '图片', dataIndex: 'images', render: (imgs: string[]) => {
			if (!imgs || imgs.length === 0) return '-'
			return (
				<Image.PreviewGroup>
					<Space wrap>
						{imgs.slice(0, 3).map((u, i) => (
							<Image key={i} src={u} width={64} height={64} style={{ objectFit: 'cover' }} />
						))}
						{imgs.length > 3 ? <Tag>+{imgs.length - 3}</Tag> : null}
					</Space>
				</Image.PreviewGroup>
			)
		}},
		{ title: '内容', dataIndex: 'content', render: (v: string) => v.length > 40 ? v.slice(0, 40) + '…' : v },
		{ title: '所属组织', dataIndex: 'organization', render: (v?: string) => v || '-' },
		{ title: '标签', dataIndex: 'tags', render: (tags: string[]) => (tags && tags.length ? <Space wrap>{tags.map((t, i) => <Tag key={i}>{t}</Tag>)}</Space> : '-') },
		{ title: '发布时间', dataIndex: 'createdAt', width: 180 },
		{ title: '操作', width: 180, render: (_: any, r: AssetRecord) => (
			<Space>
				<Button size="small" onClick={() => openEdit(r)}>编辑</Button>
				<Popconfirm title="确定删除该素材？" onConfirm={() => remove(r)}>
					<Button size="small" danger>删除</Button>
				</Popconfirm>
			</Space>
		)},
	]

	return (
		<div className="px-6 py-4 space-y-4">
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold">素材管理</div>
				<Space>
					<Button type="primary" onClick={openCreate} icon={<PlusOutlined />}>新建</Button>
				</Space>
			</div>
			<Card>
				<Form form={form} layout="inline" className="w-full flex flex-wrap gap-3">
					<Form.Item name="q_type" label="类型">
						<Select allowClear placeholder="全部" style={{ width: 200 }} options={[{ value: '素材', label: '素材' }, { value: '话术', label: '话术' }, { value: '其他', label: '其他' }]} />
					</Form.Item>
					<Form.Item name="q_title" label="标题">
						<Input placeholder="支持模糊搜索" allowClear style={{ width: 260 }} />
					</Form.Item>
					<Space>
						<Button type="primary" onClick={onSearch}>查询</Button>
						<Button onClick={onReset}>重置</Button>
					</Space>
				</Form>
			</Card>
			<Card>
				<Table<AssetRecord>
					rowKey="id"
					dataSource={filtered}
					columns={columns}
					pagination={{ pageSize: 10 }}
				/>
			</Card>

			<Modal
				open={visible}
				title={editing ? '编辑素材' : '新建素材'}
				onCancel={() => setVisible(false)}
				onOk={submit}
				okText="保存"
				width={800}
			>
				<Form form={modalForm} layout="vertical">
					<Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
						<Select options={[{ value: '素材', label: '素材' }, { value: '话术', label: '话术' }, { value: '其他', label: '其他' }]} />
					</Form.Item>
					<Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
						<Input maxLength={50} />
					</Form.Item>
					<Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
						<Input.TextArea rows={4} maxLength={1000} />
					</Form.Item>
					<Form.Item label="图片上传">
						<Form.Item name="images" noStyle>
							<Input type="hidden" />
						</Form.Item>
						<Upload
							listType="picture-card"
							multiple
							fileList={imagesToFileList(modalForm.getFieldValue('images') || [])}
							beforeUpload={beforeUpload}
							onChange={handleUploadChange}
						>
							<div>
								<PlusOutlined />
								<div style={{ marginTop: 8 }}>上传</div>
							</div>
						</Upload>
						<div className="text-black/45 text-xs">支持多图，JPG/PNG，单图≤2MB</div>
					</Form.Item>
					<Form.Item name="organization" label="所属组织">
						<Input maxLength={50} placeholder="如：官方、太平洋保险" />
					</Form.Item>
					<Form.Item name="tags" label="标签">
						<Select mode="tags" tokenSeparators={[',', '，']} placeholder="输入后回车添加" style={{ width: '100%' }} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
 }


