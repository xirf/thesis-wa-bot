import Express, { Request, Response } from "express"
import database from "../../database"


const router = Express.Router();

router.get("/dosen", async (_req: Request, res: Response) => {
    const pembimbing = await database.dosen.findMany()
    res.json(pembimbing)
});

router.get("/mahasiswa", async (_req: Request, res: Response) => {
    const mahasiswa = await database.mahasiswa.findMany()
    res.json(mahasiswa)
});

router.get("/skripsi", async (_req: Request, res: Response) => {
    const skripsi = await database.ta.findMany()
    res.json(skripsi)
});


export default router;

