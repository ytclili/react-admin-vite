import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { Dashboard } from '../pages/Dashboard'
import { SettingsGeneral } from '../pages/Settings/General'
import { VehicleBrand } from '../pages/VehicleBrand'
import { VehicleModel } from '../pages/VehicleModel'
import { StoreManage } from '../pages/VehicleBrand/StoreManage'
import { SKU } from '../pages/SKU'
// Lazy import for strategies could be considered; keeping simple import path
import Strategies from '../pages/SKU/Strategies'
import { Orders } from '../pages/Orders'
import { OrdersAudit } from '../pages/Orders/Audit'
import { Suppliers } from '../pages/Suppliers'
import SuppliersManage from '../pages/Suppliers/Manage'
import { Users } from '../pages/Users'
import UserDetail from '../pages/Users/Detail'
import { Promoters } from '../pages/Promoters'
import PromoterCommission from '../pages/Promoters/Commission'
import PromoterPartners from '../pages/Promoters/Partners'
import PromoterList from '../pages/Promoters/List'
import PromoterSettlement from '../pages/Promoters/Settlement'
import PromoterDetail from '../pages/Promoters/Detail'
import OperationsBanner from '../pages/Operations/Banner'
import OperationsPush from '../pages/Operations/Push'
import OperationsAssets from '../pages/Operations/Assets'
import OperationsTags from '../pages/Operations/Tags'
import OperationsCopywriting from '../pages/Operations/Copywriting'
import OperationsFeedback from '../pages/Operations/Feedback'
import { Finance } from '../pages/Finance'
import { System } from '../pages/System'

export const router = createBrowserRouter([
	{
		path: '/',
		element: <MainLayout />,
		handle: { breadcrumb: '首页' },
		children: [
			{
				index: true,
				element: <Dashboard />,
				handle: { breadcrumb: '仪表盘' },
			},
			{
				path: 'vehicle',
				handle: { breadcrumb: '车型管理' },
				children: [
					{ path: 'brand', element: <VehicleBrand />, handle: { breadcrumb: '品牌管理' } },
					{ path: 'brand/stores', element: <StoreManage />, handle: { breadcrumb: '门店管理' } },
					{ path: 'model', element: <VehicleModel />, handle: { breadcrumb: '车型管理' } },
				],
			},
			{ path: 'sku', element: <SKU />, handle: { breadcrumb: 'SKU管理' } },
			{ path: 'sku/strategies', element: <Strategies />, handle: { breadcrumb: '管理补贴策略' } },
			{ path: 'orders', element: <Orders />, handle: { breadcrumb: '订单列表' } },
			{ path: 'orders/audit', element: <OrdersAudit />, handle: { breadcrumb: '审核管理' } },
			{ path: 'suppliers', element: <Suppliers />, handle: { breadcrumb: '供应商管理' } },
			{ path: 'suppliers/manage', element: <SuppliersManage />, handle: { breadcrumb: '管理补贴车型' } },
			{ path: 'users', element: <Users />, handle: { breadcrumb: '用户管理' } },
			{ path: 'users/detail', element: <UserDetail />, handle: { breadcrumb: '用户详情' } },
			{ path: 'promoters', element: <Promoters />, handle: { breadcrumb: '推客管理' } },
			{ path: 'promoters/commission', element: <PromoterCommission />, handle: { breadcrumb: '分成策略管理' } },
			{ path: 'promoters/partners', element: <PromoterPartners />, handle: { breadcrumb: '合作方管理' } },
			{ path: 'promoters/list', element: <PromoterList />, handle: { breadcrumb: '推客列表' } },
			{ path: 'promoters/detail', element: <PromoterDetail />, handle: { breadcrumb: '推客详情' } },
			{ path: 'promoters/settlement', element: <PromoterSettlement />, handle: { breadcrumb: '财务结算' } },
			{
				path: 'operations',
				handle: { breadcrumb: '运营管理' },
				children: [
					{ path: 'banner', element: <OperationsBanner />, handle: { breadcrumb: 'Banner管理' } },
					{ path: 'push', element: <OperationsPush />, handle: { breadcrumb: '消息推送' } },
					{ path: 'assets', element: <OperationsAssets />, handle: { breadcrumb: '素材管理' } },
					{ path: 'tags', element: <OperationsTags />, handle: { breadcrumb: '标签管理' } },
					{ path: 'copywriting', element: <OperationsCopywriting />, handle: { breadcrumb: '文案管理' } },
					{ path: 'feedback', element: <OperationsFeedback />, handle: { breadcrumb: '意见反馈' } },
				],
			},
			{ path: 'finance', element: <Finance />, handle: { breadcrumb: '财务中心' } },
			{ path: 'system', element: <System />, handle: { breadcrumb: '系统设置' } },
			{
				path: 'settings',
				handle: { breadcrumb: '设置' },
				children: [
					{
						path: 'general',
						element: <SettingsGeneral />,
						handle: { breadcrumb: '通用设置'},
					},
				],
			},
		],
	},
])


