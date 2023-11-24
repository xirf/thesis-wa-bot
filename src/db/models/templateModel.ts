import { DataTypes } from 'sequelize';
import sequelize from '../client';
import config from '../../config';

const Template = sequelize.define('Template', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    conrtent: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: config.tables.template,
    timestamps: false,
});

export default Template;