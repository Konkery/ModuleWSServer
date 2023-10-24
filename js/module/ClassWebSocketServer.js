const ClassProxyWS = require('ModuleProxyWS.min.js');
/**
 * @class
 * Класс реализует функционал WebSocket-сервера на Espruino
 * 
 */
class ClassWSServer {
    /**
     * @constructor
     * @param {Number} _port   - порт, по-умолчанию 8080
     */
    constructor(_port) {
        //реализация паттерна синглтон
        if (this.Instance) {
            return this.Instance;
        } else {
            ClassWSServer.prototype.Instance = this;
        }

        this._Name = 'ClassWSServer'; //переопределяем имя типа
        this._Server = undefined;
        this._Proxy = new ClassProxyWS(this);
        this._Port = _port;
        this._Clients = [];
        this.Init();
	}
    /**
     * @method
     * Метод создания вебсокет-сервера
     */
    Init() {
        function pageHandler (req, res) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end('<html><body>404 - Not supported format</body></html>');
        }

        function wsHandler(ws) {
            console.log('Connection established!\nKey: '+ ws.key.hashed);
            ws.RegServices = [];
            this._Clients.push(ws);

            ws.on('message', message => {
                this._Proxy.Receive(message, ws.key.hashed);
            });
            ws.on('close', () => {
                let index = this._Clients.indexOf(ws);
                this._Clients.splice(index,1);
                this._Proxy.RemoveSub(ws.key.hashed);
                console.log('Closed ' + ws.key.hashed);
            });
        }
        
        this._Port = 8080 || this._Port;
        this._Server = require('ws.min.js').createServer(pageHandler);
        this._Server.listen(this._Port);
        console.log('Starting server');
        this._Server.on('websocket', wsHandler.bind(this));
    }
    /**
     * @method
     * Вызовом этого метода WSS получает данные и список ключей, по которому определяюся клиенты, 
     * которым необходимо отправить данные. 
     * @param {Object} data - JSON-объект соответствующий LHP протоколу
     */
    Notify(data) {
        let service = data.MetaData.RegServices;
        this._Clients.filter(client => client.RegServices.includes(service)).forEach(client => {
            client.send(JSON.stringify(data));
        });
    }
}

exports = ClassWSServer;