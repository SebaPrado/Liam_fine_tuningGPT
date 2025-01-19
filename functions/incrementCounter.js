import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config(); // Cargar dotenv al inicio
// Configuración de Sequelize con la URL de conexión
// Create a new Sequelize instance using the DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  // Optional but recommended settings
  pool: {
    max: 5, // Maximum number of connection in pool
    min: 0, // Minimum number of connection in pool
    acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
  },
});

const incrementCounter = async (whatsapp_id) => {
  try {
    const usuarios_base_de_datos = await sequelize.query(
      'SELECT * FROM "Users"',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    const usuarioEspecifico_base_de_datos = usuarios_base_de_datos.find(
      (user) => user.whatsapp_id === whatsapp_id
    );

    if (usuarioEspecifico_base_de_datos) {
      let nuevoContador =
        Number(usuarioEspecifico_base_de_datos.numero_de_interacciones) + 1;
      // nuevoContador = nuevoContador +1;
      await sequelize.query(
        'UPDATE "Users" SET numero_de_interacciones = :nuevoContador WHERE whatsapp_id = :whatsapp_id',
        {
          replacements: { nuevoContador, whatsapp_id },
        }
      );
      console.log(
        `Número de interacciones incrementado para el usuario con whatsapp_id: ${whatsapp_id}`
      );
    } else {
      console.error(
        `sebita : Usuario con whatsapp_id: ${whatsapp_id} no encontrado.`
      );
    }
  } catch (error) {
    console.error("Error al incrementar el contador:", error);
  }
};

export { incrementCounter };
