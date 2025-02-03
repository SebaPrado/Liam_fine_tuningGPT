 este error es clave para solucionar varios de los problemas que vienen surgiendo :
    Un run se superpone con otro run y hace que el agente se caiga : 
 
 Error en /script_chat: BadRequestError: 400 Thread thread_CvH22HaDLoUS2WClr5VtQ4F9 already has an active run run_BsVvcezUUwUAn8Y5DnbqHmFH.
    at APIError.generate (file:///C:/Users/Seba/Desktop/GPT/Sebas_Fine_tuning(Liam)GPT/node_modules/openai/error.mjs:41:20)      
    at OpenAI.makeStatusError (file:///C:/Users/Seba/Desktop/GPT/Sebas_Fine_tuning(Liam)GPT/node_modules/openai/core.mjs:286:25) 
    at OpenAI.makeRequest (file:///C:/Users/Seba/Desktop/GPT/Sebas_Fine_tuning(Liam)GPT/node_modules/openai/core.mjs:330:30)     
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///C:/Users/Seba/Desktop/GPT/Sebas_Fine_tuning(Liam)GPT/index.js:396:17 {
  status: 400,
  headers: {
    'alt-svc': 'h3=":443"; ma=86400',
    'cf-cache-status': 'DYNAMIC',
    'cf-ray': '90c46e3d183eea3d-FCO',
    connection: 'keep-alive',
    'content-length': '206',
    'content-type': 'application/json',
    date: 'Mon, 03 Feb 2025 18:19:41 GMT',
    'openai-organization': 'jugueteria-o1axnp',
    'openai-processing-ms': '502',
    'openai-version': '2020-10-01',
    server: 'cloudflare',
    'set-cookie': '__cf_bm=.EskD6AlIFHJaWAbEi9owic_dZid_XYlzSrjjVDTs50-1738606781-1.0.1.1-u6xcArq6FLwX85hgLa8UnoXkP_Et2sy6ZHLW7wn6nWlBWr9Y5HI3a_5MVzO9Et0xnq1eViCuw8auWOgPHGnuwA; path=/; expires=Mon, 03-Feb-25 18:49:41 GMT; domain=.api.openai.com; HttpOnly; Secure; SameSite=None, _cfuvid=KzjUD3l0rdGHCUwwIc_kstl2fldegG_ZRR0NY_eeK0I-1738606781635-0.0.1.1-604800000; path=/; domain=.api.openai.com; HttpOnly; Secure; SameSite=None',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-request-id': 'req_ef4b9c19524a3872687ce500cbbf7576'
  },
  request_id: 'req_ef4b9c19524a3872687ce500cbbf7576',
  error: {
    message: 'Thread thread_CvH22HaDLoUS2WClr5VtQ4F9 already has an active run run_BsVvcezUUwUAn8Y5DnbqHmFH.',
    type: 'invalid_request_error',
    param: null,
    code: null
  },
  code: null,
  param: null,
  type: 'invalid_request_error'
}
