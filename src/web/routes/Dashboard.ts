import { FastifyInstance } from 'fastify'
import database from "./../../database"

export default async function routes(fastify: FastifyInstance, options: Record<string, unknown>) {
    fastify.get('/', async (request, reply) => {
        const mahasiswaData = await database.mahasiswa.findMany()
        const dosenData = await database.dosen.findMany()
        return reply.view("index.ejs", {
            data: [
                {
                    title: "Data Mahasiswa",
                    header1: "NIM",
                    data: mahasiswaData
                },
                {
                    title: "Data Dosen",
                    header1: "NIDN",
                    data: dosenData
                }
            ]
        }, {
            layout:
                "/layouts/dashboard.ejs"
        })
    })
}