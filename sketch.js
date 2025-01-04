let font;
let speechRec;
let words = "";
let fadeAmount = 255;
let fadeStep = 5;
let fadeStart = false;
let video;
let faceapi;
let detections = [];
let emotions = { "neutral": 0, "happy": 0, "sad": 0, "angry": 0, "fearful": 0, "disgusted": 0, "surprised": 0 };
let treeSVG, dollarSVG;
let switchInterval = 30; // Switch every 30 frames
let currentSVG = [];

function preload() {
  // Load the font
  font = loadFont('font/Thorowgood.ttf');
  // Load the SVGs
  treeSVGs = {
    default: loadImage('icons/Tree.svg'),
    pink: loadImage('icons/TreePink.svg'),
    blue: loadImage('icons/TreeBlue.svg'),
    green: loadImage('icons/TreeGreen.svg'),
    red: loadImage('icons/TreeRed.svg'),
    purple: loadImage('icons/TreePurple.svg'),
    yellow: loadImage('icons/TreeYellow.svg'),
  };

  dollarSVGs = {
    default: loadImage('icons/Dollar.svg'),
    pink: loadImage('icons/DollarPink.svg'),
    blue: loadImage('icons/DollarBlue.svg'),
    green: loadImage('icons/DollarGreen.svg'),
    red: loadImage('icons/DollarRed.svg'),
    purple: loadImage('icons/DollarPurple.svg'),
    yellow: loadImage('icons/DollarYellow.svg'),
  };
}

function setup() {
  createCanvas(screen.width* 2, screen.height* 1.6);
  background(220);

  // Initialize p5.SpeechRec
  speechRec = new p5.SpeechRec('en-US', gotSpeech);
  speechRec.continuous = true; // Keep recognizing speech continuously
  speechRec.interimResults = false; // Get only final results
  speechRec.start();

  // Initialize video capture
  video = createCapture(VIDEO, {flipped: true});
  video.size(width, height);
  video.hide();

  // Initialize face-api.js
  faceapi = ml5.faceApi(video, { withLandmarks: true, withExpressions: true, withDescriptors: false }, modelReady);
}

function modelReady() {
  console.log('FaceAPI model loaded');
  faceapi.detect(gotResults);
}

function gotResults(err, result) {
  if (err) {
    console.error(err);
    return;
  }
  detections = result;
  if (detections && detections.length > 0) {
    let expressions = detections[0].expressions;
    for (let key in emotions) {
      if (expressions[key] !== undefined) {
        emotions[key] = nf(expressions[key], 0, 2); // format to 2 decimal places
      }
    }
  }
  faceapi.detect(gotResults);
}

function draw() {
  background(220);

  // Draw background and filters
  drawBackgroundSVGs();
  drawVideoFilter();
  drawEmotionBox();
  drawFaceBox();

  // Draw text last to layer it on top of all filters
  drawFilledPixelatedText(words);

  // Gradually decrease the fade amount to make the text disappear
  if (fadeStart && fadeAmount > 0) {
    fadeAmount -= fadeStep;
  }
}


function gotSpeech() {
  if (speechRec.resultValue) {
    words = speechRec.resultString.toUpperCase();
    fadeAmount = 255; // Reset fade amount when new words are spoken
    fadeStart = false; // Stop fading during speech
    setTimeout(() => fadeStart = true, 3000); // Start fading after 3 seconds
  }
}



function drawBackgroundSVGs() {
  let gridSize = 100;

  // Determine the highest emotion
  let highestEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
  let currentTree, currentDollar;

  // Map the highest emotion to the corresponding SVG
  switch (highestEmotion) {
    case "happy":
      currentTree = treeSVGs.pink;
      currentDollar = dollarSVGs.pink;
      break;
    case "sad":
      currentTree = treeSVGs.blue;
      currentDollar = dollarSVGs.blue;
      break;
    case "angry":
      currentTree = treeSVGs.red;
      currentDollar = dollarSVGs.red;
      break;
    case "fearful":
      currentTree = treeSVGs.purple;
      currentDollar = dollarSVGs.purple;
      break;
    case "disgusted":
      currentTree = treeSVGs.green;
      currentDollar = dollarSVGs.green;
      break;
    case "surprised":
      currentTree = treeSVGs.yellow;
      currentDollar = dollarSVGs.yellow;
      break;
    default:
      currentTree = treeSVGs.default;
      currentDollar = dollarSVGs.default;
      break;
  }

  // Update the icons every switchInterval
  if (frameCount % switchInterval === 0 || currentSVG.length === 0) {
    currentSVG = []; // Reset the array
    for (let x = 0; x < width; x += gridSize) {
      currentSVG.push([]);
      for (let y = 0; y < height; y += gridSize) {
        // Randomly pick between tree and dollar with the emotion color
        currentSVG[currentSVG.length - 1].push(random() > 0.5 ? currentTree : currentDollar);
      }
    }
  }

  // Draw the updated SVGs
  for (let i = 0; i < currentSVG.length; i++) {
    for (let j = 0; j < currentSVG[i].length; j++) {
      let x = i * gridSize;
      let y = j * gridSize;
      image(currentSVG[i][j], x, y, gridSize, gridSize);
    }
  }
}


