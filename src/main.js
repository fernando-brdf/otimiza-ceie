const cheerio = require('cheerio');
const request = require('request-promise');
const helper = require('./helper');
const env = require('./environment');


function start() {
    var query,                          //salva os termos de pesquisa, lido pelo console (termos de pesquisa)
        cliAcumulado = "",              //concatena textos que serão apresentado após limpar as mensagens do console
        qtPages = undefined;            //quantidade de páginas de pesquisa

    const cliTitulo = "\t\t\t >>>>> Indexação de artigos - CEIE <<<<< \n\n";

    leituraQuery();


    //faz a leitura da query para chamar a função de processo de indexação
    function leituraQuery() {
        helper.consoleCLI(cliTitulo, "Pesquisar termo: ", cliAcumulado);

        //leitura da query(termos de pesquisa)
        process.stdin.on('readable', () => {

            const leitura = process.stdin.read();
            query = String(leitura);
            query = query.replace(/\n/, "");
            query = query.replace(/\r/, "");
            query = query.replace(/\//, "");

            processoIndexacao();
        });
    }

    //processo de requisição, leitura, indexação e salvamento dos dados
    async function processoIndexacao() {

        const dados = [];

        cliAcumulado += "\nTermo pesquisado: " + query + "\n";
        helper.consoleCLI(cliTitulo, "\nIniciando processo de requisições....\n", cliAcumulado);

        try {

            //busca da paginação e primeira página
            await buscarLista(helper.url(query), dados);

            //busca dos demais dados 
            for (cont = 2; cont <= qtPages; cont++) {

                helper.consoleCLI(cliTitulo, "\nIniciando processo de requisições....\n" + cont + " de " + qtPages + " - Buscando......", cliAcumulado);
                await buscarLista(helper.url(query, cont), dados);
                helper.consoleCLI(cliTitulo, "\nIniciando processo de requisições....\n" + cont + " de " + qtPages + " - Finalizado!", cliAcumulado);

            }

            cliAcumulado += "\nIniciando processo de requisições....\n" + qtPages + " de " + qtPages + " - Finalizado!\n";

            //complementação dos dados na área de resumo
            helper.consoleCLI(cliTitulo, "\nSegunda etapa de requisição...", cliAcumulado);
            await getResumoDados(dados);

            //tratamento dos dados
            helper.consoleCLI(cliTitulo, "\nTratando dados...", cliAcumulado);
            helper.alterarTodosPontoVirgula(dados);

            //salvando os dados em csv e finalizando processo
            helper.consoleCLI(cliTitulo, "\nSalvando dados...", cliAcumulado);
            salvarDados(dados);

        } catch (e) {
            helper.fimProcesso("\nERRO: Não foi possível indexar sua pesquisa\nExecução Abortada.")
        }
    }


    //busca todos os itens da pesquisa e salva na constante array dados
    async function buscarLista(url, dados) {

        return request(url, (e, res, body) => {
            if (e) helper.fimProcesso("Erro: Falha durante a requisição dos dados.")

            let $ = cheerio.load(body);
            let lista = $(".listing tbody tr");

            //buscando quantidade de paginações
            if (!qtPages) qtPages = $(lista.last()[0]).find("td").text().split(" ")[2];

            lista.map((i, val) => {
                const item = $(val).children();
                if (item.length == 4) {
                    dados.push({
                        revista: $(item[0]).first().text(),
                        edicao: $(item[1]).first().text(),
                        titulo: $(item[2]).first().text(),
                        resumoLink: $(item[3]).children().first().attr("href"),
                        pdfLink: $(item[3]).children().last().attr("href")
                    })
                }
            });

        }).catch((e) => {
            helper.fimProcesso("Erro: Falha durante a requisição dos dados.")
        });

    }

    //complementa a variavel dados com os dados de autor, palavra chave e resumo
    async function getResumoDados(dados) {
        const totalDados = dados.length;

        for (const [index, dado] of dados.entries()) {
            await request(dado.resumoLink, (e, res, body) => {
                console.clear();
                helper.consoleCLI(cliTitulo, "\nSegunda etapa de requisição...\n" +
                    Number(index + 1) + " de " + totalDados + " itens.", cliAcumulado);

                if (e) helper.fimProcesso("Erro: Falha durante a requisição dos dados específicos do resumo.");
                let $ = cheerio.load(body);
                const autor = $("#authorString").text(),
                    palavraChave = $("#articleSubject div").text(),
                    resumo = $("#articleAbstract div").text();

                dados[index].autor = autor;
                dados[index].palavraChave = palavraChave;
                dados[index].resumo = resumo;

            }).catch((e) => {
                helper.fimProcesso("ERRO: Falha durante a requisição dos dados específicos do resumo.");
            });
        }

        cliAcumulado += "\nSegunda etapa de requisição...\n" +
            totalDados + " de " + totalDados + " itens.\n";
        return dados;
    }



    //salvar dados em um arquivo txt.csv
    //Título, Resumo, Autores, Revista, Edição, Palavras chave, resumo link, pdf link
    async function salvarDados(dados) {
        const nomeArq = env.pastaSave + query.concat(".csv");

        //tenta criar diretório caso ñ exista
        await helper.criarDiretorio();

        const texto = helper.configTexto(dados);

        //salva os dados e finaliza o processo
        helper.salvarFinalizar(nomeArq, texto);

    }

}

exports.start = start;