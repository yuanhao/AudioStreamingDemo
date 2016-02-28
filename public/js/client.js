function playAudio(buffer) {
    var audioCtx = window.audioContext;

    if (!audioCtx) return;

    var audio = [];
    for (var i = 0; i < 2048; i++) {
        audio[i] = buffer[i] / 0x7FFF;
    }

    var audioArrayBuffer = audioCtx.createBuffer(1, audio.length, audioCtx.sampleRate);
    audioArrayBuffer.getChannelData(0).set(audio);

    var source = audioCtx.createBufferSource();
    source.buffer = audioArrayBuffer;
    source.connect(audioCtx.destination);
    source.start(0);

    //
    source.connect(window.analyser);
}

function initSocketIO() {
    window.ioSocket = io();
    window.ioSocket.on('audiobuffer', function(buf) {
        playAudio(buf);
    });
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

        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
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

function initCanvasContext() {
    window.canvas = document.getElementById("visualizer");
    window.canvasCtx = window.canvas.getContext("2d");
}

window.onload = function() {
    initCanvasContext();
    initSocketIO();
    initAudioContext();
}
