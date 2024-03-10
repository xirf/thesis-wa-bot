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

        if (data.type === "mahasiswa") {
            await database.mahasiswa.update({
                where: { id: parseInt(data.id) },
                data: {
                    nama: data.nama,
                    telepon: data.telepon

                }
            });
        }
        else {
            await database.dosen.update({
                where: { id: parseInt(data.id) },
                data
            });

        }

        
        res.json({ message: "Data berhasil diupdate" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default router;

