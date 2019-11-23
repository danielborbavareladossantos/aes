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
const utils = require('./utils');

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
        
        //faz rotacionamento de valores da palavra
        var return_rotWord = rotWord(arrayBiChave);

        //faz substituição dos valores dentro do s-box
        var return_subWord = subWord(return_rotWord);

        //faz roundContant com tabela fixa
        var return_roundConstant = roundConstant(1);

        //faz xor entre passo 3 e passo 4
        var return_RoundConstantXorsubWord = RoundConstantXorsubWord(return_roundConstant,return_subWord);
        
        //faz xor entre passo 5 e roundKeyAnterior
        var return_RKAXorRCXorSW = RKAXorRCXorSW(getFirstWordRoundKey(arrayBiChave),return_RoundConstantXorsubWord);
        
        var return_geracaoChaves = geracaoChavesPai(arrayBiChave,return_RKAXorRCXorSW);

        var return_executarFour = executarFour(return_geracaoChaves, arrayBiTextoSimples);
        // console.log(return_executarFour)

        var result = retornoTexto(arrayBiChave, arrayBiTextoSimples, return_geracaoChaves, return_executarFour, req.body.nome);
        
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
const retornoTexto = (arrayKey, arrayTextoSimples, schuledKeys, executafourP, v) => {

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

    for (let i = 0; i < schuledKeys.length; i++) {
        const element = schuledKeys[i];

        str += "\n";
        str += "****RoundKey="+i+"****";
        str += "\n";

        element.forEach(x => {
            x.forEach(y => {
                str += y+" ";
            });
            str += "\n";
        });
    }

    var i = 1;
    for (let x = 0; x < executafourP.length; x+=4) {

        if ((0+x) < executafourP.length) {
            str += "\n";
            str += "****addRoundKey-Round "+(i-1)+"****";
            str += "\n";

            executafourP[0+x].forEach(x => {
                x.forEach(y => {
                    str += y+" ";
                });
                str += "\n";
            });
        }

        if ((1+x) < executafourP.length) {
            str += "\n";
            str += "****SubBytes-Round "+i+"****";
            str += "\n";

            executafourP[1+x].forEach(x => {
                x.forEach(y => {
                    str += y+" ";
                });
                str += "\n";
            });
        }

        if ((2+x) < executafourP.length) {
            str += "\n";
            str += "****ShiftRows-Round "+i+"****";
            str += "\n";

            executafourP[2+x].forEach(x => {
                x.forEach(y => {
                    str += y+" ";
                });
                str += "\n";
            });
        }

        if ((3+x) < executafourP.length && i != 10) {
            str += "\n";
            str += "****MixedColumns-Round "+i+"****";
            str += "\n";

            executafourP[3+x].forEach(x => {
                x.forEach(y => {
                    str += y+" ";
                });
                str += "\n";
            });
        }
        
        i++;

    }

    str += "\n";
    str += "****Texto cifrado****";
    str += "\n";

    executafourP[executafourP.length-1].forEach(x => {
        x.forEach(y => {
            str += y+" ";
        });
        str += "\n";
    });


    fs.writeFile(v, str, function(err) {

        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });

    return str;

}

/*
    Describe: Função privada que pega vetores e transforma em matriz 4x4.
    Params:
        -array: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna um array 4x4.
*/
const arrayToBi = (array,texto) => {

    //faz pck#5
    //var pck5 = Buffer.from((((texto.length%4)-4)*-1).toString(), 'utf8').toString('hex');

    var linhas = [];
    var vetor0 = [], vetor1 = [], vetor2 = [], vetor3 = [];
    var pos = 0;
    for (let i = 0; i < array.length; i++) {
        var var0,var1,var2,var3;
        var0 = array[pos+0];
        var1 = array[pos+1];
        var2 = array[pos+2];
        var3 = array[pos+3];
        if (var0 != null)
            vetor0.push("0x"+var0);
        if (var1 != null)
            vetor1.push("0x"+var1);
        if (var2 != null)
            vetor2.push("0x"+var2);
        if (var3 != null)
            vetor3.push("0x"+var3);
        pos += 4;
    }
    linhas.push(vetor0);
    linhas.push(vetor1);
    linhas.push(vetor2);
    linhas.push(vetor3);
    
    return linhas;

}

