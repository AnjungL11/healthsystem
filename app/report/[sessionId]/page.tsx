'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Flame, Droplets, Target, AlertCircle } from 'lucide-react';

export default function ReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch('/api/quiz/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        
        const json = await res.json();
        
        if (!json.success) {
          setError(json.error || '无法获取报告数据');
          return;
        }
        
        setReportData(json.data.fullMetrics);
      } catch (err) {
        setError('网络请求失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E76F51]"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF4]">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-[#F0EAE1]">
          <AlertCircle className="w-12 h-12 text-[#E76F51] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#2B211E] mb-2">报告加载失败</h2>
          <p className="text-[#5C4D47]">{error}</p>
        </div>
      </div>
    );
  }

  const { overview, nutrition, forecast } = reportData;

  return (
    <div className="min-h-screen bg-[#FCFAF4] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* 头部标题区 */}
        <div className="text-center pt-4">
          <h1 className="text-4xl md:text-5xl font-black text-[#2B211E] tracking-tight">
            您的健康计划已准备就绪！
          </h1>
          <p className="mt-4 text-lg text-[#5C4D47]">
            基于你的体征数据科学推演，达成目标预计需要 <span className="font-bold text-[#E76F51] text-xl px-1">{forecast.daysToGoal}</span> 天
          </p>
        </div>

        {/* 核心指标网格 (4格) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0EAE1] flex flex-col items-center transition-transform hover:-translate-y-1">
            <Activity className="w-8 h-8 text-[#E76F51] mb-3" />
            <p className="text-sm text-[#5C4D47] font-medium">当前 BMI</p>
            <p className="text-3xl font-black text-[#2B211E] mt-1">{overview.bmi}</p>
            <span className={`mt-3 px-4 py-1 text-xs rounded-full font-bold ${
              overview.bmiCategory === '标准' ? 'bg-[#EAF3EA] text-[#2E7D32]' : 'bg-[#FFF0E6] text-[#E76F51]'
            }`}>
              {overview.bmiCategory}
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0EAE1] flex flex-col items-center transition-transform hover:-translate-y-1">
            <Flame className="w-8 h-8 text-[#F4A261] mb-3" />
            <p className="text-sm text-[#5C4D47] font-medium">基础代谢 (BMR)</p>
            <p className="text-3xl font-black text-[#2B211E] mt-1">{overview.bmr} <span className="text-sm text-[#5C4D47] font-normal">kcal</span></p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0EAE1] flex flex-col items-center transition-transform hover:-translate-y-1">
            <Target className="w-8 h-8 text-[#2A9D8F] mb-3" />
            <p className="text-sm text-[#5C4D47] font-medium">建议每日摄入</p>
            <p className="text-3xl font-black text-[#2B211E] mt-1">{nutrition.dailyCalories} <span className="text-sm text-[#5C4D47] font-normal">kcal</span></p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F0EAE1] flex flex-col items-center transition-transform hover:-translate-y-1">
            <Droplets className="w-8 h-8 text-[#457B9D] mb-3" />
            <p className="text-sm text-[#5C4D47] font-medium">建议饮水量</p>
            <p className="text-3xl font-black text-[#2B211E] mt-1">{nutrition.waterIntake} <span className="text-sm text-[#5C4D47] font-normal">ml</span></p>
          </div>
        </div>

        {/* 宏量营养素与图表布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左侧：宏量营养素分配 */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-sm border border-[#F0EAE1]">
            <h3 className="text-xl font-bold text-[#2B211E] mb-8">每日营养素分配</h3>
            <div className="space-y-7">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-[#5C4D47]">碳水化合物</span>
                  <span className="text-[#2B211E]">{nutrition.macros.carbs}g</span>
                </div>
                <div className="w-full bg-[#F5F1E8] rounded-full h-3">
                  <div className="bg-[#E76F51] h-3 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-[#5C4D47]">蛋白质</span>
                  <span className="text-[#2B211E]">{nutrition.macros.protein}g</span>
                </div>
                <div className="w-full bg-[#F5F1E8] rounded-full h-3">
                  <div className="bg-[#F4A261] h-3 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-[#5C4D47]">脂肪</span>
                  <span className="text-[#2B211E]">{nutrition.macros.fat}g</span>
                </div>
                <div className="w-full bg-[#F5F1E8] rounded-full h-3">
                  <div className="bg-[#E9C46A] h-3 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-10 p-5 bg-[#FCFAF4] rounded-2xl border border-[#F0EAE1]">
              <p className="text-sm text-[#5C4D47] leading-relaxed font-medium">
                严格遵循以上宏量营养素摄入，能最大程度保证你在达成目标的过程中不流失肌肉。
              </p>
            </div>
          </div>

          {/* 右侧：预测曲线图 */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-[#F0EAE1]">
            <h3 className="text-xl font-bold text-[#2B211E] mb-6">体重预测曲线 (12周)</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast.projection} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EBE5DA" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={(value) => `第${value}周`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8A7A73', fontSize: 13, fontWeight: 500 }}
                    dy={15}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8A7A73', fontSize: 13, fontWeight: 500 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #F0EAE1', 
                      boxShadow: '0 10px 15px -3px rgba(43, 33, 30, 0.05)',
                      backgroundColor: '#FFFFFF',
                      color: '#2B211E',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#E76F51' }}
                    formatter={(value: any) => [`${value} kg`, '预测体重']}
                    labelFormatter={(label: any) => `第 ${label} 周`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projectedWeight" 
                    stroke="#E76F51" 
                    strokeWidth={4}
                    dot={{ r: 5, fill: '#FFFFFF', strokeWidth: 3, stroke: '#E76F51' }}
                    activeDot={{ r: 8, fill: '#E76F51', stroke: '#FFFFFF', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}