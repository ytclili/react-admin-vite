import { Layout, Menu, theme, Avatar, Space, Breadcrumb } from 'antd'
import { Outlet, Link, useMatches, useLocation } from 'react-router-dom'
import {
	SettingOutlined,
	DashboardOutlined,
	CarOutlined,
	TagsOutlined,
	ReconciliationOutlined,
	ShopOutlined,
	UserOutlined,
	ShareAltOutlined,
	RocketOutlined,
	AccountBookOutlined,
} from '@ant-design/icons'
import { useMemo, useState, useEffect } from 'react'

const { Header, Content, Sider } = Layout

export const MainLayout = () => {
	const location = useLocation()
	const matches = useMatches()
	const [openKeys, setOpenKeys] = useState<string[]>([])
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken()

	const breadcrumbItems = useMemo(() => {
		return (matches as any[])
			.filter(m => (m as any).handle?.breadcrumb)
			.map((m, idx) => {
				const handle = (m as any).handle as { breadcrumb?: string } | undefined
				const pathname = (m as any).pathname as string | undefined
				return { title: handle!.breadcrumb!, key: `${pathname || idx}` }
			}) as { title: string; key: string }[]
	}, [matches])

	// Calculate selected keys and open keys for menu
	const { selectedKeys, defaultOpenKeys } = useMemo(() => {
		const pathname = location.pathname
		let selected: string[] = []
		let defaultOpen: string[] = []

		// Check for exact matches first
		if (pathname === '/') {
			selected = ['dashboard']
		} else if (pathname.startsWith('/vehicle')) {
			defaultOpen = ['vehicle']
			if (pathname === '/vehicle/brand') {
				selected = ['vehicle-brand']
			} else if (pathname === '/vehicle/brand/stores') {
				selected = ['vehicle-brand-stores']
			} else if (pathname === '/vehicle/model') {
				selected = ['vehicle-model']
			}
		} else if (pathname === '/sku') {
			selected = ['sku']
		} else if (pathname === '/sku/strategies') {
			selected = ['sku-strategies']
		} else if (pathname === '/orders') {
			selected = ['orders-list']
			defaultOpen = ['orders']
		} else if (pathname === '/orders/audit') {
			selected = ['orders-audit']
			defaultOpen = ['orders']
		} else if (pathname === '/suppliers') {
			selected = ['suppliers']
		} else if (pathname === '/users') {
			selected = ['users-list']
			defaultOpen = ['users']
		} else if (pathname === '/users/detail') {
			selected = ['users-detail']
			defaultOpen = ['users']
		} else if (pathname.startsWith('/promoters')) {
			defaultOpen = ['promoters']
			if (pathname === '/promoters/commission') selected = ['promoters-commission']
			else if (pathname === '/promoters/partners') selected = ['promoters-partners']
			else if (pathname === '/promoters/list' || pathname === '/promoters') selected = ['promoters-list']
			else if (pathname === '/promoters/settlement') selected = ['promoters-settlement']
		} else if (pathname.startsWith('/operations')) {
			defaultOpen = ['operations']
			if (pathname === '/operations/banner') selected = ['operations-banner']
			else if (pathname === '/operations/push') selected = ['operations-push']
			else if (pathname === '/operations/assets') selected = ['operations-assets']
			else if (pathname === '/operations/tags') selected = ['operations-tags']
			else if (pathname === '/operations/copywriting') selected = ['operations-copywriting']
			else if (pathname === '/operations/feedback') selected = ['operations-feedback']
		} else if (pathname === '/finance') {
			selected = ['finance']
		} else if (pathname === '/system') {
			selected = ['system']
		} else if (pathname.startsWith('/settings')) {
			defaultOpen = ['settings']
			if (pathname === '/settings/general') {
				selected = ['settings-general']
			}
		}

		return { selectedKeys: selected, defaultOpenKeys: defaultOpen }
	}, [location.pathname])

	// Set initial open keys when component mounts or pathname changes
	useEffect(() => {
		setOpenKeys(defaultOpenKeys)
	}, [defaultOpenKeys])

	const [collapsed, setCollapsed] = useState(false)

	return (
		<Layout style={{ minHeight: '100vh' }}>
			<Sider
				width={256}
				collapsedWidth={64}
				collapsible
				collapsed={collapsed}
				onCollapse={(val) => setCollapsed(val)}
				style={{ background: '#FFFFFF', borderRight: '1px solid #F0F0F0' }}
			>
				<div className="px-6 py-4 border-b border-[#F0F0F0] bg-white">
					<div className="text-lg font-semibold text-black/90">新车帮买</div>
				</div>
				<Menu
					theme="light"
					mode="inline"
					selectedKeys={selectedKeys}
					openKeys={openKeys}
					onOpenChange={setOpenKeys}
					items={[
						{ key: 'dashboard', icon: <DashboardOutlined />, label: <Link to="/">数据看板</Link> },
						{
							key: 'vehicle',
							icon: <CarOutlined />,
							label: '车型管理',
							children: [
								{ key: 'vehicle-brand', label: <Link to="/vehicle/brand">品牌管理</Link> },
								{ key: 'vehicle-model', label: <Link to="/vehicle/model">车型管理</Link> },
							],
						},
						{ key: 'sku', icon: <TagsOutlined />, label: <Link to="/sku">SKU管理</Link> },
						{
							key: 'orders',
							icon: <ReconciliationOutlined />,
							label: '订单管理',
							children: [
								{
									key: 'orders-list',
									label: <Link to="/orders">订单列表</Link>,
								},
								{
									key: 'orders-audit',
									label: <Link to="/orders/audit">审核管理</Link>,
								},
							],
						},
						{ key: 'suppliers', icon: <ShopOutlined />, label: <Link to="/suppliers">供应商管理</Link> },
						{
							key: 'users',
							icon: <UserOutlined />,
							label: '用户管理',
							children: [
								{ key: 'users-list', label: <Link to="/users">用户列表</Link> },
							],
						},
						{
							key: 'promoters',
							icon: <ShareAltOutlined />,
							label: '推客管理',
							children: [
								{ key: 'promoters-commission', label: <Link to="/promoters/commission">分成策略管理</Link> },
								{ key: 'promoters-partners', label: <Link to="/promoters/partners">合作方管理</Link> },
								{ key: 'promoters-list', label: <Link to="/promoters/list">推客列表</Link> },
								{ key: 'promoters-settlement', label: <Link to="/promoters/settlement">财务结算</Link> },
							],
						},
						{
							key: 'operations',
							icon: <RocketOutlined />,
							label: '运营管理',
							children: [
								{ key: 'operations-banner', label: <Link to="/operations/banner">Banner管理</Link> },
								{ key: 'operations-push', label: <Link to="/operations/push">消息推送</Link> },
								{ key: 'operations-assets', label: <Link to="/operations/assets">素材管理</Link> },
								{ key: 'operations-tags', label: <Link to="/operations/tags">标签管理</Link> },
								{ key: 'operations-copywriting', label: <Link to="/operations/copywriting">文案管理</Link> },
								{ key: 'operations-feedback', label: <Link to="/operations/feedback">意见反馈</Link> },
							],
						},
						{ key: 'finance', icon: <AccountBookOutlined />, label: <Link to="/finance">财务中心</Link> },
						{ key: 'system', icon: <SettingOutlined />, label: <Link to="/system">系统设置</Link> },
						{
							key: 'settings',
							icon: <SettingOutlined />,
							label: '设置',
							children: [
								{ key: 'settings-general', label: <Link to="/settings/general">通用设置</Link> },
							],
						},
					]}
				/>
			</Sider>
			<Layout>
				<Header style={{ background: '#FFFFFF', borderBottom: '1px solid #F0F0F0' }} className="px-6">
					<div className="flex items-center justify-between">
						<Breadcrumb items={breadcrumbItems} />
						<Space size={12}>
							<Avatar size={32}>管</Avatar>
							<span className="text-black/88">管理员</span>
						</Space>
					</div>
				</Header>
				<Content style={{ margin: 0, background: '#F5F8FA' }}>
					<div
						style={{ margin: '16px', padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}
					>
						<Outlet />
					</div>
				</Content>
			</Layout>
		</Layout>
	)
}