/*
    Describe: Função que retorna a primeira palavra da RoundKey anterior.
    Params:
        -roundKey: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna palavra.
*/
const getFirstWordRoundKey = (roundKey) => {
    var array = [];
    array.push(roundKey[0][0]);
    array.push(roundKey[1][0]);
    array.push(roundKey[2][0]);
    array.push(roundKey[3][0]);
    return array;
}

/*
    Describe: Função que retorna a segunda palavra da RoundKey anterior.
    Params:
        -roundKey: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna palavra.
*/
const getSecondWordRoundKey = (roundKey) => {
    var array = [];
    array.push(roundKey[0][1]);
    array.push(roundKey[1][1]);
    array.push(roundKey[2][1]);
    array.push(roundKey[3][1]);
    return array;
}

/*
    Describe: Função que retorna a segunda palavra da RoundKey anterior.
    Params:
        -roundKey: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna palavra.
*/
const getThirdWordRoundKey = (roundKey) => {
    var array = [];
    array.push(roundKey[0][2]);
    array.push(roundKey[1][2]);
    array.push(roundKey[2][2]);
    array.push(roundKey[3][2]);
    return array;
}

/*
    Describe: Função que retorna a ultima palavra da RoundKey anterior.
    Params:
        -roundKey: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna palavra.
*/
const getLastWordRoundKey = (roundKey) => {
    var array = [];
    array.push(roundKey[0][3]);
    array.push(roundKey[1][3]);
    array.push(roundKey[2][3]);
    array.push(roundKey[3][3]);
    return array;
}

/*
    Describe: Função que rotaciona os bytes da palavra
    Params:
        -roundKey: Vetor que deve ser quebrado a cada 4 posicoes.
    Return: Retorna palavra.
*/
const rotWord = (roundKey) => {
    var ultimaColuna = getLastWordRoundKey(roundKey);
    var primeiroValor = ultimaColuna.shift();
    ultimaColuna.push(primeiroValor);
    return ultimaColuna;
}

/*
    Describe: Função que substitui os bytes da palavra
    Params:
        -lastColumn: Vetor da palavra
    Return: Retorna palavra substituido.
*/
const subWord = (lastColumn) => {
    var newLastColumn = [];
    lastColumn.forEach(element => {
        var linha = null;
        var coluna = null;

        if (element[2].includes('a')) {
            linha = 10;
        } else if (element[2].includes('b')) {
            linha = 11;
        } else if (element[2].includes('c')) {
            linha = 12;
        } else if (element[2].includes('d')) {
            linha = 13;
        } else if (element[2].includes('e')) {
            linha = 14;
        } else if (element[2].includes('f')) {
            linha = 15;
        } else {
            linha = eval(element[2]);
        }

        if (element[3].includes('a')) {
            coluna = 10;
        } else if (element[3].includes('b')) {
            coluna = 11;
        } else if (element[3].includes('c')) {
            coluna = 12;
        } else if (element[3].includes('d')) {
            coluna = 13;
        } else if (element[3].includes('e')) {
            coluna = 14;
        } else if (element[3].includes('f')) {
            coluna = 15;
        } else {
            coluna = eval(element[3]);
        }

        newLastColumn.push(utils.sbox[linha][coluna]);
    });

    return newLastColumn;
}

/*
    Describe: Função que verifica a roundKey position e gera uma roundConstant
    Params:
        -numeroRoundKey: Int que define posição da roundKey
    Return: Retorna palavra.
*/
const roundConstant = (numeroRoundKey) => {
    return [utils.vetorRoundConstant[numeroRoundKey-1],"0","0","0"];
}

