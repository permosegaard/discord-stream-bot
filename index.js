const { Readable } = require("stream");
const { app, BrowserWindow, ipcMain } = require("electron");

const Discord = require("discord.js");


const TOKEN = "";
if (TOKEN == "") { alert("NO TOKEN SUPPLIED, REBUILD REQUIRED"); }

const CHANNEL_NAME = "";


let window;
let client;
let channel;
let connection;
let dispatcher;
let readable_stream;


app.on("ready", () => {
	window = new BrowserWindow({
		width: 1024,
		height: 768,

		webPreferences: {
			nodeIntegration: true
		}
	})

	//window.setMenuBarVisibility(false);
	window.loadFile("./main.html");

	window.webContents.openDevTools();
});

app.on("window-all-closed", () => {
	if (channel !== undefined) { channel.leave(); }
	app.quit();
})

ipcMain.on("init", (event) => {
	client = new Discord.Client();

	client.once("ready", async () => {
		channel = client.channels.cache.get(CHANNEL_NAME);
		connection = await channel.join();

		client.on("message", message => {
			if (message.content === "!ping") {
				message.channel.send("Pong.");
			}
		});
	});

	client.login(TOKEN);
});

ipcMain.on("stream-input", (event) => {
	readable_stream = new Readable({
		read() {}
	});

	if (dispatcher !== undefined) { dispatcher.destroy(); }

	dispatcher = connection.play(readable_stream, { type: "ogg/opus" });
});

ipcMain.on("stream-bytes", (event, page) => {
	readable_stream.push(page);
});
