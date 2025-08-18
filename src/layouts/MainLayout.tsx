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
import { useMemo, useState } from 'react'

const { Header, Content, Sider } = Layout

export const MainLayout = () => {
	const location = useLocation()
	const matches = useMatches()
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken()

	const breadcrumbItems = useMemo(() => {
		return (matches as any[])
			.map((m, idx) => {
				const handle = (m as any).handle as { breadcrumb?: string } | undefined
				const pathname = (m as any).pathname as string | undefined
				if (!handle?.breadcrumb) return null
				return { title: handle.breadcrumb!, key: `${pathname || idx}` }
			})
			.filter(Boolean) as { title: string; key: string }[]
	}, [matches])

	const selectedKeys = useMemo(() => {
		if (location.pathname.startsWith('/vehicle/brand')) return ['vehicle-brand']
		if (location.pathname.startsWith('/vehicle/model')) return ['vehicle-model']
		if (location.pathname.startsWith('/sku')) return ['sku']
		if (location.pathname.startsWith('/orders')) return ['orders']
		if (location.pathname.startsWith('/suppliers')) return ['suppliers']
		if (location.pathname.startsWith('/users')) return ['users']
		if (location.pathname.startsWith('/promoters')) return ['promoters']
		if (location.pathname.startsWith('/operations')) return ['operations']
		if (location.pathname.startsWith('/finance')) return ['finance']
		if (location.pathname.startsWith('/system')) return ['system']
		if (location.pathname.startsWith('/settings')) return ['settings']
		return ['dashboard']
	}, [location.pathname])

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
						{ key: 'orders', icon: <ReconciliationOutlined />, label: <Link to="/orders">订单管理</Link> },
						{ key: 'suppliers', icon: <ShopOutlined />, label: <Link to="/suppliers">供应商管理</Link> },
						{ key: 'users', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
						{ key: 'promoters', icon: <ShareAltOutlined />, label: <Link to="/promoters">推客管理</Link> },
						{ key: 'operations', icon: <RocketOutlined />, label: <Link to="/operations">运营管理</Link> },
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
					<div className="flex items-center justify-end">
						<Space size={12}>
							<Avatar size={32}>管</Avatar>
							<span className="text-black/88">管理员</span>
						</Space>
					</div>
				</Header>
				<Content style={{ margin: 0, background: '#F5F8FA' }}>
					<div style={{ margin: '16px 16px 0 16px' }}>
						<Breadcrumb items={breadcrumbItems.map((i) => ({ title: i.title }))} />
					</div>
					<div
						style={{ margin: '8px 16px 16px 16px', padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}
					>
						<Outlet />
					</div>
				</Content>
			</Layout>
		</Layout>
	)
}


