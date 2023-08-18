import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

(async () => {
  try {
    const editionDrop = await sdk.getContract("0x5f281928B01F85e47bD5de6fa6FD47fdf3d31d66", "edition-drop");
    await editionDrop.createBatch([
      {
        name: "Multiplicação Exponencial",
        description: "Esse NFT vai te dar acesso a MultiplicaDAO",
        image: readFileSync("scripts/assets/MultiplicaDAO_member.png"),
      },
    ]);
    console.log("✅ Novo NFT criado com sucesso no !");
  } catch (error) {
    console.error("falha ao criar o novo NFT", error);
  }
})()