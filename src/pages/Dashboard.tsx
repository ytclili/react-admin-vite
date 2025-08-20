import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const Card: React.FC<{ title: React.ReactNode; extra?: React.ReactNode; children?: React.ReactNode }> = ({ title, extra, children }) => {
	return (
		<div className="bg-white rounded-lg border border-[#F0F0F0] overflow-hidden">
			<div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0]">
				<div className="flex items-center gap-2 text-black/88 text-base font-medium">{title}</div>
				<div className="text-[#00BD97]">{extra}</div>
			</div>
			<div className="p-6">{children}</div>
		</div>
	)
}

function useLineChart(
	containerRef: React.RefObject<HTMLDivElement | null>,
	data: number[],
	dates: string[],
	color = '#00BD97',
	withArea = false,
) {
	useEffect(() => {
		if (!containerRef.current) return
		const chart = echarts.init(containerRef.current)
		chart.setOption({
			color: [color],
			tooltip: {
				trigger: 'axis',
				appendToBody: true,
				backgroundColor: 'rgba(255,255,255,0.95)',
				borderColor: '#E5E6EB',
				borderWidth: 1,
				textStyle: { color: '#1D2129' },
				axisPointer: { type: 'line', lineStyle: { color } },
			},
			grid: { left: 36, right: 12, top: 12, bottom: 24 },
			xAxis: { type: 'category', boundaryGap: false, data: dates, axisLine: { lineStyle: { color: '#E5E6EB' } }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 12 } },
			yAxis: { type: 'value', min: 0, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 12 }, splitLine: { lineStyle: { color: '#F0F0F0' } } },
			series: [{
				data,
				type: 'line',
				smooth: true,
				smoothMonotone: 'x',
				symbol: 'circle',
				symbolSize: 4,
				emphasis: { focus: 'series', scale: true },
				lineStyle: { color, width: 2 },
				itemStyle: { color, borderColor: color, borderWidth: 2 },
				areaStyle: withArea
					? {
						color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: 'rgba(0,189,151,0.25)' },
							{ offset: 1, color: 'rgba(0,189,151,0.00)' },
						]),
					}
					: undefined,
			}],
		})
		const onResize = () => chart.resize()
		window.addEventListener('resize', onResize)
		return () => {
			window.removeEventListener('resize', onResize)
			chart.dispose()
		}
	}, [containerRef, data.join(','), dates.join(','), color, withArea])
}

function useBarChart(
	containerRef: React.RefObject<HTMLDivElement | null>,
	data: number[],
	dates: string[],
	color = '#00BD97',
) {
	useEffect(() => {
		if (!containerRef.current) return
		const chart = echarts.init(containerRef.current)
		chart.setOption({
			color: [color],
			tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
			grid: { left: 36, right: 12, top: 12, bottom: 24 },
			xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E5E6EB' } }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 12 } },
			yAxis: { type: 'value', min: 0, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 12 }, splitLine: { lineStyle: { color: '#F0F0F0' } } },
			series: [{ type: 'bar', data, barWidth: 10, itemStyle: { borderRadius: [3, 3, 0, 0] } }],
		})
		const onResize = () => chart.resize()
		window.addEventListener('resize', onResize)
		return () => {
			window.removeEventListener('resize', onResize)
			chart.dispose()
		}
	}, [containerRef, data.join(','), dates.join(','), color])
}

