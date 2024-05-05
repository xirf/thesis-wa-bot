import Express, { Request, Response } from "express";
import {engine} from "express-handlebars";
import cookieParser from "cookie-parser";
import logger from "../utils/logger";


// Routes
import Dashboard from "./routes/Dashboard";


// Middleware
import auth from "./middleware/auth";
import path from "path";

const app = Express();

app.use(cookieParser());
app.use(Express.urlencoded({ extended: true }));
app.use(Express.json());

app.engine(".hbs", engine({
    extname: ".hbs",
    helpers: {
        "json": (context: any) => {
            return JSON.stringify(context, null, 2);
        }
    },
    layoutsDir: path.join(__dirname, "views/layouts"),
    defaultLayout: "main"
}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", ".hbs");



// Routes
app.get("/login", async (_req: Request, res: Response) => {
    res.render("login", {
        layout: "minimal",
    });
});

app.post("/login", async (req: Request, res: Response) => {
    if (req.body.username === "admin" && req.body.password === "admin") {
        res.cookie("auth", "true");
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});

app.use("/", auth, Dashboard);



export default () => {
    app.listen(3000, () => {
        logger.info("Server is running on http://localhost:3000");
    });
}

