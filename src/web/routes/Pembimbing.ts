import Express, { Request, Response } from "express"
import database from "../../database"


const router = Express.Router();

router.get("/", async (_req: Request, res: Response) => {

    const pembimbing = await database.pembimbing.findMany({
        include: {
            ta: {
                include: {
                    mahasiswa: true,
                }
            },
            dosen: true,
        }
    })

    const combined = pembimbing.reduce((acc, curr) => {
        const existingIndex = acc.findIndex(item => item.ta.id === curr.ta.id);

        if (existingIndex >= 0) {
            acc[ existingIndex ].dosen.push(curr.dosen);
        } else {
            // Clone the current item and make sure dosen is an array
            const newItem = { ...curr, dosen: [ curr.dosen ] };
            acc.push(newItem);
        }

        return acc;
    }, []);

    res.render("pembimbing", {
        title: "Pembimbing",
        data: combined
    });
});

router.post("/update", async (req: Request, res: Response) => {
    try {
        const data = req.body;
        let id = data.id
        delete data.id

        if (data.type === "mahasiswa") {
            delete data.type
            await database.mahasiswa.update({
                where: { id: parseInt(id) },
                data
            });
        }
        else {
            delete data.type
            await database.dosen.update({
                where: { id: parseInt(id) },
                data
            });

        }


        res.json({ message: "Data berhasil diupdate" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post("/new", async (req: Request, res: Response) => {
    try {
        const data = req.body;
        delete data.id

        if (data.type === "mahasiswa") {
            delete data.type
            await database.mahasiswa.create({
                data
            });
        }
        else {
            delete data.type
            data.nidn = data.nim || data.nidn
            delete data.nim
            delete data.prodi
            delete data.id
            await database.dosen.create({
                data
            });

        }


        res.json({ message: "Data berhasil diupdate" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




export default router;

