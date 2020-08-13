import yeast from 'yeast';
import fetch from 'node-fetch';
import WebSocket from 'ws';
interface Options {
	autoConnect: Boolean
}

interface SocketFetchResponse {
	sid: string
	upgrades: string[]
	pingInterval: number
	pingTimeout: number
}


const defaultOptions: Options = {
	autoConnect: true,
}
export default class IO {
	url: string;
	sid: string | null;
	ws: WebSocket | null;
	constructor(url: string, opts: Options = defaultOptions) {
		this.url = url;
		this.sid = null;
		this.ws = null;
		if (opts.autoConnect) {
			this.connect();
		}
	}
	fetchDetails(): Promise<{ response: SocketFetchResponse, url: URL }> {
		return new Promise((res, rej) => {
			const url = new URL(this.url);
			url.pathname += "socket.io/"
			url.searchParams.set("EIO", "3")
			url.searchParams.set("transport", "polling")
			url.searchParams.set("t", yeast())
			fetch(url.href)
				.then(res => res.text())
				.then(text => {
					res({ response: JSON.parse(text.slice(4, text.length - 4)), url });
				})
				.catch(err => { rej(err) })
		})
	}
	async connect() {
		const { response, url } = await this.fetchDetails();
		this.sid = response.sid;
		url.searchParams.set("transport", "websocket");
		url.searchParams.set("sid", this.sid!);
		url.searchParams.delete("t");
		if (this.url.startsWith("https")) {
			url.protocol = "wss"
		} else if (this.url.startsWith("http")) {
			url.protocol = "ws"
		}
		this.ws = new WebSocket(url.href);
		this.ws.on("open", () => {
			console.log("opened")
		})
	}
}