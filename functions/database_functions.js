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

const obtenerUsuarioDeBaseDeDatos = async (whatsapp_ID) => {
  try {
    let usuarios_base_de_datos = await sql`SELECT * FROM "Users";`;
    usuarioEspecifico_base_de_datos = usuarios_base_de_datos.find(
      (user) => user.whatsapp_id == whatsapp_ID
    );

    console.log("usuario es : ", usuarioEspecifico_base_de_datos);
    return usuarioEspecifico_base_de_datos;
  } catch (error) {
    console.error("Error al consultar la tabla Users:", error.message);
  }
};

const crear_Usuario_en_DB = async (whatsapp_ID, Thread_id) => {
  try {
    let usuarioExistente = await obtenerUsuarioDeBaseDeDatos(whatsapp_ID);

    if (usuarioExistente) {
      console.log("El usuario ya existe en la base de datos.");
      return usuarioExistente;
    }

    let nuevoUsuario = await sql`
      INSERT INTO "Users" ("whatsapp_id", "Thread_id") 
      VALUES (${whatsapp_ID}, ${Thread_id}) 
      RETURNING *;
    `;

    console.log("Usuario creado exitosamente:", nuevoUsuario[0]);
    return nuevoUsuario[0];
  } catch (error) {
    console.error("Error al consultar la tabla Users:", error.message);
  }
};

export { obtenerUsuarioDeBaseDeDatos, crear_Usuario_en_DB };