function drawFilledPixelatedText(textToDisplay) {
  textFont(font);
  let maxWidth = width * 0.8; // Allow text to occupy up to 80% of the frame width
  let baseTextSize = 200; // Default text size
  let lineHeight = baseTextSize * 1.2; // Space between lines
  let verticalOffset = 150; // Adjust vertical alignment

  // Set text fill color based on the highest emotion
  let highestEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
  let textColor;
  switch (highestEmotion) {
    case "happy": textColor = color(255, 182, 193); break; // Pink
    case "sad": textColor = color(0, 0, 139); break; // Dark blue
    case "angry": textColor = color(255, 0, 0); break; // Red
    case "fearful": textColor = color(128, 0, 128); break; // Purple
    case "disgusted": textColor = color(0, 128, 0); break; // Green
    case "surprised": textColor = color(255, 255, 0); break; // Yellow
    default: textColor = color(0); break; // Black
  }
  fill(textColor.levels[0], textColor.levels[1], textColor.levels[2], fadeAmount);

  // Split the text into wrapped lines
  let lines = wrapTextToLines(textToDisplay, maxWidth, baseTextSize);
  let totalHeight = lines.length * lineHeight;

  // Calculate the starting position to center the wrapped text
  let yStart = (height - totalHeight) / 2 + verticalOffset;

  // Render each line of text
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let xStart = width / 2; // Center align horizontally
    textAlign(CENTER, CENTER); // Align text
    textSize(baseTextSize); // Set text size
    text(line, xStart, yStart + i * lineHeight); // Draw text
  }
}

// Helper function to wrap text into lines
function wrapTextToLines(text, maxWidth, textSizeValue) {
  textSize(textSizeValue);
  let words = text.split(' ');
  let lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    let testLine = currentLine + ' ' + words[i];
    if (textWidth(testLine) > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}


// Helper function to calculate the width of a line of text
function calculateLineWidth(line, textSizeValue) {
  textSize(textSizeValue); // Use a safe parameter name
  let letterSpacing = 20; // Spacing between characters
  let totalWidth = 0;

  for (let char of line) {
    // Calculate the bounds of each character
    let bounds = font.textBounds(char, 0, 0, textSizeValue);
    totalWidth += bounds.w + letterSpacing;
  }

  // Adjust for the last letter, removing extra spacing
  return totalWidth - letterSpacing;
}

// Function to draw a single pixelated line
function drawPixelatedLine(line, xStart, y, textSize, ellipseColor) {
  let letterSpacing = 20;
  let gridSize = 10;
  let xOffset = 0;

  for (let char of line) {
    let bounds = font.textBounds(char, 0, 0, textSize);
    let x = xStart + xOffset;
    let baselineOffset = bounds.y + bounds.h;

    let points = font.textToPoints(char, x, y - baselineOffset, textSize, {
      sampleFactor: 0.25 // Adjust for more or fewer points
    });

    let textPath = [];
    for (let i = 0; i < points.length; i++) {
      textPath.push([points[i].x, points[i].y]);
    }

    for (let gridX = 0; gridX < width; gridX += gridSize) {
      for (let gridY = 0; gridY < height; gridY += gridSize) {
        if (pointInPolygon([gridX, gridY], textPath)) {
          fill(ellipseColor.levels[0], ellipseColor.levels[1], ellipseColor.levels[2], fadeAmount);
          ellipse(gridX, gridY, gridSize * 0.8, gridSize * 0.8);
        }
      }
    }

    xOffset += bounds.w + letterSpacing; // Increment for the next character
  }
}

// Function to check if a point is inside a polygon
function pointInPolygon(point, vs) {
  let x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];

    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}


function drawVideoFilter() {
  let gridSize = 20;
  video.loadPixels();
  for (let y = 0; y < video.height; y += gridSize) {
    for (let x = 0; x < video.width; x += gridSize) {
      let index = (y * video.width + x) * 4;
      let r = video.pixels[index];
      let dia = map(r, 0, 255, gridSize, 2);

      fill(0);
      noStroke();
      circle(x, y, dia);
    }
  }
}

function drawEmotionBox() {
  let x = 10; // Starting X position
  let y = 20; // Starting Y position
  let boxPadding = 5; // Padding inside the rectangles
  let lineHeight = 24; // Spacing between lines

  textAlign(LEFT, CENTER); // Align text to the left and center vertically
  textSize(16); // Set a readable font size

  for (let key in emotions) {
    let displayText = `${key.toUpperCase()}: ${emotions[key]}`; // Format text
    let textWidthValue = textWidth(displayText) + boxPadding * 2; // Total box width
    
    // Draw rectangle background
    fill(0); // Black background
    rect(x, y - lineHeight / 2, textWidthValue, lineHeight); // Centered vertically

    // Draw text
    fill(0, 255, 0); // Green text
    text(displayText, x + boxPadding, y); // Offset text within rectangle

    y += lineHeight; // Move to the next line
    if (y + lineHeight > height) { 
      // If overflow, move to next column
      y = 20;
      x += textWidthValue + 10; // Add spacing between columns
    }
  }
}





function drawFaceBox() {
  if (detections && detections.length > 0) {
    for (let i = 0; i < detections.length; i++) {
      let alignedRect = detections[i].alignedRect;
      let { _x, _y, _width, _height } = alignedRect._box;
      noFill();
      stroke(0, 255, 0);
      strokeWeight(2);
      rect(width - _x - _width, _y, _width, _height); // Flip the x-coordinate to align with mirrored video
    }
  }
}

// Function to check if a point is inside a polygon
function pointInPolygon(point, vs) {
  let x = point[0], y = point[1];
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1];
    let xj = vs[j][0], yj = vs[j][1];

    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}
