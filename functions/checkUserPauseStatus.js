import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Función para verificar el estado de pausa del usuario
const checkUserPauseStatus = async (whatsappId) => {
  try {
    // Consulta a la base de datos para encontrar al usuario por whatsapp_id
    const user = await sequelize.query(
      'SELECT paused FROM "Users" WHERE whatsapp_id LIKE :whatsappId',
      {
        replacements: { whatsappId: `%${whatsappId}%` },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Verificar si se encontró un usuario
    if (user.length > 0) {
      // Devolver el estado de pausa
      return { isPaused: user[0].paused };
    } else {
      // Si no se encuentra usuario, devolver false
      return { isPaused: false };
    }
  } catch (error) {
    console.error("Error al verificar el estado de pausa del usuario:", error);
    // En un escenario real, querrías manejar este error de manera más robusta
    throw error;
  }
};

export { checkUserPauseStatus };