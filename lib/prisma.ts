import { PrismaClient } from '@prisma/client'

// 避免在开发环境下因热更新导致数据库连接数耗尽
const prismaClientSingleton = () => {
  return new PrismaClient({
    // 在开发环境下打印查询日志
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma