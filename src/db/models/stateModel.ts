import { DataTypes } from 'sequelize';
import sequelize from '../client';
import config from '../../config';

// Define State model
const State = sequelize.define('State', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    value: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: config.tables.state,
    timestamps: false,
});

export default State;