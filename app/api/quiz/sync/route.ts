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
    const { sessionId, currentStep, ...rawQuizData } = validatedData;

    // 把所有前端传过来的空字符串 "" 转换成 undefined，避免 Prisma 枚举报错
    const cleanQuizData: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawQuizData)) {
      // 先判断它确实是个字符串，再判断它是不是空串或纯空格
      if (typeof value === 'string' && value.trim() === '') {
        cleanQuizData[key] = undefined;
      } else {
        cleanQuizData[key] = value;
      }
    }

    // 利用 Prisma 的事务或嵌套写法保证一致性
    const user = await prisma.user.upsert({
      where: { 
        sessionId: sessionId 
      },
      update: {
        // 即便 User 存在但 QuizSession 丢失，也能自动补齐，不会报 Record Not Found
        quizSession: {
          upsert: {
            update: {
              currentStep,
              ...cleanQuizData,
              updatedAt: new Date(), 
            },
            create: {
              currentStep,
              ...cleanQuizData,
            }
          }
        }
      },
      create: {
        // 用户不存在，初始化 User 和关联记录
        sessionId: sessionId,
        quizSession: {
          create: {
            currentStep,
            ...cleanQuizData
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

    // 依靠底层的 Prisma 引擎自动管理连接池，避免并发情况下的连接丢失报错

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