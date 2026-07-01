export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SyncQuizSchema } from '@/lib/validations';
import { z } from 'zod';

export async function POST(request: Request) {

  try {
    // 解析请求体
    const body = await request.json();

    // Zod 校验边界
    const validatedData = SyncQuizSchema.parse(body);

    const { sessionId, currentStep, ...quizData } = validatedData;

    // 利用 Prisma 的事务或嵌套写法保证 User 和 Session 的一致性
    // 基于 sessionId 查找
    const user = await prisma.user.upsert({
      where: { 
        sessionId: sessionId 
      },
      update: {
        // 用户已存在，更新关联的 QuizSession 增量数据
        quizSession: {
          update: {
            currentStep,
            ...quizData,
            updatedAt: new Date(), // 显式更新时间
          }
        }
      },
      create: {
        // 用户不存在，初始化 User 和关联记录
        sessionId: sessionId,
        quizSession: {
          create: {
            currentStep,
            ...quizData
          }
        },
        // 同时初始化一个未激活的订阅状态
        subscription: {
          create: {
            status: 'INACTIVE'
          }
        }
      },
      // 将更新或创建后的完整 quizSession 返回，用于前端状态恢复
      include: {
        quizSession: true
      }
    });

    // 成功操作完成后手动断开临时连接
    await prisma.$disconnect();

    // 返回成功响应与最新的持久化数据
    return NextResponse.json({
      success: true,
      data: {
        sessionId: user.sessionId,
        quizSession: user.quizSession
      },
      message: '进度同步成功'
    }, { status: 200 });

  } catch (error: unknown) {
    // 发生异常时也要确保断开连接，避免连接泄露
    await prisma.$disconnect();

    // 统一异常处理
    if (error instanceof z.ZodError) {
      // 捕获 Zod 校验错误，返回 400 Bad Request
      return NextResponse.json({
        success: false,
        error: '数据格式错误',
        details: error.issues.map((e: z.ZodIssue) => ({ 
          path: e.path.join('.'), 
          message: e.message 
        }))
      }, { status: 400 });
    }

    console.error('[Quiz Sync Error]:', error);
    
    // 捕获数据库或其他未知错误，返回 500
    return NextResponse.json({
      success: false,
      error: '服务器内部错误，无法保存进度'
    }, { status: 500 });
  }
}