/*
    Describe: Função que faz o XOR com a RoundConstant
    Params:
        -roundConstant: Palavra
        -subWord: Palavra
    Return: Retorna palavra.
*/
const RoundConstantXorsubWord = (roundConstant, subWord) => {
    var array = [];
    array.push("0x"+(parseInt(roundConstant[0], 16)^parseInt(subWord[0], 16)).toString(16));
    array.push("0x"+(parseInt(roundConstant[1], 16)^parseInt(subWord[1], 16)).toString(16));
    array.push("0x"+(parseInt(roundConstant[2], 16)^parseInt(subWord[2], 16)).toString(16));
    array.push("0x"+(parseInt(roundConstant[3], 16)^parseInt(subWord[3], 16)).toString(16));
    return array;
}

/*
    Describe: Função que faz o XOR com a primeira palavra da RoundKey anterior com a palavra RoundConstantXorsubWord
    Params:
        -RoundKeyAnterior: Palavra
        -RoundConstantXorsubWord: Palavra
    Return: Retorna palavra.
*/
const RKAXorRCXorSW = (RoundKeyAnterior, RoundConstantXorsubWord) => {
    var array = [];
    array.push("0x"+(parseInt(RoundKeyAnterior[0], 16)^parseInt(RoundConstantXorsubWord[0], 16)).toString(16));
    array.push("0x"+(parseInt(RoundKeyAnterior[1], 16)^parseInt(RoundConstantXorsubWord[1], 16)).toString(16));
    array.push("0x"+(parseInt(RoundKeyAnterior[2], 16)^parseInt(RoundConstantXorsubWord[2], 16)).toString(16));
    array.push("0x"+(parseInt(RoundKeyAnterior[3], 16)^parseInt(RoundConstantXorsubWord[3], 16)).toString(16));
    return array;
}

/*
    Describe: Função que faz xor da geração de chaves
    Params:
        -palavraRoundKeyAnterior: Palavra
        -palavraRoundKeyAtual: Palavra
    Return: Retorna palavra.
*/
const XorGeracaoChaves = (palavraRoundKeyAnterior, palavraRoundKeyAtual) => {
    var array = [];
    array.push(checkOneChar((parseInt(palavraRoundKeyAnterior[0], 16)^parseInt(palavraRoundKeyAtual[0], 16)).toString(16)));
    array.push(checkOneChar((parseInt(palavraRoundKeyAnterior[1], 16)^parseInt(palavraRoundKeyAtual[1], 16)).toString(16)));
    array.push(checkOneChar((parseInt(palavraRoundKeyAnterior[2], 16)^parseInt(palavraRoundKeyAtual[2], 16)).toString(16)));
    array.push(checkOneChar((parseInt(palavraRoundKeyAnterior[3], 16)^parseInt(palavraRoundKeyAtual[3], 16)).toString(16)));
    return array;
}

const checkOneChar = (string) => {
    if (string.length == 1)
        return "0x0"+string;
    return "0x"+string;
}


