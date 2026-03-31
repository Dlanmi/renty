import { configureR2Cors, resolveR2AllowedOrigins } from "../lib/storage/r2";

async function main() {
  const allowedOrigins = resolveR2AllowedOrigins();

  if (allowedOrigins.length === 0) {
    throw new Error(
      "No encontramos orígenes permitidos para configurar el CORS del bucket."
    );
  }

  await configureR2Cors(allowedOrigins);

  console.log("R2 CORS actualizado para los siguientes orígenes:");
  for (const origin of allowedOrigins) {
    console.log(`- ${origin}`);
  }
}

main().catch((error) => {
  console.error("No pudimos configurar el CORS de R2.");
  console.error(error);
  process.exit(1);
});
