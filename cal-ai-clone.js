// Cal AI Clone - Mobile Application with AI-Powered Food Recognition
// This is a React Native application that replicates Cal AI's core functionalities

// App.js - Main Application File
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample nutritional data for demo purposes (in a real app, this would come from an AI/ML model)
const SAMPLE_FOOD_DATA = {
  'apple': { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, name: 'Apple' },
  'banana': { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, name: 'Banana' },
  'pizza': { calories: 285, protein: 12, carbs: 36, fat: 10, name: 'Pizza Slice' },
  'burger': { calories: 354, protein: 20, carbs: 40, fat: 17, name: 'Burger' },
  'salad': { calories: 152, protein: 7, carbs: 10, fat: 8, name: 'Garden Salad' },
  'pasta': { calories: 200, protein: 7, carbs: 43, fat: 1.1, name: 'Pasta Dish' },
  'steak': { calories: 271, protein: 26, carbs: 0, fat: 17, name: 'Steak' },
  'sushi': { calories: 140, protein: 6, carbs: 28, fat: 0.5, name: 'Sushi Roll' }
};

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [mealHistory, setMealHistory] = useState([]);
  const [totalDailyStats, setTotalDailyStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [currentTab, setCurrentTab] = useState('home');
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Request media library permissions
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        }
      }
      
      // Load saved meal history
      loadMealHistory();
    })();
  }, []);

  useEffect(() => {
    // Calculate daily stats whenever meal history changes
    calculateDailyStats();
  }, [mealHistory]);

  const loadMealHistory = async () => {
    try {
      const savedMeals = await AsyncStorage.getItem('mealHistory');
      if (savedMeals !== null) {
        const meals = JSON.parse(savedMeals);
        // Only include meals from today
        const today = new Date().toDateString();
        const todayMeals = meals.filter(meal => new Date(meal.timestamp).toDateString() === today);
        setMealHistory(todayMeals);
      }
    } catch (error) {
      console.error('Error loading meal history:', error);
    }
  };

  const saveMealHistory = async (updatedMeals) => {
    try {
      await AsyncStorage.setItem('mealHistory', JSON.stringify(updatedMeals));
    } catch (error) {
      console.error('Error saving meal history:', error);
    }
  };

  const calculateDailyStats = () => {
    const stats = mealHistory.reduce((acc, meal) => {
      acc.calories += meal.nutritionalInfo.calories;
      acc.protein += meal.nutritionalInfo.protein;
      acc.carbs += meal.nutritionalInfo.carbs;
      acc.fat += meal.nutritionalInfo.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    setTotalDailyStats(stats);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setIsCameraOpen(false);
        analyzeFood(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
        analyzeFood(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Simulated AI food recognition and analysis
  const analyzeFood = async (imageUri) => {
    setIsAnalyzing(true);
    
    // In a real app, this would call an API that uses AI to identify the food
    // For this demo, we'll simulate a delay and return random food data
    setTimeout(() => {
      // Randomly select a food from our sample data
      const foodKeys = Object.keys(SAMPLE_FOOD_DATA);
      const randomFood = foodKeys[Math.floor(Math.random() * foodKeys.length)];
      const foodData = SAMPLE_FOOD_DATA[randomFood];
      
      const mealData = {
        id: Date.now().toString(),
        image: imageUri,
        timestamp: new Date().toISOString(),
        foodName: foodData.name,
        nutritionalInfo: {
          calories: foodData.calories,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat
        }
      };
      
      setCurrentMeal(mealData);
      setIsAnalyzing(false);
      setShowResults(true);
      
      // Update meal history
      const updatedMealHistory = [...mealHistory, mealData];
      setMealHistory(updatedMealHistory);
      saveMealHistory(updatedMealHistory);
    }, 2000); // Simulate 2-second analysis time
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${formattedMinutes} ${ampm}`;
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  const renderHomeTab = () => (
    <ScrollView style={styles.homeContent}>
      {/* Daily Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDailyStats.calories.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDailyStats.protein.toFixed(1)}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDailyStats.carbs.toFixed(1)}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDailyStats.fat.toFixed(1)}g</Text>
            <Text style={styles.statLabel}>Fat</Text>
          </View>
        </View>
      </View>
      
      {/* Add Meal Button */}
      <TouchableOpacity 
        style={styles.addMealButton}
        onPress={() => setIsCameraOpen(true)}
      >
        <Ionicons name="camera" size={24} color="white" />
        <Text style={styles.addMealButtonText}>Take Food Photo</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.addMealButton, { backgroundColor: '#4C9EEB' }]}
        onPress={pickImage}
      >
        <Ionicons name="images" size={24} color="white" />
        <Text style={styles.addMealButtonText}>Upload Food Photo</Text>
      </TouchableOpacity>
      
      {/* Today's Meals */}
      <View style={styles.mealsContainer}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {mealHistory.length === 0 ? (
          <Text style={styles.emptyState}>No meals logged today. Take a photo to get started!</Text>
        ) : (
          mealHistory.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Image source={{ uri: meal.image }} style={styles.mealImage} />
              <View style={styles.mealDetails}>
                <Text style={styles.mealName}>{meal.foodName}</Text>
                <Text style={styles.mealTime}>{formatTime(meal.timestamp)}</Text>
                <Text style={styles.mealCalories}>{meal.nutritionalInfo.calories} calories</Text>
                <View style={styles.macrosRow}>
                  <Text style={styles.macroText}>P: {meal.nutritionalInfo.protein}g</Text>
                  <Text style={styles.macroText}>C: {meal.nutritionalInfo.carbs}g</Text>
                  <Text style={styles.macroText}>F: {meal.nutritionalInfo.fat}g</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderProfileTab = () => (
    <ScrollView style={styles.profileContent}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person-circle" size={100} color="#555" />
        </View>
        <Text style={styles.profileName}>User Profile</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Nutritional Goals</Text>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Daily Calorie Target</Text>
          <Text style={styles.goalValue}>2,000 kcal</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Protein Target</Text>
          <Text style={styles.goalValue}>150g</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Carbohydrate Target</Text>
          <Text style={styles.goalValue}>225g</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Fat Target</Text>
          <Text style={styles.goalValue}>65g</Text>
        </View>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Units (Metric/Imperial)</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Clear Meal History</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cal AI Clone</Text>
      </View>
      
      {/* Main Content Area */}
      <View style={styles.content}>
        {currentTab === 'home' && renderHomeTab()}
        {currentTab === 'profile' && renderProfileTab()}
      </View>
      
      {/* Camera Modal */}
      <Modal
        visible={isCameraOpen}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.cameraContainer}>
          <Camera 
            style={styles.camera} 
            type={type}
            ref={cameraRef}
          >
            <View style={styles.cameraButtonsContainer}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setType(
                    type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back
                  );
                }}>
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}>
                <View style={styles.captureCircle} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCameraOpen(false)}>
                <Ionicons name="close-circle" size={36} color="white" />
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      </Modal>
      
      {/* Analysis Modal */}
      <Modal
        visible={isAnalyzing}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.analysisContainer}>
          <View style={styles.analysisContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.analysisText}>Analyzing your food...</Text>
            {capturedImage && (
              <Image 
                source={{ uri: capturedImage }} 
                style={styles.analysisImage} 
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Results Modal */}
      <Modal
        visible={showResults}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.resultsContainer}>
          <View style={styles.resultsContent}>
            <TouchableOpacity 
              style={styles.resultsCloseButton}
              onPress={() => setShowResults(false)}
            >
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
            
            <Text style={styles.resultsTitle}>Food Analysis Results</Text>
            
            {currentMeal && (
              <>
                <Image 
                  source={{ uri: currentMeal.image }} 
                  style={styles.resultsImage} 
                />
                
                <Text style={styles.foodName}>{currentMeal.foodName}</Text>
                
                <View style={styles.nutritionContainer}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {currentMeal.nutritionalInfo.calories}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {currentMeal.nutritionalInfo.protein}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {currentMeal.nutritionalInfo.carbs}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {currentMeal.nutritionalInfo.fat}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => setShowResults(false)}
                >
                  <Text style={styles.saveButtonText}>Save to My Meals</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'home' && styles.activeNavItem]} 
          onPress={() => setCurrentTab('home')}
        >
          <Ionicons 
            name={currentTab === 'home' ? 'home' : 'home-outline'} 
            size={24} 
            color={currentTab === 'home' ? '#4CAF50' : '#777'} 
          />
          <Text style={[styles.navText, currentTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItemCenter}
          onPress={() => setIsCameraOpen(true)}
        >
          <View style={styles.navCameraButton}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'profile' && styles.activeNavItem]} 
          onPress={() => setCurrentTab('profile')}
        >
          <Ionicons 
            name={currentTab === 'profile' ? 'person' : 'person-outline'} 
            size={24} 
            color={currentTab === 'profile' ? '#4CAF50' : '#777'} 
          />
          <Text style={[styles.navText, currentTab === 'profile' && styles.activeNavText]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  homeContent: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  addMealButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addMealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mealsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyState: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  mealItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mealDetails: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  macrosRow: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraButtonsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 30,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  analysisContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  analysisText: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
  },
  analysisImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  resultsContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    height: '85%',
  },
  resultsCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  resultsImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 15,
  },
  activeNavItem: {
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  navText: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  activeNavText: {
    color: '#4CAF50',
  },
  profileContent: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalLabel: {
    fontSize: 16,
    color: '#444',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#444',
  },
});

// package.json contents for reference:
/*
{
  "name": "cal-ai-clone",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "~1.17.3",
    "expo": "~47.0.12",
    "expo-camera": "~13.1.0",
    "expo-file-system": "~15.1.1",
    "expo-image-picker": "~14.0.2",
    "expo-status-bar": "~1.4.2",
    "react": "18.1.0",
    "react-native": "0.70.5",
    "@expo/vector-icons": "^13.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.12.9"
  },
  "private": true
}
*/

// app.json contents for reference:
/*
{
  "expo": {
    "name": "Cal AI Clone",
    "slug": "cal-ai-clone",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to capture food images for nutritional analysis.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to let you upload food images for nutritional analysis."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
*/