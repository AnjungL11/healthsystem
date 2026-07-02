# API 接口测试
## 首次进入
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "currentStep": 1,
  "gender": "MALE"
}
```
**预期结果**： 会收到 status: 200，并且返回创建成功的 JSON。 Prisma Studio 上 User、QuizSession 和 Subscription 表能看到一条新数据，且订阅状态为 INACTIVE。

## 验证增量更新
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "currentStep": 2,
  "age": 22,
  "height": 178,
  "weight": 70
}
```
**预期结果**： 返回 200。Prisma Studio 中 QuizSession 记录的 age、height、weight 被成功更新，不是创建新数据。

## 验证Zod防线
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "currentStep": 3,
  "age": 5,
  "targetWeight": 500
}
```
**预期结果**：  status: 400，并且 JSON 响应 "message": "年龄需大于 12 岁"，并且数据库里的数据没有被污染。

## 核心计算逻辑接口
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**预期结果**：  status: 200 ok。JSON 响应里面包含 BMI、BMR、三大营养素分配，以及长达 12 周的减重预测曲线，数据库内 AssessmentResult 表格数据更新。