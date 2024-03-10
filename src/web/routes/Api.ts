import { FastifyInstance } from 'fastify'

export default async function routes(fastify: FastifyInstance, options: Record<string, unknown>) {
    fastify.get('/', async (request, reply) => {
        return { hello: 'world' }
    })
}