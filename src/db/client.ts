import { Sequelize } from 'sequelize';
import config from '../config';
import log from '../utils/logger';
import { Session, State, Template } from './models';

const sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
        host: config.db.host,
        dialect: 'mysql',
        logging: log.debug.bind(log),
    }
);

// Sync models with database
(async () => {
    try {
        await sequelize.authenticate();
        log.info('Connection has been established successfully.');

        await Session.sync({ force: false });
        log.info(`Table ${config.tables.sessions} synced.`);

        await State.sync({ force: false });
        log.info(`Table ${config.tables.state} synced.`);

        await Template.sync({ force: false });
        log.info(`Table ${config.tables.template} synced.`);


    } catch (error) {
        log.error('Unable to connect to the database:', error);
    }
})();

export default sequelize;