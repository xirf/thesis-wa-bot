import express from "express";
import { engine } from "express-handlebars"
import bodyParser from "body-parser";
import logger from "../utils/logger";
import cookieParser from "cookie-parser";

import apiRoute from "./routes/Api"
import dashboardRoute from "./routes/Dashboard"

import authMiddleware from "./middleware/auth";

const app = express();
const port = 3000;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.engine('.hbs', engine({
    extname: '.hbs'
}));

app.set('view engine', '.hbs');
app.set('views', 'src/web/views/');

app.use('/dashboard', authMiddleware, dashboardRoute);
app.use('/api', apiRoute);
app.get("/login", (_req, res) => {
    res.render('login');
})


export default function start() {
    app.listen(port, () => {
        logger.info(`Server started at http://localhost:${port}`);
    });
}