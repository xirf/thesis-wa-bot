import Express, { Request, Response } from "express"
import database from "../../database"


const router = Express.Router();

router.get("/", async (_req: Request, res: Response) => {

    const mahasiswa = await database.mahasiswa.findMany();
    const dosen = await database.dosen.findMany();


    res.render("dashboard", {
        title: "Dashboard",
        data: [
            {
                title: "Data Mahasiswa",
                header1: "NIM",
                type: "mahasiswa",
                mahasiswa: true,
                data: mahasiswa
            },
            {
                title: "Data Dosen",
                type: "dosen",
                header1: "NIDN",
                data: dosen
            }
        ]
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

