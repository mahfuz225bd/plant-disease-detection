import React, { useState, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { Camera, CameraResultType } from '@capacitor/camera';
import * as tf from '@tensorflow/tfjs';

// Load the pre-trained TensorFlow.js model
const loadModel = async () => {
  const model = await tf.loadLayersModel('/assets/model.json');
  console.log('Model loaded successfully');
  return model;
};

// Preprocess image before passing it to the model
const preprocessImage = (base64Image) => {
  const img = new Image();
  img.src = `data:image/jpeg;base64,${base64Image}`;
  img.onload = () => {
    const tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat().div(tf.scalar(255)).expandDims(0);
    return tensor;
  };
};

// Predict the disease from the captured image
const processImage = async (base64Image) => {
  const model = await loadModel();
  const tensorImage = preprocessImage(base64Image);
  const prediction = await model.predict(tensorImage);
  console.log('Prediction:', prediction);
  // Use this prediction to set the state for disease info
  return prediction;
};

const Home = () => {
  const [disease, setDisease] = useState({ name: '', symptoms: '', treatment: '' });
  const [image, setImage] = useState('');

  const captureImage = async () => {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
    });
    console.log(photo.base64String); // Capture the image and process it
    setImage(photo.base64String);
    const result = await processImage(photo.base64String); // Process image and get prediction
    setDisease({
      name: result.diseaseName || 'Unknown Disease', // Replace with your actual prediction
      symptoms: result.symptoms || 'Symptoms details here',
      treatment: result.treatment || 'Treatment details here',
    });
  };

  const selectImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*'; // Restrict to image files only
    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result as string;
          console.log(base64Image); // Log the base64 image string
          setImage(base64Image); // Update state to display the selected image
          const result = await processImage(base64Image); // Process the image with the model
          setDisease({
            name: result.diseaseName || 'Unknown Disease', // Replace with actual prediction
            symptoms: result.symptoms || 'Symptoms details here',
            treatment: result.treatment || 'Treatment details here',
          });
        };
        reader.readAsDataURL(file); // Convert file to base64 string
      }
    };
    input.click(); // Open the file input dialog
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Plant Disease Detector</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12" class="ion-text-center">
              <IonButton expand="block" onClick={captureImage}>
                Capture Image
              </IonButton>
              <IonButton expand="block" onClick={selectImage}>
                Upload Image
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {image && (
          <div className="ion-text-center">
            <img src={`data:image/jpeg;base64,${image}`} alt="Captured" width="100%" />
          </div>
        )}

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Disease Detected</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p><strong>Name:</strong> {disease.name}</p>
            <p><strong>Symptoms:</strong> {disease.symptoms}</p>
            <p><strong>Treatment:</strong> {disease.treatment}</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;
