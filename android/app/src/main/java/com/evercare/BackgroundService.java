package com.evercare;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import androidx.core.app.NotificationCompat;
import android.os.Build;
import android.app.PendingIntent;
import android.os.Vibrator;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import java.util.HashMap;
import java.util.Map;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import android.content.SharedPreferences;
import java.io.File;
import java.io.FileInputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class BackgroundService extends Service implements SensorEventListener{

    private static final String TAG = "BackgroundService";
    private static final String CHANNEL_ID = "FREE_FALL_CHANNEL";
    private static final int NOTIFICATION_ID = 1234;

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private NotificationManager notificationManager;
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private LocationManager locationManager;
    private Location lastKnownLocation;

    private static final float FREE_FALL_THRESHOLD = 2.0f; // m/s²
    private static final long FREE_FALL_TIME_THRESHOLD = 50; // milliseconds

    
    private long freeFallStartTime = 0;
    private boolean inFreeFall = false;
    private boolean fallEventProcessed = false;

    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        // Initialize sensor manager
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        
        // Initialize notification manager and create channel
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createNotificationChannel();
        
        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        
        // Initialize location manager
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        requestLocationUpdates();

        if (accelerometer != null) {
            // Register for accelerometer updates
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
            Log.d(TAG, "Accelerometer registered successfully");
        } else {
            Log.e(TAG, "Accelerometer not available on this device");
        }
    }


    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        
        Log.d("FallDetection","Service Started");
        return START_STICKY;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];
            
            // Calculate total acceleration magnitude
            float acceleration = (float) Math.sqrt(x * x + y * y + z * z);
            
            // Check for free fall (acceleration significantly less than gravity)
            if (acceleration < FREE_FALL_THRESHOLD) {
                if (!inFreeFall) {
                    // Start of potential free fall
                    freeFallStartTime = System.currentTimeMillis();
                    
                    inFreeFall = true;
                    Log.d(TAG, "Potential free fall detected, acceleration: " + acceleration);
                }
                
                // Check if free fall has lasted long enough and hasn't been processed yet
                long freeFallDuration = System.currentTimeMillis() - freeFallStartTime;
                if (freeFallDuration >= FREE_FALL_TIME_THRESHOLD && !fallEventProcessed) {
                    fallEventProcessed = true; // Mark as processed to prevent duplicates
                    onFreeFallDetected(acceleration, freeFallDuration);
                }
            } else {
                // Reset free fall detection
                if (inFreeFall) {
                    Log.d(TAG, "Free fall ended, acceleration returned to: " + acceleration);
                }
                inFreeFall = false;
                fallEventProcessed = false; // Reset for next fall detection
                freeFallStartTime = 0;
            }
        }
    }

    private void onFreeFallDetected(float acceleration, long duration) {
        Log.w(TAG, "FREE FALL DETECTED! Duration: " + duration + "ms, Acceleration: " + acceleration);


        // Show notification immediately
        showFreeFallNotification(acceleration, duration);
        
        // Save fall event to Firebase Firestore - moved to React Native side due to auth context
        // saveFallToFirebase(acceleration, duration);

        //broadcast to app with fall data for React Native to save
        handleFreeFallEvent(acceleration, duration);
    }
    
    private void handleFreeFallEvent(float acceleration, long duration) {
        // Send broadcast with fall data for React Native to save to Firebase
        Log.i(TAG, "Broadcasting free fall event to React Native for Firebase saving");
        
        Intent freeFallIntent = new Intent("com.evercare.FREE_FALL_DETECTED");
        freeFallIntent.putExtra("acceleration", acceleration);
        freeFallIntent.putExtra("duration", duration);
        freeFallIntent.putExtra("timestamp", System.currentTimeMillis());
        
        // Add location data if available
        if (lastKnownLocation != null) {
            freeFallIntent.putExtra("latitude", lastKnownLocation.getLatitude());
            freeFallIntent.putExtra("longitude", lastKnownLocation.getLongitude());
            freeFallIntent.putExtra("accuracy", lastKnownLocation.getAccuracy());
            freeFallIntent.putExtra("provider", lastKnownLocation.getProvider());
            freeFallIntent.putExtra("locationTimestamp", lastKnownLocation.getTime());
        }
        
        // Send both regular broadcast and local broadcast
        sendBroadcast(freeFallIntent);
        
        // Also try LocalBroadcastManager for internal app communication
        try {
            LocalBroadcastManager.getInstance(this).sendBroadcast(freeFallIntent);
            Log.i(TAG, "Local broadcast also sent");
        } catch (Exception e) {
            Log.e(TAG, "Error sending local broadcast: " + e.getMessage());
        }
    }
    
    private void saveFallToFirebase(float acceleration, long duration) {
        try {
            // First try to get user ID from SharedPreferences (set by React Native via native module)
            SharedPreferences prefs = getSharedPreferences("EverCareAuth", Context.MODE_PRIVATE);
            String userId = prefs.getString("userId", null);
            
            if (userId != null) {
                Log.d(TAG, "Found userId in SharedPreferences: " + userId);
            } else {
                Log.w(TAG, "No userId found in SharedPreferences - checking Firebase Auth");
                
                // Fallback to Firebase Auth
                FirebaseUser currentUser = mAuth.getCurrentUser();
                if (currentUser != null) {
                    userId = currentUser.getUid();
                    Log.d(TAG, "Found userId via Firebase Auth: " + userId);
                } else {
                    Log.w(TAG, "No authenticated user found in SharedPreferences or Firebase Auth - fall event not saved");
                    return;
                }
            }
            
            final String finalUserId = userId;
            Log.d(TAG, "Saving fall event for user: " + finalUserId);
            
            // Check if Firebase Auth thinks we're authenticated
            FirebaseUser currentUser = mAuth.getCurrentUser();
            if (currentUser != null) {
                Log.d(TAG, "Firebase Auth user: " + currentUser.getUid() + " (matches stored: " + currentUser.getUid().equals(finalUserId) + ")");
            } else {
                Log.w(TAG, "Firebase Auth shows no current user, but we have stored userId: " + finalUserId);
            }
            
            // Create fall event data
            Map<String, Object> fallEvent = new HashMap<>();
            fallEvent.put("timestamp", new Date());
            fallEvent.put("acceleration", acceleration);
            fallEvent.put("duration", duration);
            fallEvent.put("deviceInfo", android.os.Build.MODEL);
            fallEvent.put("userId", finalUserId);
            
            // Add location data if available
            if (lastKnownLocation != null) {
                Map<String, Object> locationData = new HashMap<>();
                locationData.put("latitude", lastKnownLocation.getLatitude());
                locationData.put("longitude", lastKnownLocation.getLongitude());
                locationData.put("accuracy", lastKnownLocation.getAccuracy());
                locationData.put("provider", lastKnownLocation.getProvider());
                locationData.put("locationTimestamp", new Date(lastKnownLocation.getTime()));
                fallEvent.put("location", locationData);
                
                Log.d(TAG, "Fall location: " + lastKnownLocation.getLatitude() + ", " + lastKnownLocation.getLongitude());
            } else {
                fallEvent.put("location", null);
                Log.w(TAG, "No location data available for fall event");
            }
            
            // Format date for better readability
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
            fallEvent.put("readableTimestamp", dateFormat.format(new Date()));
            
            // Save to user-specific subcollection: users/{userId}/falls
            db.collection("users")
                .document(finalUserId)
                .collection("falls")
                .add(fallEvent)
                .addOnSuccessListener(documentReference -> {
                    Log.d(TAG, "Fall event saved to Firebase for user " + finalUserId + " with ID: " + documentReference.getId());
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error saving fall event to Firebase: " + e.getMessage());
                });
                
        } catch (Exception e) {
            Log.e(TAG, "Exception while saving fall to Firebase: " + e.getMessage());
        }
    }
    
    private void requestLocationUpdates() {
        try {
            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && 
                ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Location permissions not granted");
                return;
            }
            
            // Request location updates from both GPS and Network providers
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 30000, 10, locationListener);
                Log.d(TAG, "GPS location updates requested");
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 30000, 10, locationListener);
                Log.d(TAG, "Network location updates requested");
            }
            
            // Get last known location
            Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            
            if (gpsLocation != null) {
                lastKnownLocation = gpsLocation;
            } else if (networkLocation != null) {
                lastKnownLocation = networkLocation;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error requesting location updates: " + e.getMessage());
        }
    }
    
    private LocationListener locationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            lastKnownLocation = location;
            Log.d(TAG, "Location updated: " + location.getLatitude() + ", " + location.getLongitude());
        }
        
        @Override
        public void onProviderEnabled(String provider) {
            Log.d(TAG, "Location provider enabled: " + provider);
        }
        
        @Override
        public void onProviderDisabled(String provider) {
            Log.d(TAG, "Location provider disabled: " + provider);
        }
        
        @Override
        public void onStatusChanged(String provider, int status, android.os.Bundle extras) {
            Log.d(TAG, "Location provider status changed: " + provider + " status: " + status);
        }
    };
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        
        // Unregister sensor listener to save battery
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            Log.d(TAG, "Accelerometer unregistered");
        }
        
        // Stop location updates
        if (locationManager != null) {
            locationManager.removeUpdates(locationListener);
            Log.d(TAG, "Location updates stopped");
        }
        
        Log.d(TAG, "Service destroyed");
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Free Fall Detection";
            String description = "Critical notifications for free fall events";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.enableLights(true);
            channel.setLightColor(android.graphics.Color.RED);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true); // Bypass Do Not Disturb
            channel.setShowBadge(true);
            
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "Notification channel created with high importance");
        }    
    }
    private void showFreeFallNotification(float acceleration, long duration) {
        Log.w(TAG, "Trigger Freefall Notification");
        // Check if notifications are enabled
        if (!notificationManager.areNotificationsEnabled()) {
            Log.w(TAG, "Notifications are disabled for this app");
        }
        
        // Create intent to call emergency number (101)
        Intent callIntent = new Intent(Intent.ACTION_CALL);
        callIntent.setData(android.net.Uri.parse("tel:101"));
        callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, callIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Build the notification with help message
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("Fall Detected")
                .setContentText("Tap here if you need help")
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("A fall has been detected. If you need emergency assistance, tap this notification to call 101."))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(false)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setFullScreenIntent(pendingIntent, true)
                .setColor(android.graphics.Color.RED)
                .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL);
        
        try {
            // Show the notification
            notificationManager.notify(NOTIFICATION_ID, builder.build());
            Log.i(TAG, "Free fall notification sent to system");
            
            // Also try to show as heads-up notification
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = notificationManager.getNotificationChannel(CHANNEL_ID);
                if (channel != null) {
                    Log.d(TAG, "Channel importance: " + channel.getImportance());
                    Log.d(TAG, "Notifications enabled: " + notificationManager.areNotificationsEnabled());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error displaying notification: " + e.getMessage());
        }
    }
    
} 