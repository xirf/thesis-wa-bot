import { DataTypes } from 'sequelize';
import sequelize from '../client';
import config from '../../config';

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    session: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: config.tables.sessions,
    timestamps: false,
});

export default Session;