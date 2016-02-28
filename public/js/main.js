function convertFloat32ToInt16(buffer) {
    var l = buffer.length;
    var buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf;
}

function recorderProcess(e) {
    var left = e.inputBuffer.getChannelData(0);
    window.ioSocket.emit("audiobuffer", convertFloat32ToInt16(left));
}

function initRecorder(stream) {
    var ctx = window.audioContext;
    window.audioInput = ctx.createMediaStreamSource(stream);
    var bufferSize = 2048;
    ctx.createJavaScriptNode = ctx.createJavaScriptNode ||
                               ctx.createScriptProcessor ||
                               null;
    window.recorder = ctx.createJavaScriptNode(bufferSize, 1, 1);
    window.recorder.onaudioprocess = recorderProcess;
    /*
    window.audioInput.connect(window.recorder);
    window.recorder.connect(ctx.destination);
    window.audioInput.connect(window.analyser);
    */
    window.isRecording = false;
}

function pauseRecording() {
    if (!window.audioContext) return;
    if (!window.recorder) return;
    window.recorder.disconnect();
    window.audioInput.disconnect();
    window.isRecording = false;
}

function continueRecording() {
    if (!window.audioContext) return;
    if (!window.recorder) return;
    window.audioInput.connect(window.recorder);
    window.recorder.connect(window.audioContext.destination);
    window.audioInput.connect(window.analyser);
    window.isRecording = true;
}

function onError(e) {
    console.log(e);
}

function initMicrophone() {
    var session = {
        audio: true,
        video: false
    };
    var recordRTC = null;

    window.navigator = window.navigator || {};
    navigator.getUserMedia = navigator.getUserMedia       ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia    ||
                             null;
    if (navigator.getUserMedia === null) {
        window.alert("Not Supported");
    } else {
        navigator.getUserMedia(session, initRecorder, onError);
    }

}

function initAudioContext() {
    var AudioContext = window.AudioContext
        || window.webkitAudioContext
        || false;
    if (!AudioContext) {
        window.audioContext = null;
    } else {
        window.audioContext = new AudioContext();
        initAudioAnalyser();
    }
}

function initAudioAnalyser() {
    window.analyser = window.audioContext.createAnalyser();
    window.analyser.fftSize = 256;
    var bufferLength = window.analyser.frequencyBinCount;
    var dataArray = new Float32Array(bufferLength);

    window.canvasCtx.clearRect(0, 0, window.canvas.width, window.canvas.height);

    function draw() {
        var canvasCtx = window.canvasCtx;

        drawVisual = requestAnimationFrame(draw);
        window.analyser.getFloatFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, window.canvas.width, window.canvas.height);

        var barWidth = (window.canvas.width / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] + 140) * 2;

            canvasCtx.fillStyle = 'rgb(' + Math.floor(barHeight + 100) + ', 50, 50)';
            canvasCtx.fillRect(x, window.canvas.height - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
        }
    };

    draw();
}

function initSocketIO() {
    window.ioSocket = io();
}

function initCanvasContext() {
    window.canvas = document.getElementById("visualizer");
    window.canvasCtx = window.canvas.getContext("2d");
}

function initButton() {
    var button = document.getElementById('record-button');
    var h1 = document.getElementById('casting-status');
    button.addEventListener('click', function() {
        if (window.isRecording) {
            pauseRecording();
            button.style.backgroundImage = "url(/images/record.png)";
            h1.innerHTML = "Broadcast";
        } else {
            continueRecording();
            button.style.backgroundImage = "url(/images/pause.png)";
            h1.innerHTML = "Broadcasting...";
        }
    }, false);
}

window.onload = function() {
    initCanvasContext();
    initAudioContext();
    initMicrophone();
    initSocketIO();
    initButton();
}