/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const geracaoChaves = (RoundKey0, primeiraPalavra) => {
    var gerado1 = XorGeracaoChaves(getSecondWordRoundKey(RoundKey0), primeiraPalavra);
    var gerado2 = XorGeracaoChaves(getThirdWordRoundKey(RoundKey0), gerado1);
    var gerado3 = XorGeracaoChaves(getLastWordRoundKey(RoundKey0), gerado2);
    var roundkey = [primeiraPalavra,gerado1,gerado2,gerado3];
    return roundkey;
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const geracaoChavesPai = (RoundKey0, primeiraPalavra) => {
    var schuledKeys = [];
    var roundkey1 = transpose(geracaoChaves(RoundKey0,primeiraPalavra));
    schuledKeys.push(RoundKey0);
    schuledKeys.push(roundkey1);
    for (let i = 2; i < 11; i++) {
        
        //faz rotacionamento de valores da palavra
        var return_rotWord = rotWord(schuledKeys[i-1]);

        //faz substituição dos valores dentro do s-box
        var return_subWord = subWord(return_rotWord);

        //faz roundContant com tabela fixa
        var return_roundConstant = roundConstant(i);

        //faz xor entre passo 3 e passo 4
        var return_RoundConstantXorsubWord = RoundConstantXorsubWord(return_roundConstant,return_subWord);
        
        //faz xor entre passo 5 e roundKeyAnterior
        var return_RKAXorRCXorSW = RKAXorRCXorSW(getFirstWordRoundKey(schuledKeys[i-1]),return_RoundConstantXorsubWord);

        var roundkey2 = transpose(geracaoChaves(schuledKeys[i-1],return_RKAXorRCXorSW));

        schuledKeys.push(roundkey2);
    }

    return schuledKeys;
    
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const addRoundKey = (textoSimples, RoundKey0) => {
    var total = [];
    for (let i = 0; i < RoundKey0.length; i++) {
        var array = [];
        array.push(checkOneChar((parseInt(textoSimples[i][0], 16)^parseInt(RoundKey0[i][0], 16)).toString(16)));
        array.push(checkOneChar((parseInt(textoSimples[i][1], 16)^parseInt(RoundKey0[i][1], 16)).toString(16)));
        array.push(checkOneChar((parseInt(textoSimples[i][2], 16)^parseInt(RoundKey0[i][2], 16)).toString(16)));
        array.push(checkOneChar((parseInt(textoSimples[i][3], 16)^parseInt(RoundKey0[i][3], 16)).toString(16)));
        total.push(array);
    }
    return total;
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const subBytes = (RoundKeySB) => {
    var arraySB = [];
    RoundKeySB.forEach(linha => {
        var arrayL = [];
        linha.forEach(element => {
            var linha = null;
            var coluna = null;

            if (element[2].includes('a')) {
                linha = 10;
            } else if (element[2].includes('b')) {
                linha = 11;
            } else if (element[2].includes('c')) {
                linha = 12;
            } else if (element[2].includes('d')) {
                linha = 13;
            } else if (element[2].includes('e')) {
                linha = 14;
            } else if (element[2].includes('f')) {
                linha = 15;
            } else {
                linha = eval(element[2]);
            }

            if (element[3].includes('a')) {
                coluna = 10;
            } else if (element[3].includes('b')) {
                coluna = 11;
            } else if (element[3].includes('c')) {
                coluna = 12;
            } else if (element[3].includes('d')) {
                coluna = 13;
            } else if (element[3].includes('e')) {
                coluna = 14;
            } else if (element[3].includes('f')) {
                coluna = 15;
            } else {
                coluna = eval(element[3]);
            }

            arrayL.push(utils.sbox[linha][coluna]);
        });
        arraySB.push(arrayL);
    });
    
    return arraySB;
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const shiftRows = (RoundKeySR) => {
    var arraySR = [];
    RoundKeySR.forEach(linha => {
        arraySR.push(linha);
    });
    
    var rk1 = arraySR[1].shift();
    arraySR[1].push(rk1);

    var rk2_1 = arraySR[2].shift();
    var rk2_2 = arraySR[2].shift();
    arraySR[2].push(rk2_1);
    arraySR[2].push(rk2_2);

    var rk3_1 = arraySR[3].shift();
    var rk3_2 = arraySR[3].shift();
    var rk3_3 = arraySR[3].shift();
    arraySR[3].push(rk3_1);
    arraySR[3].push(rk3_2);
    arraySR[3].push(rk3_3);

    return arraySR;
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
var imc = 0;
const mixColumnsTableL = (shiftRows) => {

    //##############
    var b1 = 
    getHexE(retornoH(multiplicar(shiftRows[0][0],utils.multiplicacao[0][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][0],utils.multiplicacao[0][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][0],utils.multiplicacao[0][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][0],utils.multiplicacao[0][3])));

    var b2 = 
    getHexE(retornoH(multiplicar(shiftRows[0][0],utils.multiplicacao[1][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][0],utils.multiplicacao[1][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][0],utils.multiplicacao[1][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][0],utils.multiplicacao[1][3])));

    var b3 = 
    getHexE(retornoH(multiplicar(shiftRows[0][0],utils.multiplicacao[2][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][0],utils.multiplicacao[2][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][0],utils.multiplicacao[2][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][0],utils.multiplicacao[2][3])));

    var b4 = 
    getHexE(retornoH(multiplicar(shiftRows[0][0],utils.multiplicacao[3][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][0],utils.multiplicacao[3][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][0],utils.multiplicacao[3][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][0],utils.multiplicacao[3][3])));

    //##############

    var b5 = 
    getHexE(retornoH(multiplicar(shiftRows[0][1],utils.multiplicacao[0][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][1],utils.multiplicacao[0][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][1],utils.multiplicacao[0][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][1],utils.multiplicacao[0][3])));

    var b6 = 
    getHexE(retornoH(multiplicar(shiftRows[0][1],utils.multiplicacao[1][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][1],utils.multiplicacao[1][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][1],utils.multiplicacao[1][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][1],utils.multiplicacao[1][3])));

    var b7 = 
    getHexE(retornoH(multiplicar(shiftRows[0][1],utils.multiplicacao[2][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][1],utils.multiplicacao[2][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][1],utils.multiplicacao[2][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][1],utils.multiplicacao[2][3])));

    var b8 = 
    getHexE(retornoH(multiplicar(shiftRows[0][1],utils.multiplicacao[3][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][1],utils.multiplicacao[3][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][1],utils.multiplicacao[3][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][1],utils.multiplicacao[3][3])));

    //##############
    var b9 = 
    getHexE(retornoH(multiplicar(shiftRows[0][2],utils.multiplicacao[0][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][2],utils.multiplicacao[0][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][2],utils.multiplicacao[0][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][2],utils.multiplicacao[0][3])));

    var b10 = 
    getHexE(retornoH(multiplicar(shiftRows[0][2],utils.multiplicacao[1][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][2],utils.multiplicacao[1][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][2],utils.multiplicacao[1][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][2],utils.multiplicacao[1][3])));

    var b11 = 
    getHexE(retornoH(multiplicar(shiftRows[0][2],utils.multiplicacao[2][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][2],utils.multiplicacao[2][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][2],utils.multiplicacao[2][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][2],utils.multiplicacao[2][3])));

    var b12 = 
    getHexE(retornoH(multiplicar(shiftRows[0][2],utils.multiplicacao[3][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][2],utils.multiplicacao[3][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][2],utils.multiplicacao[3][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][2],utils.multiplicacao[3][3])));

    //##############
    var b13 = 
    ChecarZeroE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0])))^
    ChecarZeroE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[0][1])))^
    ChecarZeroE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2])))^
    ChecarZeroE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[0][3])));

    var b14 = 
    getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[1][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[1][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[1][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[1][3])));

    var b15 = 
    getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[2][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[2][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[2][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[2][3])));

    var b16 = 
    getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[3][0])))^
    getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[3][1])))^
    getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[3][2])))^
    getHexE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[3][3])));

    if (imc == 0) {
        // b13 = 
        // ChecarZero(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0])))^
        // ChecarZero(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[0][1])))^
        // ChecarZero(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2])))^
        // ChecarZero(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[0][3])));

        console.log("resultado multi com tabela======")
        console.log(getHexE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[0][3],imc))))
        console.log("resultado multi======")
        console.log(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[0][3],imc)))
        console.log("valor1======")
        console.log(shiftRows[3][3])
        console.log("valor2======")
        console.log(utils.multiplicacao[0][3])
        console.log("======")

        // console.log("getHexE(1)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0],imc))));
        // console.log("getHexE(2)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[0][1],imc))));
        // console.log("getHexE(3)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2],imc))));
        // console.log("getHexE(4)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][3],imc))));
    }

    if (imc == 3) {
        // b13 = 
        // getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0],imc)))^
        // 0x00^
        // 0x2f^
        // 0x39;

        // b13 = 
        // getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0],imc)))^
        // ChecarZero(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[3][1])))^
        // getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2])))^
        // getHexE(retornoH(multiplicar(shiftRows[3][3],utils.multiplicacao[0][3])));
        // console.log("resultado multi com tabela======")
        // console.log(getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[3][1]))))
        // console.log("resultado multi======")
        // console.log(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[3][1])))
        // console.log("valor1======")
        // console.log(shiftRows[3][3])
        // console.log("valor2======")
        // console.log(utils.multiplicacao[0][3])
        // console.log("======")

        // console.log("getHexE(1)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[0][3],utils.multiplicacao[0][0],imc))));
        // console.log("getHexE(2)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[1][3],utils.multiplicacao[0][1],imc))));
        // console.log("getHexE(3)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2],imc))));
        // console.log("getHexE(4)");
        // console.log(getHexE(retornoH(multiplicar(shiftRows[2][3],utils.multiplicacao[0][3],imc))));
        // console.log("retornoH(cc)");
        // console.log(retornoH(cc));
        // console.log("1============");
        // console.log(shiftRows[2][3]);
        // console.log(utils.multiplicacao[0][2]);
        // console.log("2============");
        // console.log(shiftRows[3][3]);
        // console.log(utils.multiplicacao[0][3]);
        // console.log("=============");
        // console.log("m============");
        // console.log("1============");
        // console.log(multiplicar(shiftRows[2][3],utils.multiplicacao[0][2]));
        // console.log("2============");
        // console.log(multiplicar(shiftRows[2][3],utils.multiplicacao[0][3]));
    }

    result =  [ 
        [retornoH(b1), retornoH(b5), retornoH(b9), retornoH(b13)], 
        [retornoH(b2), retornoH(b6), retornoH(b10), retornoH(b14)], 
        [retornoH(b3), retornoH(b7), retornoH(b11), retornoH(b15)], 
        [retornoH(b4), retornoH(b8), retornoH(b12), retornoH(b16)], 
    ];

    imc++;

    
    return result;
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const ChecarZeroE = (v) => {
    if (v == 0x00)
        return "0x00";
    return getHexE(v);
}

