import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
// Configuración de Sequelize con la URL de conexión
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

const pauseUser = async (number_to_pause) => {
  try {
    const usuarios_base_de_datos = await sequelize.query(
      'SELECT * FROM "Users"',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    const usuarioEspecifico_base_de_datos = usuarios_base_de_datos.find(
      (user) => user.whatsapp_id.includes(number_to_pause)
    );

    if (usuarioEspecifico_base_de_datos) {
      console.log(
        `Usuario encontrado: ${usuarioEspecifico_base_de_datos.whatsapp_id}`);
        return { usuario_encontrado_en_funcion_pauseUSer: usuarioEspecifico_base_de_datos };
      
    } else {
      console.log(
        `No se encontró ningún usuario con whatsapp_id que contenga ${number_to_pause}`
      );
      return { mensaje: "Usuario no encontrado" };
    }
    
  } catch (error) {
    console.error("Error al incrementar el contador:", error);
  }
};

// pauseUser(487175193);
export { pauseUser };
