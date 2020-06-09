const { dialog } = require("electron");
const { Readable } = require("stream");
const { app, BrowserWindow, ipcMain } = require("electron");

const Discord = require("discord.js");

const Icecast = require("icecast-source");

const config = require("./config.js");


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
	if (global_discord_channel !== undefined) { global_discord_channel.leave(); }
	app.quit();
})

ipcMain.on("init", (event) => {
	const configs = [
		config.DISCORD_TOKEN,
		config.DISCORD_CHANNEL_ID,
		config.ICECAST_HOST,
		config.ICECAST_PORT,
		config.ICECAST_PASS,
		config.ICECAST_MOUNT
	];

	for (const config of configs) {
		if (config == "") { fatal("invalid config, check and rerun"); }
	}


	global_icecast_client = new Icecast({
		host: config.ICECAST_HOST,
		port: config.ICECAST_PORT,
		pass: config.ICECAST_PASS,
		password: config.ICECAST_PASS,
		mount: config.ICECAST_MOUNT,
		"type": "audio/ogg"
	}, (err) => { if (err) { fatal(err); } });


	global_discord_client = new Discord.Client();

	global_discord_client.once("ready", async () => {
		global_discord_channel = global_discord_client.channels.cache.get(config.DISCORD_CHANNEL_ID);
		global_discord_connection = await global_discord_channel.join();

		global_discord_client.on("message", message => {
			if (message.content === "!ping") {
				message.channel.send("Pong.");
			}
		});
	});

	global_discord_client.login(config.DISCORD_TOKEN);
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
	global_discord_readable_stream.push(page.slice(0));

	global_icecast_client.write(page.slice(0));
});