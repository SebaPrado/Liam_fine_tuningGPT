import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config(); // Cargar dotenv al inicio
// Configuración de Sequelize con la URL de conexión
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres", // Especifica el dialecto de la base de datos
  protocol: "postgres", // Protocolo usado (para conexiones SSL)
  dialectOptions: {
    ssl: {
      require: true, // Requiere SSL
      rejectUnauthorized: false, // Acepta certificados no autorizados (por ejemplo, en Supabase)
    },
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
