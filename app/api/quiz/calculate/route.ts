export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CalculatePayloadSchema } from '@/lib/validations';

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

    // 边界检查：确保必填数据都已经填完了，否则无法计算
    if (!qs.age || !qs.height || !qs.weight || !qs.targetWeight || !qs.gender) {
      return NextResponse.json({ 
        success: false, 
        error: '测评数据不完整，请先完成前置问卷' 
      }, { status: 422 }); // 422 Unprocessable Entity
    }

    // 动态引入算法 (避免文件顶层的依赖冲突)
    const { calculateHealthMetrics } = await import('@/lib/algorithm');

    // 执行核心算法
    const metrics = calculateHealthMetrics({
      gender: qs.gender,
      age: qs.age,
      height: qs.height,
      weight: qs.weight,
      targetWeight: qs.targetWeight,
      exerciseFreq: qs.exerciseFreq || 'RARELY',
    });

    // 返回计算结果给前端展示
    return NextResponse.json({
      success: true,
      message: '计算完成',
      data: metrics
    }, { status: 200 });

  } catch (error) {
    console.error('[Quiz Calculate Error]:', error);
    return NextResponse.json({
      success: false,
      error: '计算引擎发生内部错误'
    }, { status: 500 });
  }
}