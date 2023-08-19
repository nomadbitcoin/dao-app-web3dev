import { useAddress, ConnectWallet, Web3Button, useContract, useNFTBalance } from '@thirdweb-dev/react';
import { useState, useEffect, useMemo } from 'react';
import { AddressZero } from "@ethersproject/constants";

const App = () => {
  // Use o hook connectWallet que o thirdweb nos dá.
  const address = useAddress();
  // console.log("👋 Address:", address);
  // inicializar o contrato editionDrop
  const editionDropAddress = "0x5f281928b01f85e47bd5de6fa6fd47fdf3d31d66"
  const { contract: editionDrop } = useContract(editionDropAddress, "edition-drop");
  const { contract: token } = useContract('0x13DD0AA8cE5b77c8BA6cc81d21Ab31F93eD56081', 'token');
  const { contract: vote } = useContract("0x3F631d3De33BAeAF8C33E6398f903F2041Dfe25b", "vote");

  // Hook para verificar se o úsuario tem a NFT
  const { data: nftBalance } = useNFTBalance(editionDrop, address, "0")

  const hasClaimedNFT = useMemo(() => {
    return nftBalance && nftBalance.gt(0)
    }, [nftBalance])

  // Guarda a quantidade de tokens que cada membro tem nessa variável de estado.
  const [memberTokenAmounts, setMemberTokenAmounts] = useState([]);
  // O array guardando todos os endereços dos nosso membros.
  const [memberAddresses, setMemberAddresses] = useState([]);
  // Uma função para diminuir o endereço da carteira de alguém, não é necessário mostrar a coisa toda.
  const shortenAddress = (str) => {
    return str.substring(0, 6) + "..." + str.substring(str.length - 4);
  };

  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Recupere todas as propostas existentes no contrato. 
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }
    // Uma chamada simples para vote.getAll() para pegar as propostas.
    const getAllProposals = async () => {
      try {
        const proposals = await vote.getAll();
        setProposals(proposals);
        console.log("🌈 Propostas:", proposals);
      } catch (error) {
        console.log("falha ao buscar propostas", error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  // Nós também precisamos checar se o usuário já votou.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Se nós não tivermos terminado de recuperar as propostas do useEffect acima
    // então ainda nao podemos checar se o usuário votou!
    if (!proposals.length) {
      return;
    }

    const checkIfUserHasVoted = async () => {
      try {
        const hasVoted = await vote.hasVoted(proposals[0].proposalId, address);
        setHasVoted(hasVoted);
        if (hasVoted) {
          console.log("🥵 Usuário já votou");
        } else {
          console.log("🙂 Usuário ainda não votou");
        }
      } catch (error) {
        console.error("Falha ao verificar se carteira já votou", error);
      }
    };
    checkIfUserHasVoted();

  }, [hasClaimedNFT, proposals, address, vote]);

  // Esse useEffect pega todos os endereços dos nosso membros detendo nosso NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }
    
    // Do mesmo jeito que fizemos no arquivo 7-airdrop-token.js! Pegue os usuários que tem nosso NFT
    // com o tokenId 0.
    const getAllAddresses = async () => {
      try {
        const memberAddresses = await editionDrop.history.getAllClaimerAddresses(0);
        setMemberAddresses(memberAddresses);
        console.log("🚀 Endereços de membros", memberAddresses);
      } catch (error) {
        console.error("falha ao pegar lista de membros", error);
      }
    };
    getAllAddresses();
  }, [hasClaimedNFT, editionDrop]);

  // Esse useEffect pega o # de tokens que cada membro tem.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Pega todos os saldos.
    const getAllBalances = async () => {
      try {
        const amounts = await token.history.getAllHolderBalances();
        setMemberTokenAmounts(amounts);
        console.log("👜 Quantidades", amounts);
      } catch (error) {
        console.error("falha ao buscar o saldo dos membros", error);
      }
    };
    getAllBalances();
  }, [hasClaimedNFT, token]);

  // Agora, nós combinamos os memberAddresses e os memberTokenAmounts em um único array
  const memberList = useMemo(() => {
    return memberAddresses.map((address) => {
      // Se o endereço não está no memberTokenAmounts, isso significa que eles não
      // detêm nada do nosso token.
      const member = memberTokenAmounts?.find(({ holder }) => holder === address);

      return {
        address,
        tokenAmount: member?.balance.displayValue || "0",
      }
    });
  }, [memberAddresses, memberTokenAmounts]);

  console.log("memberList: ", memberList)

  // Esse é o caso em que o usuário ainda não conectou sua carteira
  // ao nosso webapp. Deixe ele chamar connectWallet.
  if (!address) {
    return (
      <div className="landing">
        <h1>Bem-vind@s à MultiplicaDAO - a DAO dos que gostam de multiplicar tudo</h1>
        <div className="btn-hero">
          <ConnectWallet />
        </div>
      </div>
    );
  }

  // Se o usuário já reivindicou seu NFT nós queremos mostrar a página interna da DAO para ele
  // Apenas membros da DAO vão ver isso. Renderize todos os membros + quantidade de tokens
  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>Página dos membros da DAO</h1>
        <p>Parabéns por fazer parte desse grupo de multiplicadores</p>
        <div>
          <div>
            <h2>Lista de Membros</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>Endereço</th>
                  <th>Quantidade de Tokens</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Propostas Ativas</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                e.stopPropagation()

                //antes de fazer as coisas async, desabilitamos o botão para previnir duplo clique
                setIsVoting(true)

                // pega os votos no formulário 
                const votes = proposals.map((proposal) => {
                  const voteResult = {
                    proposalId: proposal.proposalId,
                    //abstenção é a escolha padrão
                    vote: 2,
                  }
                  proposal.votes.forEach((vote) => {
                    const elem = document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    )

                    if (elem.checked) {
                      voteResult.vote = vote.type
                      return
                    }
                  })
                  return voteResult
                })

                // certificamos que o usuário delega seus tokens para o voto
                try {
                  //verifica se a carteira precisa delegar os tokens antes de votar
                  const delegation = await token.getDelegationOf(address)
                  // se a delegação é o endereço 0x0 significa que eles não delegaram seus tokens de governança ainda
                  if (delegation === AddressZero) {
                    //se não delegaram ainda, teremos que delegar eles antes de votar
                    await token.delegateTo(address)
                  }
                  // então precisamos votar nas propostas
                  try {
                    await Promise.all(
                      votes.map(async ({ proposalId, vote: _vote }) => {
                        // antes de votar, precisamos saber se a proposta está aberta para votação
                        // pegamos o último estado da proposta
                        const proposal = await vote.get(proposalId)
                        // verifica se a proposta está aberta para votação (state === 1 significa está aberta)
                        if (proposal.state === 1) {
                          // se está aberta, então vota nela
                          return vote.vote(proposalId, _vote)
                        }
                        // se a proposta não está aberta, returna vazio e continua
                        return
                      })
                    )
                    try {
                      // se alguma proposta está pronta para ser executada, fazemos isso
                      // a proposta está pronta para ser executada se o estado é igual a 4
                      await Promise.all(
                        votes.map(async ({ proposalId }) => {
                          // primeiro pegamos o estado da proposta novamente, dado que podemos ter acabado de votar
                          const proposal = await vote.get(proposalId)

                          //se o estado é igual a 4 (pronta para ser executada), executamos a proposta
                          if (proposal.state === 4) {
                            return vote.execute(proposalId)
                          }
                        })
                      )
                      // se chegamos aqui, significa que votou com sucesso, então definimos "hasVoted" como true
                      setHasVoted(true)
                      console.log("votado com sucesso")
                    } catch (err) {
                      console.error("falha ao executar votos", err)
                    }
                  } catch (err) {
                    console.error("falha ao votar", err)
                  }
                } catch (err) {
                  console.error("falha ao delegar tokens")
                } finally {
                  // de qualquer modo, volta isVoting para false para habilitar o botão novamente
                  setIsVoting(false)
                }
              }}
            >
              {proposals.map((proposal) => (
                <div key={proposal.proposalId} className="card">
                  <h5>{proposal.description}</h5>
                  <div>
                    {proposal.votes.map(({ type, label }) => {
                      const translations = {
                        Against: "Contra",
                        For: "A favor",
                        Abstain: "Abstenção",
                      }
                      return (
                        <div key={type}>
                          <input
                            type="radio"
                            id={proposal.proposalId + "-" + type}
                            name={proposal.proposalId}
                            value={type}
                            //valor padrão "abster" vem habilitado
                            defaultChecked={type === 2}
                          />
                          <label htmlFor={proposal.proposalId + "-" + type}>
                            {translations[label]}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Votando..."
                  : hasVoted
                    ? "Você já votou"
                    : "Submeter votos"}
              </button>
              {!hasVoted && (
                <small>
                  Isso irá submeter várias transações que você precisará assinar.
                </small>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  };
  
  // Renderiza a tela de cunhagem do NFT.
  return (
    <div className="mint-nft">
      <h1>Cunhe seu NFT 🍪 ele mostra que você é membro desta DAO</h1>
      <div className="btn-hero">
        <Web3Button
          contractAddress={editionDropAddress}
          action={contract => {
            contract.erc1155.claim(0, 1)
          }}
          onSuccess={() => {
            console.log(`🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop.getAddress()}/0`);
          }}
          onError={error => {
            console.error("Failed to mint NFT", error);
          }}
        >
          Mint your NFT (FREE)
        </Web3Button>
      </div>
    </div>
  );

}

export default App;