const SUPABASE_URL = 'https://bvdrogzfvzzcnibnzvmy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZHJvZ3pmdnp6Y25pYm56dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDAzMjgsImV4cCI6MjA1ODIxNjMyOH0.nYvOxNSJod1unLUXVIOYYsaD5ft-1ESr-g5qWcDiZus';

 const whatsappTest = '+5491111111117';
//const whatsappTest = '+61487175193';
const numeroContratoTest = 252068;

const url = `${SUPABASE_URL}/rest/v1/rpc/obtener_cupo_v2`; // Sin query params

async function testObtenerCupoV2() {
  console.log('\n🚀 TESTING obtener_cupo_v2\n');
  console.log(`📱 WhatsApp: ${whatsappTest}`);
  console.log(`📋 Contrato: ${numeroContratoTest}\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        whatsapp_param: whatsappTest,
        numerocontrato_param: numeroContratoTest
      })
    });

    const data = await response.json();

    console.log('📦 Respuesta:', JSON.stringify(data, null, 2), '\n');

    if (data.success) {
      console.log('✅ ÉXITO!');
      console.log('Cupo:', data.cupo.codigo);
      console.log('Saldo anterior:', data.contrato.saldo_anterior, 'TN');
      console.log('Saldo nuevo:', data.contrato.saldo_nuevo, 'TN');
    } else {
      console.log('❌ Falló:', data.error);
    }

  } catch (err) {
    console.error('🚨 ERROR:', err.message);
  }
}

testObtenerCupoV2();