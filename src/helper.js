const env = require('./environment');
const fs = require('fs');


module.exports = {

    //retorna url com a paginação desejada
    //Entrada: query - termos de busca (String) / page - nº da paginação (Number)
    url(query, page = 1) {
        return env.baseUrl + query + `&searchPage=${page}#results`
    },

    //Finaliza a execução do sistema;
    //Entrada: texto - texto apresentado ao finalizar processo (String)
    fimProcesso(texto) {
        console.log("\n", texto);
        setTimeout((function () {
            process.on('exit', () => console.log("..."));
        }), 5000);
    },

    /*  Limpa mensagens anteriores, apresentando as mensagens fixas e as novas no console;
        Entrada:  cliTitulo - Título principal que será apresentado no console (String) /
                texto - último texto a ser apresentado (String) /
                cliAcumulado - histórico de texto que devem ser apresentados no console (String)
    */
    consoleCLI(cliTitulo, texto, cliAcumulado) {
        console.clear();
        console.log(cliTitulo, cliAcumulado, texto)
    },


    //Altera ponto e vírgula dos caracteres de todos os dados e substitui por vírgula (altera a referência/sem retorno);
    //Entrada: dados - referência com todos os objetos dado para alteração (referência array)
    alterarTodosPontoVirgula(dados) {

        const buscar = /;/g;
        for (const [i, dado] of dados.entries()) {
            dados[i].revista = dados[i].revista.replace(buscar, ",")
            dados[i].edicao = dados[i].edicao.replace(buscar, ",");
            dados[i].titulo = dados[i].titulo.replace(buscar, ",");
            dados[i].resumoLink = dados[i].resumoLink.replace(buscar, ",");
            dados[i].pdfLink = dados[i].pdfLink.replace(buscar, ",");
            dados[i].autor = dados[i].autor.replace(buscar, ",");
            dados[i].palavraChave = dados[i].palavraChave.replace(buscar, ",");
            dados[i].resumo = dados[i].resumo.replace(buscar, ",");
        }
    },

    /*  Salva/sobrescreve em arquivo tipo txt o texto enviado p/parâmetro e finaliza o processo;
        Entradao: nomeArq - nome do arquivo a ser salvo (String) -
                texto - texto para ser salvo (String); 
    */
    salvarFinalizar(nomeArq, texto) {

        //salvando dados e finalizando processo
        fs.writeFile(nomeArq, texto, 'utf-8', (e) => {
            if (e) {
                this.fimProcesso("ERRO: Falha ao salvar os dados!");
            } else {
                this.fimProcesso("\n\n***  Dados salvos com sucesso  ***\n\n Arquivo " + nomeArq +
                    " criado/sobrescrito com sucesso.\n\n");
            }

        });
    },

    //Le o array de dados e retorna string com os dados formatados;
    //Entrada: dados - referência com todos os objetos dado (referência array);
    //Retorno: Todos os dados em tipagem string e seguindo o formato csv;
    configTexto(dados) {
        let texto = "Título;Resumo;Autores;Revista;Edição;Palavras chave;Resumo link;Pdf link\n";
        dados.forEach(dado => {
            texto = texto.concat(
                dado.titulo + ";" +
                dado.resumo + ";" +
                dado.autor + ";" +
                dado.revista + ";" +
                dado.edicao + ";" +
                dado.palavraChave + ";" +
                dado.resumoLink + ";" +
                dado.pdfLink + "\n"
            );
        });

        return texto;
    },

    //Tenta criar o diretório para salvar o arquivo final
    async criarDiretorio() {
        try {
            await fs.mkdirSync(env.pastaSave, () => { });
        } catch (e) { }
    }
}