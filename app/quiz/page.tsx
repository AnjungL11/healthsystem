'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

// ==========================================
// 💡 定义问卷结构体
// ==========================================

const SECTION_SUBHEADINGS: Record<string, string> = {
  PROFILE: '个人资料',
  ACTIVITY: '活动',
  LIFESTYLE: '生活方式与习惯',
  NUTRITION: '营养',
  FINAL: '其他，快结束了'
};

type Option = { 
  id: string; 
  label: string; 
  icon?: React.ReactNode; 
  imgUrl?: string; 
};

type Question = {
  id: string;
  section: 'PROFILE' | 'ACTIVITY' | 'LIFESTYLE' | 'NUTRITION' | 'FINAL';
  title: string;
  subTitle?: string;
  type: 'single' | 'multiple' | 'input' | 'image-single';
  options?: Option[];
  
  field?: string;
  unit?: string;
  placeholder?: string;
  constraintText?: string;
  minValue?: number;
  maxValue?: number;
  eligibilityCheck?: (value: number) => boolean;
  calcBelowBox?: boolean;
  errorMessage?: string;

  imgUrl?: string; 
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------------------------------------
// 💡 核心组件
// ---------------------------------------------------------------------------------------------------------

export default function BetterMeQuizFunnel() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    gender: '', triedPilates: '', mainGoal: '', subGoals: [], describeBodyType: '', dreamBodyType: '', weightFluxType: '', bestShapeWhen: '',
    flexibilityLevel: '', exerciseFreq: '', targetAreas: [], stairBreathlessness: '', difficultiesIn: [], walkingFreq: '', triedAccessories: '', usedAccessories: [], accessoryConcern: [],
    workSchedule: '', typicalDayDesc: '', energyLevelByDay: '', waterHabit: '', sleepHours: '',
    breakfastTime: '', lunchTime: '', dinnerTime: '', dietType: '', badHabits: [],
    weightGainEvents: [], height: undefined, weight: undefined, targetWeight: undefined, age: undefined
  });

  // 💡 题库全面升级：包含性别(BMR必须)、稳定的 Picsum 图片、完美的中文翻译
  const QUIZ_STEPS: Question[] = [
    // --- PART 1: 个人资料 ---
    { id: 'gender', section: 'PROFILE', type: 'single', title: '你的性别是？', 
      options: [{ id: 'FEMALE', label: '👩 女性' }, { id: 'MALE', label: '👨 男性' }] 
    },
    { id: 'triedPilates', section: 'PROFILE', type: 'single', title: '你以前尝试过普拉提锻炼吗？', imgUrl: 'https://picsum.photos/seed/pilates/600/800',
      options: [{ id: 'YES', label: '是的，我尝试过' }, { id: 'NO', label: '没有，从来没有' }]
    },
    { id: 'mainGoal', section: 'PROFILE', type: 'single', title: '你的主要目标是什么？', options: [{ id: 'LOSE_WEIGHT', label: '减肥' }, { id: 'MAINTAIN', label: '保持体重并保持健康' }] },
    { id: 'subGoals', section: 'PROFILE', type: 'multiple', title: '你还希望通过这个计划实现什么目标？', subTitle: '请选择所有适用项',
      options: [
        { id: 'BULK_MUSCLE', label: '增强肌肉力量' }, { id: 'IMPROVE_POSTURE', label: '改善体态' },
        { id: 'REDUCE_STRESS', label: '减轻压力和焦虑' }, { id: 'FLEXIBILITY', label: '锻炼柔韧性' }, { id: 'NONE', label: '以上都不是' }
      ]
    },
    { id: 'describeBodyType', section: 'PROFILE', type: 'image-single', title: '你如何描述自己的体型？', 
      options: [
        { id: 'THIN', label: '瘦的', imgUrl: 'https://picsum.photos/seed/thin1/300/400' }, 
        { id: 'AVERAGE', label: '中等身材的', imgUrl: 'https://picsum.photos/seed/average1/300/400' }, 
        { id: 'CHUBBY', label: '偏胖的', imgUrl: 'https://picsum.photos/seed/chubby1/300/400' }, 
        { id: 'OVERWEIGHT', label: '体重超标', imgUrl: 'https://picsum.photos/seed/overweight1/300/400' }
      ] 
    },
    { id: 'dreamBodyType', section: 'PROFILE', type: 'image-single', title: '你梦想中的身材是什么样的？', 
      options: [
        { id: 'THIN_TONED', label: '苗条 (Thin)', imgUrl: 'https://picsum.photos/seed/thin2/300/400' }, 
        { id: 'TONED', label: '紧致 (Toned)', imgUrl: 'https://picsum.photos/seed/toned2/300/400' }, 
        { id: 'CURVY', label: '玲珑有致 (Curvy)', imgUrl: 'https://picsum.photos/seed/curvy2/300/400' }, 
        { id: 'AVERAGE_FIT', label: '匀称 (Average)', imgUrl: 'https://picsum.photos/seed/average2/300/400' }
      ] 
    },
    { id: 'weightFluxType', section: 'PROFILE', type: 'single', title: '你的体重通常会有怎样的变化？', 
      options: [{ id: 'GAIN_SLOW_LOSE', label: '我增重很快，但减肥很慢' }, { id: 'EASY_BOTH', label: '我很容易增重和减肥' }, { id: 'HARD_BOTH', label: '我很难增重或增肌' }] 
    },
    { id: 'bestShapeWhen', section: 'PROFILE', type: 'single', title: '你人生中身体状态最佳的时候是什么时候？', 
      options: [{ id: 'LESS_1YR', label: '不到一年前' }, { id: '1_2YRS', label: '1-2年前' }, { id: '3YRS_PLUS', label: '3年以上之前' }, { id: 'NEVER', label: '从来没有过' }] 
    },

    // --- PART 2: 活动 ---
    { id: 'flexibilityLevel', section: 'ACTIVITY', type: 'single', title: '你的柔韧性如何？', 
      options: [{ id: 'EXCELLENT', label: '很好' }, { id: 'FAIR', label: '一般' }, { id: 'POOR', label: '不太好' }, { id: 'NOT_SURE', label: '没有把握' }] 
    },
    { id: 'exerciseFreq', section: 'ACTIVITY', type: 'single', title: '你多久锻炼一次？', 
      options: [{ id: 'ACTIVE', label: '几乎每天' }, { id: 'MODERATE', label: '每周数次' }, { id: 'LIGHT', label: '每月数次' }, { id: 'RARELY', label: '从不' }] 
    },
    { id: 'targetAreas', section: 'ACTIVITY', type: 'multiple', title: '您的目标区域是什么？', subTitle: '请选择所有适用项',
      options: [
        { id: 'BELLY', label: '腹部' }, { id: 'LEGS', label: '腿部' }, { id: 'GLUTES', label: '臀部' },
        { id: 'CHEST', label: '胸部' }, { id: 'ARMS', label: '手臂' }, { id: 'BACK', label: '背部' }
      ]
    },
    { id: 'stairBreathlessness', section: 'ACTIVITY', type: 'single', title: '你走楼梯时会气喘吁吁吗？', 
      options: [
        { id: 'VERY_BREATHLESS', label: '我会喘不上气，说不出话' },
        { id: 'LIGHTLY_BREATHLESS', label: '轻微喘气，还是可以说话' },
        { id: 'FEEL_GOOD', label: '走一趟以后感觉良好' },
        { id: 'MULTIPLE_TRIPS', label: '可以一口气走很多趟' }
      ]
    },
    { id: 'difficultiesIn', section: 'ACTIVITY', type: 'multiple', title: '你在以下任何方面遇到困难吗？', subTitle: '请选择所有适用项',
      options: [{ id: 'LOWER_BACK', label: '腰部敏感' }, { id: 'KNEES', label: '膝盖敏感' }, { id: 'NONE', label: '以上都没有' }] 
    },
    { id: 'walkingFreq', section: 'ACTIVITY', type: 'single', title: '你多久散步一次？', 
      options: [{ id: 'DAILY', label: '几乎每天' }, { id: 'WEEK_3_4', label: '每周3-4次' }, { id: 'WEEK_1_2', label: '每周1-2次' }, { id: 'MONTHLY', label: '大概一个月一次' }] 
    },
    { id: 'triedAccessories', section: 'ACTIVITY', type: 'single', title: '你以前尝试过使用健身配件吗？', 
      options: [{ id: 'LOVE_IT', label: '是的，我很喜欢' }, { id: 'NOT_HELPFUL', label: '是的，但是对我用处不大' }, { id: 'NEVER_USED', label: '从来没有使用过' }] 
    },
    { id: 'usedAccessories', section: 'ACTIVITY', type: 'multiple', title: '你使用过哪些健身配件？', subTitle: '请选择所有适用项',
      options: [
        { id: 'PILATES_RING', label: '普拉提圈' }, { id: 'DUMBBELLS', label: '哑铃' }, { id: 'RESISTANCE_BAND', label: '阻力带' }, { id: 'BALL', label: '球' },
        { id: 'WEARABLE_WEIGHTS', label: '可穿戴负重' }, { id: 'JUMP_ROPE', label: '跳绳' }, { id: 'FOAM_ROLLER', label: '泡沫轴' }, { id: 'OTHER', label: '其他' }
      ]
    },
    { id: 'accessoryConcern', section: 'ACTIVITY', type: 'multiple', title: '您在使用健身配件时最担心的是什么？', subTitle: '请选择所有适用项',
      options: [
        { id: 'CHALLENGING', label: '他们看起来很有挑战性' }, { id: 'LACK_GEAR', label: '我缺少所有必要的配件' },
        { id: 'EXPENSIVE', label: '它们看起来很贵' }, { id: 'EFFECTIVENESS', label: '我不确定它们的效果如何' },
        { id: 'PROPER_USAGE', label: '我担心正确的使用方法' }, { id: 'PREFER_BODYWEIGHT', label: '我更喜欢自重训练' },
        { id: 'OTHER', label: '其他' }, { id: 'NO_CONCERN', label: '没有担心' }
      ]
    },

    // --- PART 3: 生活方式与习惯 ---
    { id: 'workSchedule', section: 'LIFESTYLE', type: 'single', title: '你的工作时间安排是怎样的？', 
      options: [{ id: 'NINE_TO_FIVE', label: '朝九晚五' }, { id: 'NIGHT_SHIFT', label: '夜班' }, { id: 'FLEXIBLE', label: '我的工作时间比较灵活' }, { id: 'RETIRED', label: '我已经退休/目前没有工作' }] 
    },
    { id: 'typicalDayDesc', section: 'LIFESTYLE', type: 'single', title: '你如何描述你典型的一天？', 
      options: [{ id: 'SITTING', label: '我一天大部分时候都坐着' }, { id: 'ACTIVE_BREAKS', label: '我会进行积极的休息' }, { id: 'STANDING', label: '我整天都站着' }] 
    },
    { id: 'energyLevelByDay', section: 'LIFESTYLE', type: 'single', title: '你白天精力如何？', 
      options: [{ id: 'LOW_MOOD_TIRED', label: '情绪低落，我整天都感觉很累' }, { id: 'POST_LUNCH_DIP', label: '午餐后低迷' }, { id: 'BEFORE_MEALS', label: '餐前感到乏力' }, { id: 'HIGH_STABLE', label: '高而稳定' }] 
    },
    { id: 'waterHabit', section: 'LIFESTYLE', type: 'single', title: '你每天喝多少水？', subTitle: '一杯普通水的容量是 8 盎司或 237 毫升。',
      options: [{ id: 'COFFEE_TEA_ONLY', label: '我只喝咖啡和茶' }, { id: '2_CUPS', label: '大约2杯' }, { id: '2_6CUPS', label: '2-6杯' }, { id: '6CUPS_PLUS', label: '超过6杯' }] 
    },
    { id: 'sleepHours', section: 'LIFESTYLE', type: 'single', title: '你通常睡多久？', 
      options: [{ id: 'LESS_5', label: '不到5小时' }, { id: '5_6', label: '5-6小时' }, { id: '7_8', label: '7-8小时' }, { id: '8_PLUS', label: '超过8小时' }] 
    },

    // --- PART 4: 营养 ---
    { id: 'breakfastTime', section: 'NUTRITION', type: 'single', title: '你通常什么时候吃早餐？', imgUrl: 'https://picsum.photos/seed/breakfast/600/800',
      options: [{ id: '6_8', label: '早上6-8点' }, { id: '8_10', label: '上午8-10点' }, { id: '10_12', label: '上午10-12点' }, { id: 'SKIP', label: '我通常不吃早餐' }] 
    },
    { id: 'lunchTime', section: 'NUTRITION', type: 'single', title: '你通常什么时候吃午餐？', imgUrl: 'https://picsum.photos/seed/lunch/600/800',
      options: [{ id: '10_12', label: '上午10-12点' }, { id: '12_2', label: '中午12点至下午2点' }, { id: '2_4', label: '下午2-4点' }, { id: 'SKIP', label: '我通常不吃午餐' }] 
    },
    { id: 'dinnerTime', section: 'NUTRITION', type: 'single', title: '你通常什么时候吃晚餐？', imgUrl: 'https://picsum.photos/seed/dinner/600/800',
      options: [{ id: '4_6', label: '下午4-6点' }, { id: '6_8', label: '晚上6-8点' }, { id: '8_10', label: '晚上8-10点' }, { id: 'SKIP', label: '我通常不吃晚餐' }] 
    },
    { id: 'dietType', section: 'NUTRITION', type: 'single', title: '你喜欢哪种饮食方式？', imgUrl: 'https://picsum.photos/seed/diet/600/800',
      options: [
        { id: 'STANDARD', label: '传统的' }, { id: 'MEDITERRANEAN', label: '地中海' }, { id: 'VEGETARIAN', label: '素食' }, { id: 'VEGAN', label: '纯素食' }, 
        { id: 'PALEO', label: '古饮食法' }, { id: 'PESCATARIAN', label: '鱼素' }, { id: 'LACTOSE_FREE', label: '不含乳糖' }, { id: 'GLUTEN_FREE', label: '不含麸质' }
      ]
    },
    { id: 'badHabits', section: 'NUTRITION', type: 'multiple', title: '你有以下这些习惯吗?', subTitle: '请选择所有适用项',
      options: [
        { id: 'LATE_NIGHT_EAT', label: '我晚上吃得很晚' }, { id: 'SWEETS_CRAVE', label: '我爱吃甜食' }, { id: 'SODA_DRINK', label: '我喝很多汽水' }, { id: 'SALTY_EAT', label: '我吃很多咸的食物' }, { id: 'NONE', label: '以上都没有' }
      ]
    },

    // --- PART 5: 其他，快结束了 ---
    { id: 'weightGainEvents', section: 'FINAL', type: 'multiple', title: '过去几年里，是否发生过以下任何事件导致体重增加？', subTitle: '请选择所有适用项',
      options: [
        { id: 'RELATIONSHIP', label: '婚姻或恋爱关系' }, { id: 'BUSY_LIFE', label: '忙碌的工作或家庭生活' }, { id: 'FINANCE_DIFFICULTY', label: '经济困难' }, { id: 'COVID', label: '2019新冠大流行' }, 
        { id: 'STRESS_WORRY', label: '压力或担忧' }, { id: 'AGING_METAB', label: '衰老导致新陈代谢减慢' }, { id: 'HOLIDAY_SOCIAL', label: '节日和社交聚会' }, { id: 'NONE', label: '以上都没有' }
      ]
    },
    { id: 'height', section: 'FINAL', type: 'input', title: '你有多高？', field: 'height', unit: 'cm', placeholder: '身高', constraintText: '请输入一个介于90 厘米到243 厘米之间的数值。', minValue: 90, maxValue: 243, imgUrl: 'https://picsum.photos/seed/height/600/800' }, 
    { id: 'weight', section: 'FINAL', type: 'input', title: '你目前体重是多少？', field: 'weight', unit: 'kg', placeholder: '体重', constraintText: '请输入25公斤至300公斤之间的数值。', minValue: 25, maxValue: 300, calcBelowBox: true, imgUrl: 'https://picsum.photos/seed/weight/600/800' }, 
    { id: 'targetWeight', section: 'FINAL', type: 'input', title: '明白了！你的目标体重是多少？', field: 'targetWeight', unit: 'kg', placeholder: '目标体重', constraintText: '请输入25公斤至300公斤之间的数值。', minValue: 25, maxValue: 300, calcBelowBox: true, imgUrl: 'https://picsum.photos/seed/target/600/800' },
    { id: 'age', section: 'FINAL', type: 'input', title: '你多大了？', field: 'age', unit: '岁', placeholder: '年龄', constraintText: '16-99岁', minValue: 16, maxValue: 99, errorMessage: '您不符合使用此应用程序的资格。', imgUrl: 'https://picsum.photos/seed/age/600/800' }
  ];

  const currentStep = QUIZ_STEPS[currentStepIndex];

  useEffect(() => {
    let sess = localStorage.getItem('btme_session_id');
    if (!sess) {
      sess = generateUUID();
      localStorage.setItem('btme_session_id', sess);
    }
    setSessionId(sess);
  }, []);

  useEffect(() => {
    setInputError(null);
  }, [currentStepIndex]);

  // 💡 极其重要的数据清洗器：拦截不符合数据库类型的脏数据！防止 422 崩溃
  const getCleanPayload = (rawData: any) => {
    const payload = { ...rawData };
    
    // 1. 将字符串睡眠时间转为数据库期望的 Float 数字
    if (payload.sleepHours === 'LESS_5') payload.sleepHours = 4.5;
    else if (payload.sleepHours === '5_6') payload.sleepHours = 5.5;
    else if (payload.sleepHours === '7_8') payload.sleepHours = 7.5;
    else if (payload.sleepHours === '8_PLUS') payload.sleepHours = 8.5;
    else payload.sleepHours = undefined;

    // 2. 拦截数据库不支持的饮食类型
    const validDiets = ['STANDARD', 'VEGAN', 'VEGETARIAN', 'KETO', 'PALEO', 'MEDITERRANEAN'];
    if (payload.dietType && !validDiets.includes(payload.dietType)) payload.dietType = 'STANDARD'; 

    // 3. 拦截数据库不支持的运动频率
    const validFreq = ['RARELY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'];
    if (payload.exerciseFreq && !validFreq.includes(payload.exerciseFreq)) payload.exerciseFreq = 'MODERATE';

    return payload;
  };

  // 💡 异步静默保存：数据发走就立刻翻页，绝不卡顿
  const syncStepData = async (step: number, data: any) => {
    if (!sessionId) return;
    try {
      fetch('/api/quiz/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, currentStep: step, ...getCleanPayload(data) })
      }).catch(e => console.error("[Btme Sync failed]", e));
    } catch (e) {}
  };

  const isInputValid = (step: Question, val: number | undefined): boolean => {
    if (val === undefined || isNaN(val)) return false;
    if (step.minValue !== undefined && val < step.minValue) return false;
    if (step.maxValue !== undefined && val > step.maxValue) return false;
    if (step.eligibilityCheck && !step.eligibilityCheck(val)) return false;
    return true;
  };

  // 填空题下一步
  const handleInputNext = async () => {
    const val = formData[currentStep.field!];
    if (!isInputValid(currentStep, val)) {
      if (currentStep.eligibilityCheck && !currentStep.eligibilityCheck(val)) setInputError(currentStep.errorMessage!);
      else setInputError(currentStep.constraintText!);
      return; 
    }
    
    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      syncStepData(currentStepIndex + 1, formData);
      setCurrentStepIndex((prev: number) => prev + 1);
    } else {
      // 💡 报告前的最后一步：必须等待落盘完成，防止报告页查不到数据
      setIsSubmitting(true);
      await fetch('/api/quiz/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, currentStep: currentStepIndex + 1, ...getCleanPayload(formData) })
      });
      router.push(`/report/${sessionId}`);
    }
  };

  const bmiData = useMemo(() => {
    if (currentStep.id !== 'weight') return null;
    const h = formData.height;
    const w = formData.weight;
    if (!h || !w || h <= 0) return null;
    
    const bmi = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));
    let color = '', text = '';
    
    if (bmi < 18.5) {
      color = 'text-[#D65D40] bg-[#FFF0E6]'; 
      text = `您的BMI为${bmi}，属于体重过轻。您还有很多工作要做，但你迈出这第一步非常棒。我们会根据你的BMI为您量身定制一套方案。`;
    } else if (bmi >= 18.5 && bmi < 24) {
      color = 'text-[#2E7D32] bg-[#EAF3EA]';
      text = `您的BMI为${bmi}，属于正常范围。您目前的起点非常好！现在我们将根据您的身体质量指数（BMI）制定一套适合您的个性化方案。`;
    } else if (bmi >= 24 && bmi < 28) {
      color = 'text-[#D65D40] bg-[#FFF0E6]'; 
      text = `您的BMI为${bmi}，属于体重偏重。你还有很长的路要走，但你迈出这一步真是太好了。我们会根据你的BMI指数为您制定专属的减肥计划。`;
    } else {
      color = 'text-[#D65D40] bg-[#FFF0E6]';
      text = `您的BMI为${bmi}，属于肥胖。减掉一些体重，你会受益匪浅。我们会根据你的身体质量指数（BMI）为您制定合适的减肥计划。`;
    }
    return { bmi, color, text };
  }, [currentStep.id, formData.height, formData.weight]);

  const targetWeightData = useMemo(() => {
    if (currentStep.id !== 'targetWeight') return null;
    const curW = formData.weight;
    const tarW = formData.targetWeight;
    if (!curW || !tarW || curW <= 0) return null;
    const diff = curW - tarW;
    const percent = Math.round((diff / curW) * 100);
    if (diff > 0 && percent > 0) return { diff, percent };
    return null;
  }, [currentStep.id, formData.weight, formData.targetWeight]);

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSingleChoice = (key: string, value: string) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);
    syncStepData(currentStepIndex + 1, newFormData);

    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex((prev: number) => prev + 1);
    }
  };

  const handleMultipleChoice = (key: string, value: string) => {
    const currentList = formData[key] || [];
    updateForm(key, currentList.includes(value) ? currentList.filter((a: string) => a !== value) : [...currentList, value]);
  };

  const handleMultipleNext = () => {
    syncStepData(currentStepIndex + 1, formData);
    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex((prev: number) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStepIndex((prev: number) => prev - 1);

  const isNextButtonDisabled = useMemo(() => {
    if (currentStep.type === 'input') return !isInputValid(currentStep, formData[currentStep.field!]);
    if (currentStep.type === 'multiple') return !formData[currentStep.id] || (formData[currentStep.id] as string[]).length === 0;
    return true;
  }, [currentStep, formData, isInputValid]);

  const PROGRESS_SEGMENTS = ['PROFILE', 'ACTIVITY', 'LIFESTYLE', 'NUTRITION_FINAL'];
  const activeSegmentIndex = (() => {
    if (currentStep.section === 'PROFILE') return 0;
    if (currentStep.section === 'ACTIVITY') return 1;
    if (currentStep.section === 'LIFESTYLE') return 2;
    return 3;
  })();

  const renderQuizContent = () => (
    <div className={`w-full mx-auto ${currentStep.type === 'image-single' ? 'max-w-4xl' : 'max-w-xl'}`}>
      
      <div className="text-center w-full mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-[#2B211E] leading-tight px-2">{currentStep.title}</h2>
        {currentStep.subTitle && <p className="mt-3 text-[#5C4D47] text-sm font-semibold tracking-wide">{currentStep.subTitle}</p>}
      </div>

      <div className="w-full space-y-4">
        {/* 横向图片单选卡片排版 */}
        {currentStep.type === 'image-single' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {currentStep.options!.map((opt) => (
              <button 
                key={opt.id} onClick={() => handleSingleChoice(currentStep.id, opt.id)}
                className={`relative flex flex-col items-center rounded-[2rem] border-2 overflow-hidden transition-all hover:border-[#E76F51]/40 ${
                  formData[currentStep.id] === opt.id ? 'border-[#E76F51] bg-[#FFF0E6]' : 'border-[#F0EAE1] bg-white'
                }`}
              >
                <div className="w-full aspect-[4/5] bg-[#F5F1E8]">
                  {opt.imgUrl && (
                    <img src={opt.imgUrl} alt={opt.label} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                  )}
                </div>
                <div className="w-full p-5 flex items-center justify-between">
                  <span className={`font-bold text-sm md:text-base ${formData[currentStep.id] === opt.id ? 'text-[#E76F51]' : 'text-[#2B211E]'}`}>
                    {opt.label}
                  </span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData[currentStep.id] === opt.id ? 'border-[#E76F51]' : 'border-[#EBE5DA]'}`}>
                    {formData[currentStep.id] === opt.id && <span className="w-2.5 h-2.5 rounded-full bg-[#E76F51]"></span>}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 普通文字单选 */}
        {currentStep.type === 'single' && currentStep.options!.map((opt) => (
          <button 
            key={opt.id} onClick={() => handleSingleChoice(currentStep.id, opt.id)}
            className={`w-full p-5 md:p-6 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-lg hover:border-[#E76F51]/40 ${
              formData[currentStep.id] === opt.id ? 'border-[#E76F51] bg-[#FFF0E6] text-[#E76F51]' : 'border-[#F0EAE1] bg-white text-[#5C4D47]'
            }`}
          >
            <span className="flex items-center gap-3 text-left">{opt.icon} {opt.label}</span>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData[currentStep.id] === opt.id ? 'border-[#E76F51]' : 'border-[#EBE5DA]'}`}>
              {formData[currentStep.id] === opt.id && <span className="w-3.5 h-3.5 rounded-full bg-[#E76F51]"></span>}
            </span>
          </button>
        ))}

        {/* 多选 */}
        {currentStep.type === 'multiple' && (
          <div className="space-y-4">
            {currentStep.options!.map((opt) => (
              <button 
                key={opt.id} onClick={() => handleMultipleChoice(currentStep.id, opt.id)}
                className={`w-full p-5 md:p-6 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-lg hover:border-[#E76F51]/40 ${
                  (formData[currentStep.id] || []).includes(opt.id) ? 'border-[#E76F51] bg-[#FFF0E6] text-[#E76F51]' : 'border-[#F0EAE1] bg-white text-[#5C4D47]'
                }`}
              >
                <span className="flex items-center gap-3 text-left">{opt.icon} {opt.label}</span>
                <span className={`w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                  (formData[currentStep.id] || []).includes(opt.id) ? 'border-[#E76F51] bg-[#E76F51] text-white' : 'border-[#EBE5DA] text-white/0'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </button>
            ))}
            <button 
              onClick={handleMultipleNext} disabled={isNextButtonDisabled}
              className="w-full py-5 mt-8 bg-[#E76F51] text-white font-bold rounded-2xl text-xl shadow-md hover:bg-[#D65D40] disabled:opacity-40 transition-all flex items-center justify-center"
            >
              下一步
            </button>
          </div>
        )}

        {/* 填空 */}
        {currentStep.type === 'input' && (
          <div className="space-y-6 w-full">
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#F0EAE1] shadow-sm">
              <div className="flex items-end justify-center gap-3 mb-6">
                <input 
                  type="number" 
                  value={formData[currentStep.field!] || ''} 
                  onChange={e => updateForm(currentStep.field!, parseInt(e.target.value))}
                  placeholder={currentStep.placeholder}
                  className="w-2/3 text-center text-5xl font-black text-[#2B211E] p-2 bg-transparent border-b-4 border-[#F0EAE1] focus:outline-none focus:border-[#E76F51] transition-colors" />
                <span className="text-3xl font-bold text-[#8A7A73] pb-2">{currentStep.unit}</span>
              </div>
              {inputError ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 justify-center">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {inputError}
                </div>
              ) : (
                currentStep.constraintText && <p className="text-center text-xs font-bold text-[#8A7A73]">{currentStep.constraintText}</p>
              )}
            </div>
            
            {currentStep.id === 'weight' && bmiData && (
              <div className={`p-6 rounded-2xl text-sm font-medium leading-relaxed border flex items-start gap-3 animate-in fade-in duration-300 ${bmiData.color} border-[#F0EAE1]`}>
                {bmiData.bmi >= 18.5 && bmiData.bmi < 24 ? <CheckCircle2 className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-[#E76F51] flex-shrink-0 mt-0.5" />}
                <span className="text-left">{bmiData.text}</span>
              </div>
            )}

            {currentStep.id === 'targetWeight' && targetWeightData && (
              <div className="p-6 rounded-2xl text-sm bg-white border border-[#F0EAE1] space-y-3 font-medium text-[#5C4D47] animate-in fade-in duration-300 text-center">
                <p className="font-bold text-[#2B211E]">值得：减掉 <span className="font-black text-xl text-[#E76F51]">{targetWeightData.percent}%</span> 的体重</p>
                <p className="p-4 bg-[#FFF0E6] rounded-xl text-[#E76F51] border border-[#F0EAE1]/50 text-sm text-left leading-relaxed">
                  根据研究，体重减轻 20% 或以上的超重者，其代谢健康状况改善的可能性是体重减轻 5-10% 者的两倍以上。
                </p>
              </div>
            )}

            <button 
              onClick={handleInputNext} disabled={isNextButtonDisabled || isSubmitting}
              className="w-full py-5 bg-[#E76F51] text-white font-bold rounded-2xl text-xl shadow-md hover:bg-[#D65D40] disabled:opacity-40 transition-all flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : '下一步'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFAF4] text-[#2B211E] font-sans flex flex-col">
      
      <div className="fixed top-0 left-0 w-full z-50 bg-[#FCFAF4] px-4 md:px-16 py-5 border-b border-[#F0EAE1] shadow-sm">
        <div className="w-full flex items-center justify-between gap-6 md:gap-10">
          <button 
            onClick={currentStepIndex > 0 ? prevStep : undefined} 
            disabled={currentStepIndex === 0 || isSubmitting} 
            className={`p-2 rounded-full transition-colors ${currentStepIndex === 0 ? 'opacity-0' : 'text-[#5C4D47] hover:bg-white'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2 md:gap-3 flex-1">
            {PROGRESS_SEGMENTS.map((segment, idx) => {
              let fillPercent = 0;
              if (idx < activeSegmentIndex) fillPercent = 100;
              else if (idx === activeSegmentIndex) {
                const segQuestions = QUIZ_STEPS.filter(q => {
                  if (idx === 0) return q.section === 'PROFILE';
                  if (idx === 1) return q.section === 'ACTIVITY';
                  if (idx === 2) return q.section === 'LIFESTYLE';
                  return q.section === 'NUTRITION' || q.section === 'FINAL';
                });
                const firstIndex = QUIZ_STEPS.findIndex(q => q.id === segQuestions[0].id);
                const answeredInSeg = currentStepIndex - firstIndex + 1;
                fillPercent = (answeredInSeg / segQuestions.length) * 100;
              }

              return (
                <div key={segment} className="h-2 flex-1 bg-[#EBE5DA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#E76F51] transition-all duration-300 ease-out" style={{ width: `${fillPercent}%` }}></div>
                </div>
              );
            })}
          </div>

          <div className="text-sm font-bold text-[#8A7A73] w-12 md:w-16 text-right">
            {Math.round(((currentStepIndex + 1) / QUIZ_STEPS.length) * 100)}%
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center pt-32 pb-16 px-4 md:px-8">
        {currentStep.imgUrl ? (
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-7 w-full flex justify-center">
              {renderQuizContent()}
            </div>
            <div className="hidden lg:block lg:col-span-5 w-full">
              <img 
                src={currentStep.imgUrl} 
                alt="Visual Guidance" 
                className="w-full rounded-[2.5rem] object-cover shadow-2xl border border-[#F0EAE1]" 
                style={{ maxHeight: '70vh' }} 
              />
            </div>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderQuizContent()}
          </div>
        )}
      </div>

    </div>
  );
}