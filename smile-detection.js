// DOM Elements references
const video = document.getElementById("video");
const popup = document.querySelector("#popup");
const winnerElement = document.querySelector("#winner");
const playAgainButton = document.querySelector("#play-again");
const smileCounterElement1 = document.querySelector("#smile-counter-1");
const smileCounterElement2 = document.querySelector("#smile-counter-2");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const multi=document.querySelector("#multi");

// Smile detection variables
const MIN_CONSECUTIVE_FRAMES = 3;
let smileCounter1 = 0;
let smileCounter2 = 0;
let consecutiveSmiles1 = 0;
let consecutiveSmiles2 = 0;
let isSmiling1 = false;
let isSmiling2 = false;
let intervalStarted = false;
let gameOver = false;
let timeoutID;
let gameStarted = false;


playAgainButton.style.display = "none";

// Function to start the smile detection game
function startGame() {
  // Enable the restart button
  restartButton.disabled = false;
  video.style.border="5px solid red";
  // Reset game state variables
  smileCounter1 = 0;
  smileCounter2 = 0;
  gameOver = false;

  // Update the smile counters display
  smileCounterElement1.textContent = `Person 1 Smiles: ${smileCounter1}`;
  smileCounterElement2.textContent = `Person 2 Smiles: ${smileCounter2}`;
  
  // Hide popup and play again button
  popup.style.display = "none";
  playAgainButton.style.display = "none";
  
  // Indicate that the game has started
  gameStarted = true;

  // Disable the start button to prevent re-starting while the game is running
  startButton.disabled = true;

  // Set a timer to end the game after 10 seconds
  timeoutID = setTimeout(() => {
    video.style.border="5px solid rgb(254, 155, 98)";
    popup.style.display = "block";

    // Determine the winner
    let winner;
    if (smileCounter1 > smileCounter2) {
      winner = "Person 1";
    } else if (smileCounter2 > smileCounter1) {
      winner = "Person 2";
    } else {
      winner = "Tie";
    }

    // Display the winner
    winnerElement.textContent = `Winner: ${winner}`;

    // Mark the game as over
    gameOver = true;

    // Show the play again button
    playAgainButton.style.display = "block";

    // Disable the restart button
    restartButton.disabled = true;
  }, 10000);
}

function getBoxFromPoints(points) {
  const box = {
    bottom: -Infinity,
    left: Infinity,
    right: -Infinity,
    top: Infinity,

    get center() {
      return {
        x: this.left + this.width / 2,
        y: this.top + this.height / 2,
      };
    },

    get height() {
      return this.bottom - this.top;
    },

    get width() {
      return this.right - this.left;
    },
  };

  for (const point of points) {
    box.left = Math.min(box.left, point.x);
    box.right = Math.max(box.right, point.x);

    box.bottom = Math.max(box.bottom, point.y);
    box.top = Math.min(box.top, point.y);
  }

  return box;
}

