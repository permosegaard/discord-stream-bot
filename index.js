const { dialog } = require("electron");
const { Readable } = require("stream");
const { app, BrowserWindow, ipcMain } = require("electron");

const Discord = require("discord.js");

const Icecast = require("icecast-source");


const DISCORD_TOKEN = "";
const DISCORD_CHANNEL_ID = "";

const ICECAST_PORT = 9000;
const ICECAST_PASS = "";
const ICECAST_MOUNT = "/blah";


let global_window;

let global_icecast_client;

let global_discord_client;
let global_discord_channel;
let global_discord_connection;
let global_discord_dispatcher;
let global_discord_readable_stream;



function fatal(message) {
	dialog.showMessageBoxSync({ type: "error", message: message });

	global_window.close();
}


app.on("ready", () => {
	global_window = new BrowserWindow({
		width: 500,
		height: 200,

		webPreferences: {
			nodeIntegration: true
		}
	})

	global_window.setMenuBarVisibility(false);
	global_window.loadFile("./main.html");

	//global_window.webContents.openDevTools();
});

app.on("window-all-closed", () => {
	if (global_channel !== undefined) { global_channel.leave(); }
	app.quit();
})

ipcMain.on("init", (event) => {
	if (DISCORD_TOKEN == "") { fatal("NO TOKEN SUPPLIED, REBUILD REQUIRED"); }

	/*global_icecast_client = new Icecast({
		port: ICECAST_PORT,
		pass: ICECAST_PASS,
		mount: ICECAST_MOUNT
	}, (err) => { fatal(err); });*/

	global_discord_client = new Discord.Client();

	global_discord_client.once("ready", async () => {
		global_discord_channel = global_discord_client.channels.cache.get(DISCORD_CHANNEL_ID);
		global_discord_connection = await global_discord_channel.join();

		global_discord_client.on("message", message => {
			if (message.content === "!ping") {
				message.channel.send("Pong.");
			}
		});
	});

	global_discord_client.login(DISCORD_TOKEN);
});

ipcMain.on("stream-input", (event) => {
	global_discord_readable_stream = new Readable({
		read() {}
	});

	if (global_discord_dispatcher !== undefined) {
		global_discord_dispatcher.destroy();
	}

	global_discord_dispatcher = global_discord_connection.play(
		global_discord_readable_stream, { type: "ogg/opus" }
	);
});

ipcMain.on("stream-bytes", (event, page) => {
	global_discord_readable_stream.push(page);

	//global_icecast_client.write(page);
});