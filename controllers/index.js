/*
    Describe: Classe para controle das rotas do index.
    Authors: 
        - Daniel Borba Varela dos Santos
        - Bruno Henrique de Borba
    Created: 27/10/2019
    Updated: 27/10/2019
*/

//native libs
const fs = require('fs');
const path = require('path');

/*
    Describe: Função publica que recebe o post do form e retorna dados do arquivo encriptado.
    Params:
        -req: Passado objeto de request recebido no route.
        -res: Passado objeto de response recebido no route.
        -next: Passado parametro de função de callback.
    Return: Retorna para view parametros do resultado ou erro.
*/
const post = async (req, res, next) => {
    
    try {
        
        //*****validacoes*****
        if (req.body.nome == null || req.body.nome == "")
            throw new Error('Campo nome inválido!');
        
        if (req.body.chave == null || req.body.chave == "")
            throw new Error('Campo chave inválido!');

        //*****implementacao*****
        const filePath = path.join(__dirname, '..', 'files', req.file.filename);

        //faz leitura do arquivo
        const texto = await lerFile(filePath);

        //declara vetor da chave e instancia chave em hexadecimal
        var arrayKey = null;

        if (req.body.chave.includes(","))
            arrayKey = req.body.chave.split(",");
        else
            arrayKey = Buffer.from(req.body.chave, 'utf8').toString('hex').match(/.{1,2}/g);
        
        //coloca vetor de chave em forma de matriz
        var arrayBiChave = arrayToBi(arrayKey,req.body.chave);

        //transforma texto simples em hexadecimal
        var arrayTextoSimples = Buffer.from(texto, 'utf8').toString('hex').match(/.{1,2}/g);

        //coloca vetor de texto simples em forma de matriz
        var arrayBiTextoSimples = arrayToBi(arrayTextoSimples,texto);
        
        var result = retornoTexto(arrayBiChave, arrayBiTextoSimples);
        
        //*****retorno*****
        res.render('index', { title: 'Result AES', result: result });

    } catch (error) {
        var texto = "Não foi possível encriptar o texto, Erro: "+error.message;
        res.render('index', { title: 'Error AES', result: texto });
    }

};

/*
    Describe: Função privada que faz leitura do arquivo.
    Params:
        -filePath: Passado string de path do arquivo que devera ser lido.
    Return: Retorna uma string com dados que foram lidos no documento ou a mensagem de erro.
*/
const lerFile = (filePath) => {

    return new Promise(resolve => {

        fs.readFile(filePath, {encoding: 'utf-8'}, (err,data) => {

            if (!err)
                return resolve(data);
            else
                return resolve(err.message);
            
        });
        
    });
    
}

/*
    Describe: Função privada que pega arrays e valores e transforma em texto de retorno esperado.
    Params:
        -arrayKey: Array de chave original.
    Return: Retorna uma string, um texto esperado.
*/
const retornoTexto = (arrayKey, arrayTextoSimples) => {

    var str = "";

    str += "****Chave****";
    str += "\n\n";

    arrayKey.forEach(x => {
        x.forEach(y => {
            str += y+" ";
        });
        str += "\n";
    });

    str += "\n";
    str += "****Texto simples****";
    str += "\n\n";

    arrayTextoSimples.forEach(x => {
        x.forEach(y => {
            str += y+" ";
        });
        str += "\n";
    });

    str += "\n";
    str += "****RoundKey=0****";
    str += "\n";

    return str;

}

/*
    Describe: Função privada que pega vetores e transforma em matriz 4x4.
    Params:
        -array: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna um array 4x4.
*/
const arrayToBi = (array,texto) => {

    var arrayBi = [];
    var pos = 0;

    //faz pck#5
    var pck5 = Buffer.from((((texto.length%4)-4)*-1).toString(), 'utf8').toString('hex');
    
    for (let i = 0; i < 4; i++) {
        var var0,var1,var2,var3;
        var0 = array[pos+0];
        var1 = array[pos+1];
        var2 = array[pos+2];
        var3 = array[pos+3];
        if (var0 == null)
            var0 = pck5;
        if (var1 == null)
            var1 = pck5;
        if (var2 == null)
            var2 = pck5;
        if (var3 == null)
            var3 = pck5;
        arrayBi.push([
            "0x"+var0,
            "0x"+var1,
            "0x"+var2,
            "0x"+var3
        ]);
        pos += 4;
    }

    return arrayBi;

}

/*
    Describe: Função privada que pega vetores e transforma em matriz 4x4.
    Params:
        -array: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna um array 4x4.
*/
// const arrayToBi = (array,texto) => {
    
// }

module.exports = {
    post:post
}