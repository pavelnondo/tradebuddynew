
import * as tf from '@tensorflow/tfjs';

// Model variables
let model: tf.LayersModel | null = null;
let isModelLoading = false;

// Load the model
export async function loadAdPredictionModel() {
  if (model !== null) return model;
  if (isModelLoading) {
    // If model is already loading, wait for it
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model;
  }
  
  isModelLoading = true;
  
  try {
    // In a real implementation, we would load a pretrained model
    // For demonstration, we'll create a simple model
    model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    console.log('Ad prediction model loaded successfully');
    return model;
  } catch (error) {
    console.error('Error loading ad prediction model:', error);
    throw error;
  } finally {
    isModelLoading = false;
  }
}

// Predict the likelihood of ad click
export async function predictAdClick(features: number[]): Promise<number> {
  try {
    const loadedModel = await loadAdPredictionModel();
    
    // Ensure we have 10 features
    const paddedFeatures = features.length < 10 
      ? [...features, ...Array(10 - features.length).fill(0)]
      : features.slice(0, 10);
    
    // Convert to tensor and make prediction
    const inputTensor = tf.tensor2d([paddedFeatures]);
    const prediction = loadedModel.predict(inputTensor) as tf.Tensor;
    
    // Get the value and clean up
    const result = (await prediction.data())[0];
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return result;
  } catch (error) {
    console.error('Error predicting ad click:', error);
    return 0.5; // Default to 50% probability on error
  }
}

// Helper function to optimize ad placement based on predictions
export async function optimizeAdPlacement(
  adSlots: Array<{ id: string; features: number[] }>
): Promise<string[]> {
  const predictions: Array<{ id: string; score: number }> = [];
  
  for (const slot of adSlots) {
    const score = await predictAdClick(slot.features);
    predictions.push({ id: slot.id, score });
  }
  
  // Sort by prediction score (highest first)
  predictions.sort((a, b) => b.score - a.score);
  
  // Return sorted IDs
  return predictions.map(p => p.id);
}
