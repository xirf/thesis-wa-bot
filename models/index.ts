import { Sequelize, Model, Column, DataType, Table, HasMany } from "sequelize-typescript";
import type { Dialect } from "sequelize/types";
import dbConfig from "../config/config.json";
import logger from "../src/utils/logger";

@Table({ timestamps: false })
class Session extends Model {
  @Column({ type: DataType.TEXT, primaryKey: true, unique: true })
  sessionId!: string;

  @Column(DataType.TEXT)
  session?: string;
}

@Table({ timestamps: false })
class Mahasiswa extends Model {
  @Column({ type: DataType.CHAR(20), primaryKey: true, unique: true })
  nim!: string;

  @Column({ type: DataType.CHAR(40), allowNull: false })
  nama_mhs!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: () => new Date().getFullYear() })
  thn_ajar!: number;

  @Column({ type: DataType.CHAR(20), allowNull: false })
  no_tlp!: string;

  @Column(DataType.CHAR(40))
  email!: string;

  @Column(DataType.CHAR(20))
  prodi!: string;
}

@Table({ timestamps: false })
class Dosen extends Model {
  @Column({ type: DataType.CHAR(20), primaryKey: true, unique: true })
  nidn!: string;

  @Column({ type: DataType.CHAR(40), allowNull: false })
  nama_dosen!: string;

  @Column({ type: DataType.CHAR(20), allowNull: false })
  no_tlp!: string;

  @Column(DataType.CHAR(40))
  email!: string;

  @HasMany(() => Ta)
  ta!: Ta[];
}

@Table({ timestamps: false })
class Ta extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, unique: true })
  id_ta!: number;

  @Column({ type: DataType.CHAR(20), allowNull: false })
  judul_ta!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  status!: boolean;

  @Column({ type: DataType.ARRAY(DataType.INTEGER) })
  pembimbing!: number[];

  @HasMany(() => Pembimbing)
  pembimbingDetails!: Pembimbing[];
}

@Table({ timestamps: false })
class Pembimbing extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, unique: true })
  idpbb!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  id_ta!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  status_pbb!: boolean;

  @Column({ type: DataType.CHAR(20) })
  id_dosen!: string;
}

const log = logger.child({ children: "DB" });

const sequelize = new Sequelize({
  username: dbConfig.username as string,
  password: dbConfig.password || '',
  database: dbConfig.database as string,
  host: dbConfig.host as string,
  dialect: dbConfig.dialect as Dialect,
  logging: log.info.bind(log),
});

sequelize.addModels([ Session, Mahasiswa, Dosen, Ta, Pembimbing ]);
sequelize.sync({ alter: true });

export { sequelize, Session, Mahasiswa, Dosen, Ta, Pembimbing };
