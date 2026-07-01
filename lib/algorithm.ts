/**
 * 运动频率对应的 TDEE 乘数
 */
const ACTIVITY_MULTIPLIER: Record<string, number> = {
    RARELY: 1.2,        // 极少运动
    LIGHT: 1.375,       // 轻度运动 (每周 1-3 天)
    MODERATE: 1.55,     // 中度运动 (每周 3-5 天)
    ACTIVE: 1.725,      // 高强度运动 (每周 6-7 天)
    VERY_ACTIVE: 1.9    // 超高强度运动 (体力劳动/每天双练)
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
  
    // 计算目标卡路里与宏量营养素
    let dailyCalories = tdee;
    let goalType = "MAINTAIN";
  
    if (targetWeight < weight) {
      goalType = "LOSE_WEIGHT";
      // 减脂期：制造 500 kcal 热量缺口
      dailyCalories = Math.max(tdee - 500, bmr); 
    } else if (targetWeight > weight) {
      goalType = "GAIN_WEIGHT";
      // 增肌期：制造 300 kcal 热量盈余
      dailyCalories = tdee + 300;
    }
    
    dailyCalories = Math.round(dailyCalories);
  
    // 营养素分配 (减脂/维持期: 碳水45% 蛋白30% 脂肪25%)
    // 1g 碳水=4kcal, 1g 蛋白=4kcal, 1g 脂肪=9kcal
    const macros = {
      carbs: Math.round((dailyCalories * 0.45) / 4),
      protein: Math.round((dailyCalories * 0.30) / 4),
      fat: Math.round((dailyCalories * 0.25) / 9)
    };
  
    // 生成达成目标预测曲线 (用于前端图表渲染)
    // 1kg 脂肪 ≈ 7700 kcal。每天 500 kcal 缺口，每周减重约 0.45kg
    const weightDiff = Math.abs(weight - targetWeight);
    let daysToGoal = 0;
    let projection = [];
  
    if (weightDiff > 0) {
      const dailyDeficit = Math.abs(tdee - dailyCalories);
      // 保护机制：如果维持原热量却有目标差值，给一个极小默认缺口防死循环
      const effectiveDeficit = dailyDeficit > 0 ? dailyDeficit : 100; 
      daysToGoal = Math.round((weightDiff * 7700) / effectiveDeficit);
      
      // 生成最多 12 周的趋势预测数据
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
      nutrition: { dailyCalories, macros },
      forecast: { daysToGoal, projection }
    };
  }