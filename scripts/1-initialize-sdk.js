import { ThirdwebSDK } from "@thirdweb-dev/sdk";

//Importando e configurando nosso arquivo .env para que possamos usar nossas variáveis de ambiente de maneira segura
import dotenv from "dotenv";
dotenv.config();

// Algumas verificações rápidas para ter certeza de que nosso .env está funcionando.
if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY == "") {
  console.log("🛑 Chave privada não encontrada.")
}

if (!process.env.QUICKNODE_API_URL || process.env.QUICKNODE_API_URL == "") {
  console.log("🛑 Alchemy API não encontrada.")
}

if (!process.env.WALLET_ADDRESS || process.env.WALLET_ADDRESS == "") {
  console.log("🛑 Endereço de carteira não encontrado.")
}

const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY, "mumbai", {
  clientId: process.env.THIRDWEB_CLIENT_ID, // Use client id if using on the client side, get it from dashboard settings
  secretKey: process.env.THIRDWEB_SECRET_KEY, // Use secret key if using on the server, get it from dashboard settings
});

(async () => {
  try {
    const address = await sdk.getSigner().getAddress();
    console.log("👋 SDK inicializado pelo endereço:", address)
  } catch (err) {
    console.error("Falha ao buscar apps no sdk", err);
    process.exit(1);
  }
})()

// Nós estamos exportando o SDK thirdweb inicializado para que possamos usar em outros scprits do projeto
export default sdk;