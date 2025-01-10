const OpenAI = require('openai');
const dotenv = require('dotenv');

// Configuración de variables de entorno
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function diagnosticarModelo() {
    try {
        console.log('🔍 Iniciando diagnóstico del modelo fine-tuned...\n');

        // 1. Verificar la lista de modelos fine-tuned
        console.log('📋 Verificando modelos fine-tuned disponibles...');
        const modelos = await openai.models.list();
        const modelosFinetuned = modelos.data.filter(modelo => 
            modelo.id.startsWith('ft:')
        );
        console.log('\nModelos fine-tuned encontrados:');
        modelosFinetuned.forEach(modelo => {
            console.log(`- ${modelo.id}`);
        });

        // 2. Verificar archivos de entrenamiento
        console.log('\n📁 Verificando archivos de entrenamiento...');
        const archivos = await openai.files.list();
        console.log('\nArchivos disponibles:');
        archivos.data.forEach(archivo => {
            console.log(`- Nombre: ${archivo.filename}`);
            console.log(`  ID: ${archivo.id}`);
            console.log(`  Propósito: ${archivo.purpose}`);
            console.log(`  Creado: ${new Date(archivo.created_at * 1000).toLocaleString()}`);
            console.log('  ----------------');
        });

        // 3. Probar el modelo con diferentes temperaturas
        console.log('\n🤖 Probando el modelo con diferentes temperaturas...');
        const modeloID = "ft:gpt-3.5-turbo-0125:seba-y-daro-org:clinica-dental:An70bnWj";
        
        // Test con temperatura baja
        const respuesta1 = await openai.chat.completions.create({
            model: modeloID,
            messages: [{ role: "user", content: "hola, que hora abren?" }],
            temperature: 0.2,
        });
        console.log('\nRespuesta con temperatura 0.2:');
        console.log(respuesta1.choices[0].message.content);

        // Test con temperatura alta (sin delay)
        const respuesta2 = await openai.chat.completions.create({
            model: modeloID,
            messages: [{ role: "user", content: "hola, que hora abren?" }],
            temperature: 1,
        });
        console.log('\nRespuesta con temperatura 1:');
        console.log(respuesta2.choices[0].message.content);

        // 4. Verificar el estado del modelo específico
        console.log('\n📊 Verificando detalles del modelo específico...');
        const modeloDetalle = await openai.models.retrieve(modeloID);
        console.log('\nDetalles del modelo:');
        console.log(modeloDetalle);

    } catch (error) {
        console.error('\n❌ Error durante el diagnóstico:', error);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
    }
}

// Ejecutar el diagnóstico
diagnosticarModelo();