// Function to initialize smile detection
async function startSmileDetection() {
  try {
    // Load the face-api models
    await faceapi.nets.ssdMobilenetv1.loadFromUri("./weights");
    await faceapi.nets.faceLandmark68Net.loadFromUri("./weights");
    await faceapi.nets.faceExpressionNet.loadFromUri("./weights");

    // Request access to the webcam
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;

        // Enable the start button after webcam access is granted
        startButton.disabled = false;
      })
      .catch((error) => {
        console.error("Could not access the webcam:", error);
      });

    // Add event listener to start button to start the game
    startButton.addEventListener("click", startGame);

    // Add event listener to play again button to restart the game
    playAgainButton.addEventListener("click", () => {
      clearTimeout(timeoutID);
      startGame();
    });

    // Add event listener to restart button to restart the game without timeout
    restartButton.addEventListener("click", () => {
      clearTimeout(timeoutID);
      startGame();
    });

    // Process the video feed for smile detection
    video.addEventListener("play", () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      const context = canvas.getContext('2d');

      document.getElementById('multi').append(canvas);

      // Set canvas position to absolute
      canvas.style.position = 'absolute';
      
      const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
      faceapi.matchDimensions(canvas, displaySize);
      
      // Setting zIndex to ensure canvas is above the video
      canvas.style.zIndex = 1;
      
      if (!intervalStarted) {
        intervalStarted = true;
        setInterval(async () => {
          if (!video.paused && !video.ended && gameStarted) {
            const detections = await faceapi
              .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
              .withFaceLandmarks()
              .withFaceExpressions();
            const resizedDetections = faceapi.resizeResults(
              detections,
              displaySize
            );
            canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            //change here
            for (const face of detections) {
              const features = {
                jaw: face.landmarks.positions.slice(0, 17),
                eyebrowLeft: face.landmarks.positions.slice(17, 22),
                eyebrowRight: face.landmarks.positions.slice(22, 27),
                noseBridge: face.landmarks.positions.slice(27, 31),
                nose: face.landmarks.positions.slice(31, 36),
                eyeLeft: face.landmarks.positions.slice(36, 42),
                eyeRight: face.landmarks.positions.slice(42, 48),
                lipOuter: face.landmarks.positions.slice(48, 60),
                lipInner: face.landmarks.positions.slice(60),
              }
              for (const eye of [features.eyeLeft, features.eyeRight]) {
                const eyeBox = getBoxFromPoints(eye);
                const fontSize = 6 * eyeBox.height;

                //context.font = `${fontSize}px/${fontSize}px serif`;
                //context.textDrawingMode = "glyph"
                //context.font = "20px 'Segoe UI Emoji'";
                //const emojis = ["😀"];
                //emojis.forEach((emoji, i) => {
                  //context.fillText(emoji, eyeBox.center.x, eyeBox.center.y + 0.6 * fontSize);
                //
                 // });

                var imgObj = new Image();
                //imgObj.src = 'https://png.pngtree.com/png-vector/20220602/ourmid/pngtree-black-sunglass-vector-on-transparent-background-png-image_4764419.png'
                imgObj.src = 'sunglass.png'

                imgObj.onload = function() {
                  //var ctx = cvs.getContext('2d');
                  const {x, y, width, height} = face.detection.box;

                  context.drawImage(this, x- width*(1/2), y, width, 100);

                  //context.textAlign = 'center';
                  //context.textBaseline = 'bottom';

                  //context.fillStyle = '#000';
                  //context.fillText('😊', eyeBox.center.x, eyeBox.center.y + 0.6 * fontSize);
                }
              }

              var imgObj2 = new Image();
              //imgObj.src = 'https://png.pngtree.com/png-vector/20220602/ourmid/pngtree-black-sunglass-vector-on-transparent-background-png-image_4764419.png'
              imgObj.src = 'sunglass.png'

              imgObj.onload = function() {


                imgObj.width = 200;
                imgObj.height = 150;
                context.drawImage(img, 0, 0, imgObj.width, imgObj.height);

                //var ctx = cvs.getContext('2d');
                //width = eyeBox.width *2
                //height = eyeBox.height
                //context.drawImage(this, eyeBox.center.x, eyeBox.center.y);
                //ctx.drawImage(this, 0, 0,1024,768);//改变图片的大小到1024*768
                //context.drawImage(this, eyeBox.center.x, eyeBox.center.y, 3,1);
              }
            }


            if (resizedDetections.length >= 1) {
              if (resizedDetections[0].expressions.happy > 0.7) {
                consecutiveSmiles1++;
                if (
                  consecutiveSmiles1 >= MIN_CONSECUTIVE_FRAMES &&
                  !isSmiling1
                ) {
                  smileCounter1++;
                  isSmiling1 = true;
                  consecutiveSmiles1 = 0;
                }
              } else {
                isSmiling1 = false;
                consecutiveSmiles1 = 0;
              }
              smileCounterElement1.textContent = `Person 1 Smiles: ${smileCounter1}`;
            }
            if (resizedDetections.length >= 2) {
              if (resizedDetections[1].expressions.happy > 0.7) {
                consecutiveSmiles2++;
                if (
                  consecutiveSmiles2 >= MIN_CONSECUTIVE_FRAMES &&
                  !isSmiling2
                ) {
                  smileCounter2++;
                  isSmiling2 = true;
                  consecutiveSmiles2 = 0;
                }
              } else {
                isSmiling2 = false;
                consecutiveSmiles2 = 0;
              }
              smileCounterElement2.textContent = `Person 2 Smiles: ${smileCounter2}`;
            }
          }
        }, 100);
        intervalStarted = true;
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Start the smile detection
startSmileDetection();
