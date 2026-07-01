import { z } from 'zod';


// 基础枚举校验
export const GenderEnum = z.enum(["MALE", "FEMALE", "OTHER"], {
  errorMap: () => ({ message: "非法的性别选项" })
});

export const ExerciseFreqEnum = z.enum(["RARELY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"], {
  errorMap: () => ({ message: "非法的运动频率选项" })
});

// 分步保存 (Sync) 的请求体校验
export const SyncQuizSchema = z.object({
  // sessionId 是前后端身份认定的唯一凭证
  sessionId: z.string().uuid({ message: "无效的 Session ID 格式" }),
  
  currentStep: z.number().int().min(1, { message: "步骤数不能小于 1" }),

  // 增量业务字段：利用 .optional() 支持单步更新
  gender: GenderEnum.optional(),
  
  age: z.number().int()
    .min(12, { message: "年龄需大于 12 岁" })
    .max(100, { message: "年龄数值异常" })
    .optional(),
    
  height: z.number()
    .min(100, { message: "身高数值异常 (低于 100cm)" })
    .max(250, { message: "身高数值异常 (高于 250cm)" })
    .optional(),
    
  weight: z.number()
    .min(30, { message: "体重数值异常 (低于 30kg)" })
    .max(300, { message: "体重数值异常 (高于 300kg)" })
    .optional(),
    
  targetWeight: z.number()
    .min(30, { message: "目标体重数值异常 (低于 30kg)" })
    .max(300, { message: "目标体重数值异常 (高于 300kg)" })
    .optional(),
    
  exerciseFreq: ExerciseFreqEnum.optional(),
})

// 算法计算 (Calculate) 的请求体校验
// 确保存储在库里的数据是完整的，才能触发核心算法
export const CalculatePayloadSchema = z.object({
  sessionId: z.string().uuid(),
});

// 导出推导出的 TypeScript 类型，供 API Route 和前端共用
export type SyncQuizPayload = z.infer<typeof SyncQuizSchema>;
export type CalculatePayload = z.infer<typeof CalculatePayloadSchema>;