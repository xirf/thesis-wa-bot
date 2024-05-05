import Express, { Request, Response } from "express"
import database from "../../database"


const router = Express.Router();

router.get("/dosen", async (_req: Request, res: Response) => {
    const pembimbing = await database.dosen.findMany()
    res.json(pembimbing)
});

router.get("/mahasiswa", async (_req: Request, res: Response) => {
    let mahasiswa

    if (_req.query.no_ta) {
        mahasiswa = await database.mahasiswa.findMany({
            where: {
                ta: {
                    none: {}
                }
            }
        })
    } else {
        mahasiswa = await database.mahasiswa.findMany()
    }
    res.json(mahasiswa)
});

router.get("/skripsi", async (_req: Request, res: Response) => {
    const skripsi = await database.ta.findMany()
    res.json(skripsi)
});


router.post("/ta", async (req: Request, res: Response) => {
    try {
        const data = req.body;
        await database.ta.create({
            data
        });

        res.json({ message: "Data berhasil ditambahkan" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.post("/pembimbing", async (req: Request, res: Response) => {
    try {
        const reqbody = req.body;
        console.log(reqbody.data)

        await Promise.all(reqbody.data.map(async (element) => {
            if (!element) return
            await database.pembimbing.create({
                data: {
                    ta: {
                        connect: {
                            id: element.ta
                        }
                    },
                    dosen: {
                        connect: {
                            id: element.dosen
                        }
                    },
                    status_pbb: element.status
                }
            });
        }));

        res.json({ message: "Data berhasil ditambahkan" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

export default router;

