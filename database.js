import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config(); // Cargar las variables de entorno desde el archivo .env
const connectionString = process.env.DATABASE_URL;

//=================================================================================//
//=======================================================================================//
// 1) Aqui conectamos con Supabase y guardamos pedimos los Usuarios de la tabla "Users"
// 2) Los guardamos como un array en la variable "usuarios_base_de_datos"
// 3) Exportamos la funcion, que tiene return = "usuarios_base_de_datos"
//=======================================================================================//
//=================================================================================//

const sql = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false, // Acepta certificados autofirmados
  },
});

let usuarioEspecifico_base_de_datos;
const obtenerUsuariosDeBaseDeDatos = async (whatsapp_ID) => {
  try {
    let usuarios_base_de_datos = await sql`SELECT * FROM "Users";`;
    usuarioEspecifico_base_de_datos = usuarios_base_de_datos.find(
      (user) => user.whatsapp_id == whatsapp_ID
    );

    return usuarioEspecifico_base_de_datos;
  } catch (error) {
    console.error("Error al consultar la tabla Users:", error.message);
  }
};

export { obtenerUsuariosDeBaseDeDatos };
