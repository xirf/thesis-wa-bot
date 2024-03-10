import Fastify from 'fastify';
import logger from '../utils/logger';
import fastifyPOV from '@fastify/view';
import ejs from "ejs";


// Routes 
import apiRoute from "./routes/Api"
import dashboardRoute from "./routes/Dashboard"
import path from 'path';

// Initialize Fastify
const fastify = Fastify({
    logger: logger.child({ module: "webserver" }),

});

// Register view engine
fastify.register(fastifyPOV, {
    engine: {
        ejs,
    },
    root: path.join(__dirname, "views"),
    viewExt: "ejs",

})


// Register routes
fastify.register(apiRoute, { prefix: "/api" });
fastify.register(dashboardRoute);

export default function run() {
    fastify.listen({ port: 3000 }, (err, address) => {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        fastify.log.info(`server listening on ${address}`);
    });
}
