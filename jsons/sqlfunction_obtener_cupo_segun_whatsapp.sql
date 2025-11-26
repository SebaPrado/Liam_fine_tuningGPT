

CREATE OR REPLACE FUNCTION public.obtener_cupo_segun_whatsapp(
  whatsapp_param TEXT,
  numerocontrato_param NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  productor_record RECORD;
  contrato_record RECORD;
  cupo_record RECORD;
  intermediario_nombre TEXT;
  cantidad_a_asignar NUMERIC;
BEGIN

  ----------------------------------------------------------------------------------------------------
  ---------------                1️⃣ Buscar productor por whatsapp      ------------------------------
  ----------------------------------------------------------------------------------------------------

  SELECT id, nombre_completo, intermediario_id
  INTO productor_record
  FROM agentesai.productores
  WHERE numero_whatsapp = whatsapp_param
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Número de WhatsApp no registrado',
      'whatsapp', whatsapp_param
    );
  END IF;


  ----------------------------------------------------------------------------------------------------
  ---------------             2️⃣ Buscar contrato por numerocontrato + productor_id     ------------------------------
  ----------------------------------------------------------------------------------------------------

  SELECT id, tipo_grano, saldo, cantidad_total, intermediario_id, numerocontrato
  INTO contrato_record
  FROM agentesai.contratos_productor
  WHERE numerocontrato = numerocontrato_param
    AND productor_id = productor_record.id
    AND saldo > 0;

  IF NOT FOUND THEN
    -- Verificar si el contrato existe
    IF EXISTS (
      SELECT 1 FROM agentesai.contratos_productor 
      WHERE numerocontrato = numerocontrato_param
    ) THEN
      -- El contrato existe, verificar si es del productor
      IF EXISTS (
        SELECT 1 FROM agentesai.contratos_productor 
        WHERE numerocontrato = numerocontrato_param 
        AND productor_id = productor_record.id
      ) THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Contrato sin saldo disponible',
          'productor_nombre', productor_record.nombre_completo,
          'numerocontrato', numerocontrato_param,
          'mensaje', 'Tu participación en este contrato no tiene saldo disponible'
        );
      ELSE
        RETURN json_build_object(
          'success', false,
          'error', 'Contrato no válido',
          'productor_nombre', productor_record.nombre_completo,
          'numerocontrato', numerocontrato_param,
          'mensaje', 'El contrato no pertenece a tu cuenta'
        );
      END IF;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Contrato no encontrado',
        'productor_nombre', productor_record.nombre_completo,
        'numerocontrato', numerocontrato_param,
        'mensaje', 'El número de contrato especificado no existe'
      );
    END IF;
  END IF;

  ----------------------------------------------------------------------------------------------------
  ---------------             3️⃣ Obtener nombre del intermediario     ------------------------------
  ----------------------------------------------------------------------------------------------------

  SELECT nombre INTO intermediario_nombre
  FROM agentesai.intermediarios
  WHERE id = contrato_record.intermediario_id;

  ----------------------------------------------------------------------------------------------------
  ---------------             4️⃣ Buscar cupo disponible     ------------------------------
  ----------------------------------------------------------------------------------------------------

  SELECT id, codigo, tipo_grano, cantidad_tn, puerto_destino
  INTO cupo_record
  FROM agentesai.cupos
  WHERE intermediario_id = contrato_record.intermediario_id
    AND tipo_grano = contrato_record.tipo_grano
    AND estado = 'disponible'
    AND productor_id IS NULL
  ORDER BY fecha_inicio ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sin cupos disponibles',
      'productor_nombre', productor_record.nombre_completo,
      'intermediario_nombre', COALESCE(intermediario_nombre, 'intermediario desconocido'),
      'tipo_grano', contrato_record.tipo_grano,
      'numerocontrato', numerocontrato_param
    );
  END IF;

  ----------------------------------------------------------------------------------------------------
  ---------------             5️⃣ Calcular cantidad a asignar     ------------------------------
  ----------------------------------------------------------------------------------------------------

  cantidad_a_asignar := LEAST(cupo_record.cantidad_tn, contrato_record.saldo);

  ----------------------------------------------------------------------------------------------------
  ---------------             6️⃣ Asignar el cupo al productor     ------------------------------
  ----------------------------------------------------------------------------------------------------

  UPDATE agentesai.cupos
  SET 
    productor_id = productor_record.id,
    contrato_productor_intermediario_id = contrato_record.id,
    estado = 'asignado',
    updated_at = now()
  WHERE id = cupo_record.id;

  ----------------------------------------------------------------------------------------------------
  ---------------             7️⃣ Descontar del saldo del contrato     ------------------------------
  ----------------------------------------------------------------------------------------------------

  UPDATE agentesai.contratos_productor
  SET 
    saldo = saldo - cantidad_a_asignar,
    updated_at = now()
  WHERE id = contrato_record.id;

  ----------------------------------------------------------------------------------------------------
  ---------------             8️⃣ Retornar resultado exitoso     ------------------------------
  ----------------------------------------------------------------------------------------------------

  RETURN json_build_object(
    'success', true,
    'productor_nombre', productor_record.nombre_completo,
    'intermediario_nombre', intermediario_nombre,
    'numerocontrato', numerocontrato_param,
    'cupo', json_build_object(
      'codigo', cupo_record.codigo,
      'tipo_grano', cupo_record.tipo_grano,
      'cantidad_asignada_tn', cantidad_a_asignar,
      'puerto_destino', cupo_record.puerto_destino
    ),
    'contrato', json_build_object(
      'numerocontrato', contrato_record.numerocontrato,
      'tipo_grano', contrato_record.tipo_grano,
      'saldo_anterior', contrato_record.saldo,
      'saldo_nuevo', contrato_record.saldo - cantidad_a_asignar
    )
  );
END;
$$;