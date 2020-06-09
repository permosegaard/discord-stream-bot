const { ipcRenderer } = require("electron");
const Recorder = require("./node_modules/opus-recorder/dist/recorder.min.js");


let recorder;


function init() {
	document.getElementById("device_button").addEventListener("click", async () => {
		const value = document.getElementById("device_select").value;

		ipcRenderer.send("stream-input");

		recorder = new Recorder({
			streamPages: true,
			bufferLength: 2**14,

			recordingGain: 0.9,

			resampleQuality: 10,
			encoderComplexity: 10,

			bitRate: 128000,
			sampleRate: 48000,
			encoderSampleRate: 48000,
			numberOfChannels: 2,

			encoderPath: "./node_modules/opus-recorder/dist/encoderWorker.min.js"
		});

		navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: value,

				channelCount: 2,
				sampleRate: 48000,

				autoGainControl: false,
				noiseSuppression: false
			}
		}).then((stream) => {
			const context = new AudioContext();
			const source = context.createMediaStreamSource(stream);

			recorder.start(source);

			recorder.ondataavailable = (typedArray) => {
				ipcRenderer.send("stream-bytes", typedArray);
			};
		});
	});

	navigator.mediaDevices.enumerateDevices().then((devices) => {
		const target_element = document.getElementById("device_select");

		for (const device of devices.filter((d) => d.kind === "audioinput")) {
			let element = document.createElement("option");
			element.value = device.deviceId;
			element.text = device.label;

			target_element.appendChild(element);
		}
	});

	ipcRenderer.send("init");
}