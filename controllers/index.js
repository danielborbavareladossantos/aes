const fs = require('fs');
const path = require('path');

const post = async (req, res, next) => {
    console.log(req);
    try {
        
        //validacoes
        if (req.body.nome == null || req.body.nome == "")
            throw new Error('Campo nome inválido!');
        
        if (req.body.chave == null || req.body.chave == "")
            throw new Error('Campo chave inválido!');

        if (req.body.arquivo == null || req.body.arquivo == "")
            throw new Error('Campo arquivo inválido!');

        //implementacao
        
        //salva arquivo
        // await fs.writeFile("files/p.txt", req.body.arquivo, (err) => {
        //     if(err)
        //         throw new Error(err);
        // });

        //const filePath = path.join(__dirname, "");
        //var texto = await lerFile(req.body.arquivo);
        var texto = "a";

        //retorno
        res.render('index', { title: 'Result AES', result: texto });

    } catch (error) {
        var texto = "Não foi possível encriptar o texto, Erro: "+error.message;
        res.render('index', { title: 'Error AES', result: texto });
    }

};

const lerFile = (filePath) => {

    return new Promise(resolve => {

        fs.readFile(filePath, {encoding: 'utf-8'}, (err,data) => {

            if (!err)
                return resolve(data);
            else
                return resolve(err);
            
        });
        
    });
    
}

module.exports = {
    post:post
}