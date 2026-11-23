import { PrismaClient } from '@prisma/client'
import { sendPush } from '@/lib/push'

function makeClient() {
  const base = new PrismaClient({ omit: { user: { password: true } } })
  return base.$extends({
    query: {
      notification: {
        async create({ args, query }) {
          const result: any = await query(args)
          try {
            if (result?.userId) {
              void sendPush(result.userId, {
                title: String(result.title || 'Tshastho').replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Tshastho',
                body: String(result.message || ''),
                url: result.link || '/',
                tag: result.id,
              })
            }
          } catch {}
          return result
        },
      },
    },
  })
}

type ExtendedClient = ReturnType<typeof makeClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedClient | undefined
}

export const prisma = globalForPrisma.prisma ?? makeClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