const ChecarZero = (v) => {
    if (v == 0x00)
        return "0x00";
    return getHex(v);
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const retornoH = (b) => {
    if (b.toString(16).length > 2)
        return verificaValorUnico(b-parseInt("0xff", 16));
    return verificaValorUnico(b);
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const verificaValorUnico = (b) => {
    if (b.toString(16).length == 1)
        return "0x0"+b.toString(16);
    return "0x"+b.toString(16);
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
// const multiplicar = (x, y) => {
//     var termo1 = parseInt(getHex(x), 16);
//     var termo2 = parseInt(getHex(y), 16);
//     var result = termo1+termo2;
//     if (
//         termo1.toString(16).includes("0x00") || 
//         termo1.toString(16).includes("0x0") ||
//         termo2.toString(16).includes("0x00") || 
//         termo2.toString(16).includes("0x0")
//     )
//         return 0x00;
//     if (
//         termo1.toString(16).includes("0x01") || 
//         termo1.toString(16).includes("0x1")
//     )
//         return termo2;
//     if (
//         termo2.toString(16).includes("0x01") || 
//         termo2.toString(16).includes("0x1")
//     )
//             return termo1;
//     return result;
// }
var multiplicar = (termo1, termo2) => {
    // if (
    //     termo1.toString(16).includes("0x00") || 
    //     termo2.toString(16).includes("0x00")
    // )
    //     return 0x00;
    if (termo1 == 0x01)
        return parseInt(getHex(termo2), 16);
    if (termo2 == 0x01)
        return parseInt(getHex(termo1), 16);
        
    return parseInt(getHex(termo1), 16)+parseInt(getHex(termo2), 16);
}

var multiplicar = (termo1, termo2, i) => {
    // if (i == 0) {
    //     console.log("==========");
    //     console.log("termo1");
    //     console.log(termo1);
    //     console.log("==========");
    //     console.log("termo2");
    //     console.log(termo2);
    // }
    if (termo1 == 0x00 || termo2 == 0x00)
        return 0x00;
    if (termo1 == 0x01)
        return parseInt(getHex(termo2), 16);
    if (termo2 == 0x01)
        return parseInt(getHex(termo1), 16);
    
    return parseInt(getHex(termo1), 16)+parseInt(getHex(termo2), 16);
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const getHex = (valor) => {
    var linha = null;
    var coluna = null;

    if (valor[2].includes('a')) {
        linha = 10;
    } else if (valor[2].includes('b')) {
        linha = 11;
    } else if (valor[2].includes('c')) {
        linha = 12;
    } else if (valor[2].includes('d')) {
        linha = 13;
    } else if (valor[2].includes('e')) {
        linha = 14;
    } else if (valor[2].includes('f')) {
        linha = 15;
    } else {
        linha = eval(valor[2]);
    }

    if (valor[3].includes('a')) {
        coluna = 10;
    } else if (valor[3].includes('b')) {
        coluna = 11;
    } else if (valor[3].includes('c')) {
        coluna = 12;
    } else if (valor[3].includes('d')) {
        coluna = 13;
    } else if (valor[3].includes('e')) {
        coluna = 14;
    } else if (valor[3].includes('f')) {
        coluna = 15;
    } else {
        coluna = eval(valor[3]);
    }

    return utils.TabelaL[linha][coluna];
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const getHexE = (valor) => {
    var linha = null;
    var coluna = null;

    if (valor[2].includes('a')) {
        linha = 10;
    } else if (valor[2].includes('b')) {
        linha = 11;
    } else if (valor[2].includes('c')) {
        linha = 12;
    } else if (valor[2].includes('d')) {
        linha = 13;
    } else if (valor[2].includes('e')) {
        linha = 14;
    } else if (valor[2].includes('f')) {
        linha = 15;
    } else {
        linha = eval(valor[2]);
    }

    if (valor[3].includes('a')) {
        coluna = 10;
    } else if (valor[3].includes('b')) {
        coluna = 11;
    } else if (valor[3].includes('c')) {
        coluna = 12;
    } else if (valor[3].includes('d')) {
        coluna = 13;
    } else if (valor[3].includes('e')) {
        coluna = 14;
    } else if (valor[3].includes('f')) {
        coluna = 15;
    } else {
        coluna = eval(valor[3]);
    }

    return utils.TabelaE[linha][coluna];
}

/*
    Describe: Função que faz a geração de chaves
    Params:
        -RoundKey0: Palavra
        -primeiraPalavra: Palavra
    Return: Retorna palavra.
*/
const executarFour = (schuledKeys, textoSimples) => {
    var arrayList = [];
    var return_addRoundKeyArray = null;
    var return_subBytes = null;
    var return_shiftRows = null;
    var return_mixColumnsTableL = null;

    return_addRoundKeyArray = addRoundKey(textoSimples, schuledKeys[0]);
    arrayList.push(return_addRoundKeyArray);
    
    for (let i = 1; i < 11; i++) {
        
        return_subBytes = subBytes(return_addRoundKeyArray);
        arrayList.push(return_subBytes);

        return_shiftRows = shiftRows(JSON.parse(JSON.stringify(return_subBytes)));
        arrayList.push(return_shiftRows);

        return_mixColumnsTableL = mixColumnsTableL(return_shiftRows);
        arrayList.push(return_mixColumnsTableL);

        return_addRoundKeyArray = addRoundKey(return_mixColumnsTableL, schuledKeys[i]);
        arrayList.push(return_addRoundKeyArray);

    }
    return arrayList;
}

function transpose(matrix) {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

module.exports = {
    post:post
}