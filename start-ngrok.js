const ngrok = require("ngrok");

(async function () {
  try {
    const url = await ngrok.connect(3000);
    console.log("=================================");
    console.log("Tu URL de ngrok es:", url);
    console.log("=================================");
  } catch (error) {
    console.error("Error detallado:", error);
  }
})();

process.on("SIGTERM", async () => {
  await ngrok.kill();
});
