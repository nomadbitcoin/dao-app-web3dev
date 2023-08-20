import sdk from "./1-initialize-sdk.js";

(async () => {
  try {
    const token = sdk.getContract("0x13DD0AA8cE5b77c8BA6cc81d21Ab31F93eD56081", "token");
    // Mostre os papeis atuais.
    const allRoles = (await token).roles;

    // console.log("👀 Papeis que existem agora:", allRoles);

    // Remova todos os superpoderes que sua carteira tinha sobre o contrato ERC-20.
    await allRoles.setAll({ admin: [], minter: ['0x988d8063f521aa948FEc4AC1a4EDa72a5BdCBFb0'] });
    console.log(
      "🎉 Papeis depois de remover nós mesmos",
      (await token).roles
    );
    console.log("✅ Revogados nossos super-poderes sobre os tokens ERC-20");

  } catch (error) {
    console.error("Falha ao remover nossos direitos sobre o tesouro da DAO", error);
  }
})();