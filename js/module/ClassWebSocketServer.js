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

        this.name = 'ClassWSServer'; //переопределяем имя типа
        this.server = undefined;
        this.proxy = new ProxyWS(this);
        this.port = _port;
        this.clients = [];
        this.Init();
	}
    /**
     * @method
     * Метод создания вебсокет-сервера
     */
    Init() {
        let page = '<html><body>404 - Not supported format</body></html>';

        function pageHandler (req, res) {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end(page);
        }

        function wsHandler(ws) {
            console.log('Connection established!\nKey: '+ ws.key.hashed);
            this.clients.push(ws);
            console.log(ws);
            ws.on('message', message => {
                console.log('Receiving message: '+ message);
                this.proxy.Receive(message, ws.key.hashed);
            });
            ws.on('close', () => {
                let index = this.clients.indexOf(ws);
                this.clients.splice(index,1);
                this.proxy.RemoveSub(ws.key.hashed);
                console.log('Closed ' + ws.key.hashed);
            });
        }

        this.port = (this.port === undefined) ? 8080 : this.port;
        this.server = require('ws').createServer(pageHandler);
        this.server.listen(this.port);
        console.log('Starting server');
        this.server.on('websocket', wsHandler.bind(this));
    }
    /**
     * @method
     * Вызовом этого метода WSS получает данные и список ключей, по которому определяюся клиенты, 
     * которым необходимо отправить данные. 
     * @param {String} data 
     * @param {[String]} keys 
     */
    Notify(data, keys) {
        this.clients.filter(client => keys.includes(client.key.hashed)).forEach(client => {
            console.log("Send: " + data);
            client.send(data);
            console.log("To " + keys);
        });
    }
}

exports = ClassWSServer;