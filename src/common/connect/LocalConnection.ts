import {ServerConnection} from "./ServerConnection";
import {ClientConnection} from "./ClientConnection";
import {Root} from "../block/Block";
import {DataMap} from "../util/Types";

class LocalServerConnection extends ServerConnection {
  _client: LocalClientConnection;

  doSend(datas: DataMap[]): void {
    this._client.onReceive(datas);
  }

}

class LocalClientConnection extends ClientConnection {
  _server: LocalServerConnection;

  doSend(datas: DataMap[]): void {
    this._server.onReceive(datas);
  }

  destroy() {
    super.destroy();
    this._server.destroy();
  }
}

export function makeLocalConnection(root: Root, watchDesc: boolean = false): [ServerConnection, ClientConnection] {
  let server = new LocalServerConnection(root);
  let client = new LocalClientConnection(watchDesc);
  server._client = client;
  client._server = server;
  return [server, client];
}