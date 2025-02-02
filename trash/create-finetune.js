const OpenAI = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//====================================================================================================//
// ============        ESTO FUE COMENTADO PARA NO CREAR FINE-TUNED GPTs POR ACCIDENTE      ========== //
// ============         Ejecutar 'node create-finetune.js'  para crear el fine-tuned       ========== //
//====================================================================================================//

// async function crearNuevoFineTune() {
//     try {
//         console.log('🚀 Iniciando proceso de fine-tuning...\n');

//         // 1. Subir archivo de training
//         console.log('📤 Subiendo archivo de training...');
//         const trainingFile = await openai.files.create({
//             file: fs.createReadStream(path.join(__dirname, '1_dentist_clinic_training.jsonl')),
//             purpose: 'fine-tune'
//         });
//         console.log('✅ Archivo de training subido. ID:', trainingFile.id);

//         // 2. Subir archivo de validación
//         console.log('\n📤 Subiendo archivo de validación...');
//         const validationFile = await openai.files.create({
//             file: fs.createReadStream(path.join(__dirname, '1_dentist_clinic_validation.jsonl')),
//             purpose: 'fine-tune'
//         });
//         console.log('✅ Archivo de validación subido. ID:', validationFile.id);

//         // 3. Esperar a que los archivos estén procesados
//         console.log('\n⏳ Esperando a que los archivos sean procesados...');
//         let trainingReady = false;
//         let validationReady = false;

//         while (!trainingReady || !validationReady) {
//             const [trainingStatus, validationStatus] = await Promise.all([
//                 openai.files.retrieve(trainingFile.id),
//                 openai.files.retrieve(validationFile.id)
//             ]);

//             trainingReady = trainingStatus.status === 'processed';
//             validationReady = validationStatus.status === 'processed';

//             if (!trainingReady || !validationReady) {
//                 console.log('⏳ Archivos aún procesando...');
//                 await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
//             }
//         }

//         // 4. Crear el fine-tune
//         console.log('\n🔧 Creando nuevo modelo fine-tuned...');
//         const fineTune = await openai.fineTuning.jobs.create({
//             model: "gpt-3.5-turbo-0125",
//             training_file: trainingFile.id,
//             validation_file: validationFile.id,
//             hyperparameters: {
//                 n_epochs: "auto"
//             }
//         });

//         console.log('\n✨ Fine-tune iniciado exitosamente!');
//         console.log('ID del job:', fineTune.id);
//         console.log('\nPuedes monitorear el progreso con:');
//         console.log(`openai api fine_tunes.follow -i ${fineTune.id}`);
        
//         // 5. Monitorear el estado inicial
//         console.log('\n📊 Estado inicial del fine-tune:');
//         console.log('Status:', fineTune.status);
//         console.log('Modelo base:', fineTune.model);
//         console.log('Creado:', new Date(fineTune.created_at * 1000).toLocaleString());

//     } catch (error) {
//         console.error('\n❌ Error durante el proceso:', error);
//         if (error.response) {
//             console.error('Detalles del error:', error.response.data);
//         }
//     }
// }

// // Ejecutar el proceso
// crearNuevoFineTune();
