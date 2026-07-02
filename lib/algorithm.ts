/**
 * 运动频率对应的 TDEE 乘数
 */
const ACTIVITY_MULTIPLIER: Record<string, number> = {
    RARELY: 1.2,        // 极少运动
    LIGHT: 1.375,       // 轻度运动 (每周 1-3 天)
    MODERATE: 1.55,     // 中度运动 (每周 3-5 天)
    ACTIVE: 1.725,      // 高强度运动 (每周 6-7 天)
    VERY_ACTIVE: 1.9    // 超高强度运动 (体力劳动)
  };
  
  export interface HealthData {
    gender: string;
    age: number;
    height: number;
    weight: number;
    targetWeight: number;
    exerciseFreq: string;
  }
  
  export function calculateHealthMetrics(data: HealthData) {
    const { gender, age, height, weight, targetWeight, exerciseFreq } = data;
  
    // 计算 BMI 及健康评估
    const heightInMeters = height / 100;
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    
    let bmiCategory = "标准";
    if (bmi < 18.5) bmiCategory = "偏瘦";
    else if (bmi >= 24 && bmi < 28) bmiCategory = "超重";
    else if (bmi >= 28) bmiCategory = "肥胖";
  
    // 计算基础代谢 BMR (Mifflin-St Jeor 公式)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === 'MALE' ? 5 : -161;
    bmr = Math.round(bmr);
  
    // 计算每日总消耗 TDEE
    const multiplier = ACTIVITY_MULTIPLIER[exerciseFreq] || ACTIVITY_MULTIPLIER['RARELY'];
    const tdee = Math.round(bmr * multiplier);
  
    // 计算目标卡路里与动态宏量营养素
    let dailyCalories = tdee;
    let goalType = "MAINTAIN";
    let macroRatios = { carbs: 0.45, protein: 0.30, fat: 0.25 }; // 默认维持期比例
  
    if (targetWeight < weight) {
      goalType = "LOSE_WEIGHT";
      // 减脂：制造 500 kcal 缺口
      dailyCalories = tdee - 500;
      // 边界安全校验：不能低于 BMR，且不能低于性别最低安全红线
      const safeFloor = gender === 'MALE' ? 1500 : 1200;
      dailyCalories = Math.max(dailyCalories, bmr, safeFloor);
      macroRatios = { carbs: 0.40, protein: 0.35, fat: 0.25 }; // 高蛋白防流失
      
    } else if (targetWeight > weight) {
      goalType = "GAIN_WEIGHT";
      // 增肌：制造 300 kcal 盈余
      dailyCalories = tdee + 300;
      macroRatios = { carbs: 0.50, protein: 0.25, fat: 0.25 }; // 高碳水促合成
    }
    
    dailyCalories = Math.round(dailyCalories);
  
    // 1g 碳水=4kcal, 1g 蛋白=4kcal, 1g 脂肪=9kcal
    const macros = {
      carbs: Math.round((dailyCalories * macroRatios.carbs) / 4),
      protein: Math.round((dailyCalories * macroRatios.protein) / 4),
      fat: Math.round((dailyCalories * macroRatios.fat) / 9)
    };
  
    // 每日建议饮水量 (ml)
    // 标准公式：体重(kg) * 33ml，运动频率越高适当增加
    const baseWater = weight * 33;
    const extraWater = exerciseFreq === 'ACTIVE' || exerciseFreq === 'VERY_ACTIVE' ? 500 : 0;
    const waterIntake = Math.round(baseWater + extraWater);
  
    // 生成达成目标预测曲线
    const weightDiff = Math.abs(weight - targetWeight);
    let daysToGoal = 0;
    const projection = [];
  
    if (weightDiff > 0) {
      const dailyDeficit = Math.abs(tdee - dailyCalories);
      const effectiveDeficit = dailyDeficit > 50 ? dailyDeficit : 100; // 防除0或死循环
      daysToGoal = Math.round((weightDiff * 7700) / effectiveDeficit);
      
      let currentProjWeight = weight;
      const weeklyWeightChange = (effectiveDeficit * 7) / 7700;
      
      for (let week = 0; week <= Math.min(12, Math.ceil(daysToGoal / 7)); week++) {
        projection.push({
          week: week,
          projectedWeight: parseFloat(currentProjWeight.toFixed(1))
        });
        if (goalType === "LOSE_WEIGHT") currentProjWeight -= weeklyWeightChange;
        else currentProjWeight += weeklyWeightChange;
      }
    }
  
    return {
      overview: { bmi, bmiCategory, bmr, tdee, goalType },
      nutrition: { dailyCalories, macros, waterIntake },
      forecast: { daysToGoal, projection }
    };
  }