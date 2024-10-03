
# Detecting Signs of Distress for Aging in Place Using Client-Side JavaScript and Wireless Microphones

## Introduction

This white paper presents a method for detecting signs of distress in people aging in place using a wireless microphone and client-side JavaScript. The goal is to create a non-invasive monitoring system capable of identifying common signs of distress, such as falls or calls for help, and categorizing them into specific categories that are likely to occur in a home setting.

### Objective
The objective of this project is to create a real-time application using client-side JavaScript that utilizes a wireless microphone to capture and analyze sounds in the home. By categorizing potential distress sounds, the system aims to provide timely alerts to caregivers and improve the safety of individuals aging in place.

## Steps for Creating the Application

### Step 1: Microphone Access and Sound Capture
Use the Web Audio API to access the microphone and capture audio data in the browser:

```javascript
// Request access to the microphone
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        // Create a new AudioContext for processing the audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Connect the microphone to the audio context
        const microphone = audioContext.createMediaStreamSource(stream);
        
        // Create an analyser node to process audio data
        const analyser = audioContext.createAnalyser();
        microphone.connect(analyser);

        // Set up analyser properties
        analyser.fftSize = 2048;  // FFT size defines the frequency resolution
        const bufferLength = analyser.frequencyBinCount;  // Number of data points in the frequency domain
        const dataArray = new Uint8Array(bufferLength);  // Array to store frequency data

        // Function to process audio data continuously
        function processAudioData() {
            analyser.getByteTimeDomainData(dataArray);  // Copy the time-domain data into the dataArray

            // Call the function repeatedly for continuous processing
            requestAnimationFrame(processAudioData);
        }

        // Start processing audio data
        processAudioData();
    })
    .catch(err => {
        // Handle errors, such as lack of microphone access
        console.error('Error accessing microphone:', err);
    });
```

### Step 2: Analyzing Audio Data
Implement algorithms to analyze the captured audio data and detect signs of distress. Common signs include:
- Loud crashes or falls
- Repeated calls for help
- Unusual silence or changes in routine

#### 2.1 Sound Level Detection
Detect sudden increases in sound levels, which might indicate a fall or loud noise:

```javascript
// Function to detect loud noises based on amplitude threshold
function detectLoudNoise(dataArray) {
    const threshold = 128;  // Threshold value for loudness (adjust as needed)
    
    // Check if any value in the dataArray exceeds the threshold
    for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > threshold) {
            console.log('Loud noise detected');  // Log loud noise detection
            return true;  // Return true if a loud noise is detected
        }
    }
    return false;  // Return false if no loud noise is detected
}
```

#### 2.2 Pattern Recognition
Pattern recognition for distress sounds involves preprocessing audio data, feature extraction, and classification.

##### Step 1: Preprocessing Audio Data
Normalize and filter audio data to remove background noise:

```javascript
// Function to preprocess audio data: normalization and filtering
function preprocessAudioData(dataArray) {
    // Normalize data between -1 and 1 for consistent processing
    const normalizedData = dataArray.map(sample => (sample - 128) / 128);
    
    // Apply a simple high-pass filter to remove low-frequency noise
    const filteredData = normalizedData.filter(sample => Math.abs(sample) > 0.1);
    
    return filteredData;  // Return the filtered data for further processing
}
```

##### Step 2: Feature Extraction
Extract features like average amplitude and zero-crossing rate:

```javascript
// Function to extract basic features from audio data
function extractFeatures(filteredData) {
    // Calculate average amplitude of the filtered data
    const avgAmplitude = filteredData.reduce((sum, sample) => sum + Math.abs(sample), 0) / filteredData.length;
    
    // Calculate zero-crossing rate (frequency of sign changes)
    const zeroCrossingRate = filteredData.reduce((count, sample, index, array) => {
        if (index > 0 && sample * array[index - 1] < 0) count++;  // Count sign changes
        return count;
    }, 0) / filteredData.length;

    // Return extracted features as an object
    return { avgAmplitude, zeroCrossingRate };
}
```

##### Step 3: Classification
Classify sounds based on extracted features using simple thresholds:

```javascript
// Function to classify sounds based on extracted features
function detectDistressPattern(dataArray) {
    const filteredData = preprocessAudioData(dataArray);  // Preprocess the audio data
    const features = extractFeatures(filteredData);  // Extract features from the data

    // Check for potential distress sound using thresholds
    if (features.avgAmplitude > 0.5 && features.zeroCrossingRate > 0.1) {
        console.log('Potential distress sound detected');
        return true;  // Return true if a distress sound is detected
    }

    return false;  // Return false if no distress sound is detected
}
```

### Step 3: Using a Pretrained Model for Sound Classification

#### Sound Classes to Detect
For this application, the following sound classes are relevant:
1. Falls
2. Calls for Help
3. Coughing
4. Prolonged Silence
5. Doorbell or Knocking
6. Glass Breaking

#### Using a Pretrained Model with ml5.js
`ml5.js` offers a simple way to integrate pretrained sound classification models into your JavaScript application.

##### Step 1: Include ml5.js Library
```html
<!-- Include the ml5.js library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/ml5/0.10.0/ml5.min.js"></script>
```

##### Step 2: Load the Pretrained Model
```javascript
let classifier;

// Load a pretrained sound classifier model from ml5.js
function setup() {
    classifier = ml5.soundClassifier('SpeechCommands18w', { probabilityThreshold: 0.7 }, modelReady);
}

// Callback function once the model is ready
function modelReady() {
    console.log('Model Loaded!');
    // Start classifying sounds using the loaded model
    classifier.classify(gotResult);
}
```

##### Step 3: Handle Classification Results
```javascript
// Function to handle results from the classifier
function gotResult(error, results) {
    if (error) {
        console.error(error);  // Log any errors that occur
        return;
    }

    const detectedSound = results[0].label;  // Get the label of the detected sound
    const confidence = results[0].confidence;  // Get the confidence level of the detection

    if (confidence > 0.8) {  // Check if the detection confidence is above the threshold
        // Take action based on the detected sound label
        switch (detectedSound) {
            case 'fall':
                notifyCaregiver('Fall detected.');
                break;
            case 'help':
                notifyCaregiver('Call for help detected.');
                break;
            case 'cough':
                notifyCaregiver('Coughing detected.');
                break;
            case 'silence':
                // Add logic to handle prolonged silence if necessary
                break;
            case 'doorbell':
                notifyCaregiver('Doorbell or knocking detected.');
                break;
            case 'glass_break':
                notifyCaregiver('Glass breaking detected.');
                break;
            default:
                console.log('Other sound detected:', detectedSound);  // Log any other sounds detected
        }
    }
}

// Function to notify caregiver through desired communication methods
function notifyCaregiver(message) {
    // Implement notification logic, such as sending an email or SMS
    console.log('Notification:', message);  // Log the notification message
}
```

### Step 4: Deploy and Test
Deploy the application in a home setting to test its effectiveness. Continuously gather feedback and refine the classification models and algorithms to improve accuracy and reduce false positives.

### Conclusion
By leveraging client-side JavaScript and a wireless microphone, it is possible to create a real-time monitoring system that detects signs of distress in individuals aging in place. Using a combination of sound level detection, pattern recognition, and pretrained models, the system can provide timely alerts to caregivers, enhancing safety and quality of life for elderly individuals.

### References
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ml5.js Sound Classifier](https://learn.ml5js.org/#/reference/sound-classifier)