export const Dashboard = () => {
	const navigate = useNavigate()
	const dates = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM/DD'))
	const leftRef = useRef<HTMLDivElement | null>(null)
	const rightRef = useRef<HTMLDivElement | null>(null)
	const bottomLeftRef = useRef<HTMLDivElement | null>(null)
	const financeRef = useRef<HTMLDivElement | null>(null)
	useBarChart(leftRef, [120, 180, 160, 90, 85, 110, 128], dates)
	useLineChart(rightRef, [60, 95, 120, 80, 140, 130, 150], dates, '#00BD97', true)
	useLineChart(bottomLeftRef, [80, 120, 90, 130, 100, 140, 160], dates, '#00BD97', true)

	useEffect(() => {
		if (!financeRef.current) return
		const chart = echarts.init(financeRef.current)
		const option: echarts.EChartsOption = {
			color: ['#00BD97', '#52C41A'],
			tooltip: { trigger: 'item', appendToBody: true },
			series: [
				{
					type: 'pie',
					radius: ['65%', '85%'],
					center: ['32%', '50%'],
					itemStyle: { borderColor: '#fff', borderWidth: 2 },
					label: { show: false },
					data: [
						{ value: 548920, name: '应收账款' },
						{ value: 396850, name: '应付账款' },
					],
				},
			],
		}
		chart.setOption(option)
		const onResize = () => chart.resize()
		window.addEventListener('resize', onResize)
		return () => {
			window.removeEventListener('resize', onResize)
			chart.dispose()
		}
	}, [])

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end text-black/45">
				<div>数据更新时间: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
				<Card title={<span className="flex items-center gap-2">订单看板</span>} extra={
					<button 
						className="text-[#00BD97] hover:text-[#00A085] transition-colors cursor-pointer"
						onClick={() => navigate('/orders')}
					>
						查看更多
					</button>
				}>
					<div className="flex items-center gap-12">
						<div className="space-y-2">
							<div className="text-black/45">今日新增订单</div>
							<div className="text-[#00BD97] text-2xl">124</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">本月累计订单</div>
							<div className="text-[#52C41A] text-2xl">2,567</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">待购车订单</div>
							<div className="text-[#FAAD14] text-2xl">46</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">待审核订单</div>
							<div className="text-[#FF4D4F] text-2xl">35</div>
						</div>
					</div>
					<div className="mt-4 text-[#666]">近30天佣金支出趋势</div>
					<div ref={leftRef as any} style={{ width: '100%', height: 180 }} />
				</Card>

				<Card title={<span className="flex items-center gap-2">用户看板</span>} extra={
					<button 
						className="text-[#00BD97] hover:text-[#00A085] transition-colors cursor-pointer"
						onClick={() => navigate('/users')}
					>
						查看更多
					</button>
				}>
					<div className="flex items-center gap-12">
						<div className="space-y-2">
							<div className="text-black/45">总用户数</div>
							<div className="text-[#00BD97] text-2xl">45,821</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">今日新增用户</div>
							<div className="text-[#00BD97] text-2xl">187</div>
						</div>
						<div className="spacey-2">
							<div className="text-black/45">昨日活跃用户</div>
							<div className="text-[#00BD97] text-2xl">1,265</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">月活跃用户</div>
							<div className="text-[#00BD97] text-2xl">12,489</div>
						</div>
					</div>
					<div className="mt-4 text-[#666]">近30天订单量趋势</div>
					<div ref={rightRef as any} style={{ width: '100%', height: 180 }} />
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
				<Card title={<span className="flex items-center gap-2">推客看板</span>} extra={
					<button 
						className="text-[#00BD97] hover:text-[#00A085] transition-colors cursor-pointer"
						onClick={() => navigate('/promoters/list')}
					>
						查看更多
					</button>
				}>
					<div className="flex items-center gap-12">
						<div className="space-y-2">
							<div className="text-black/45">总推客数</div>
							<div className="text-[#00BD97] text-2xl">1,284</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">本月新增推客</div>
							<div className="text-[#00BD97] text-2xl">97</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">本月活跃推客</div>
							<div className="text-[#00BD97] text-2xl">586</div>
						</div>
						<div className="space-y-2">
							<div className="text-black/45">已结算佣金</div>
							<div className="text-[#00BD97] text-2xl">¥145,892</div>
						</div>
					</div>
					<div className="mt-4 text-[#666]">近30天新增用户趋势</div>
					<div ref={bottomLeftRef as any} style={{ width: '100%', height: 180 }} />
				</Card>

				<Card title={<span className="flex items-center gap-2">财务看板</span>} extra={
					<button 
						className="text-[#00BD97] hover:text-[#00A085] transition-colors cursor-pointer"
						onClick={() => navigate('/finance/overview')}
					>
						查看更多
					</button>
				}>
					<div className="flex items-start gap-6">
						<div ref={financeRef as any} style={{ width: 260, height: 200 }} />
						<div className="space-y-4">
							<div>
								<div className="text-black/45">本月应收账款</div>
								<div className="text-[#00BD97] text-2xl">¥548,920</div>
							</div>
							<div>
								<div className="text-black/45">本月应付账款</div>
								<div className="text-[#52C41A] text-2xl">¥396,850</div>
							</div>
							<div>
								<div className="text-black/45">本月预估利润</div>
								<div className="text-[#FF4D4F] text-2xl">¥152,070</div>
							</div>
						</div>
					</div>
					<div className="mt-4 flex justify-center">
						<button 
							className="px-4 py-2 bg-[#00BD97] text-white rounded-md hover:bg-[#00A085] transition-colors"
							onClick={() => navigate('/finance/overview')}
						>
							进入财务中心
						</button>
					</div>
				</Card>
			</div>
		</div>
	)
}


