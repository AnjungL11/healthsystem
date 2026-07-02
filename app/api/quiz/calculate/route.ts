export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CalculatePayloadSchema } from '@/lib/validations';
import { calculateHealthMetrics } from '@/lib/algorithm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 校验传入的 sessionId
    const parseResult = CalculatePayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: '缺少有效的 sessionId' }, { status: 400 });
    }

    const { sessionId } = parseResult.data;

    // 从数据库捞取用户的完整身体数据
    const user = await prisma.user.findUnique({
      where: { sessionId },
      include: { quizSession: true }
    });

    if (!user || !user.quizSession) {
      return NextResponse.json({ success: false, error: '未找到该用户的测评数据' }, { status: 404 });
    }

    const qs = user.quizSession;

    // 边界检查
    if (!qs.age || !qs.height || !qs.weight || !qs.targetWeight || !qs.gender) {
      return NextResponse.json({ 
        success: false, 
        error: '测评数据不完整，请先完成前置问卷' 
      }, { status: 422 });
    }

    // 执行核心算法
    const metrics = calculateHealthMetrics({
      gender: qs.gender,
      age: qs.age,
      height: qs.height,
      weight: qs.weight,
      targetWeight: qs.targetWeight,
      exerciseFreq: qs.exerciseFreq || 'RARELY',
    });

    // 将 daysToGoal 转换为具体的 TargetDate (目标达成日期)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + metrics.forecast.daysToGoal);

    // 更新 Quiz 状态为 COMPLETED，并 upsert 写入 AssessmentResult
    const updatedSession = await prisma.quizSession.update({
      where: { id: qs.id },
      data: {
        status: 'COMPLETED',
        assessmentResult: {
          upsert: {
            create: {
              bmi: metrics.overview.bmi,
              recommendedCalories: metrics.nutrition.dailyCalories,
              targetDate: targetDate,
              predictionCurve: metrics.forecast.projection, 
            },
            update: {
              bmi: metrics.overview.bmi,
              recommendedCalories: metrics.nutrition.dailyCalories,
              targetDate: targetDate,
              predictionCurve: metrics.forecast.projection,
            }
          }
        }
      },
      include: {
        assessmentResult: true
      }
    });

    return NextResponse.json({
      success: true,
      message: '健康评估报告生成且保存成功',
      data: {
        fullMetrics: metrics, 
        resultId: updatedSession.assessmentResult?.id 
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[Quiz Calculate Error]:', error);
    return NextResponse.json({
      success: false,
      error: '计算引擎发生内部错误'
    }, { status: 500 });
  }
}