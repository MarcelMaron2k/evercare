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
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;

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
    private String caretakerPhone = null;
    private BroadcastReceiver settingsReceiver;

    private static final float FREE_FALL_THRESHOLD = 2.0f; // m/s²
    private static final long FREE_FALL_TIME_THRESHOLD = 50; // milliseconds
    private static final long AUTO_CALL_DELAY = 120000; // 2 minutes in milliseconds

    
    private long freeFallStartTime = 0;
    private boolean inFreeFall = false;
    private boolean fallEventProcessed = false;
    
    // Auto-call timer variables
    private Handler autoCallHandler;
    private Runnable autoCallRunnable;
    private Runnable countdownUpdateRunnable;
    private BroadcastReceiver notificationInteractionReceiver;
    private long autoCallStartTime;

    
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
        
        // Initialize caretaker phone to null - will be set via broadcast from React Native
        caretakerPhone = null;
        
        // Register broadcast receiver for settings updates
        registerSettingsReceiver();
        
        // Initialize auto-call handler
        autoCallHandler = new Handler(Looper.getMainLooper());
        
        // Register notification interaction receiver
        registerNotificationInteractionReceiver();

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

        // Start 2-minute auto-call timer
        startAutoCallTimer();

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

    private void registerSettingsReceiver() {
        settingsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.i(TAG, "=== BackgroundService BroadcastReceiver.onReceive called ===");
                Log.i(TAG, "Received broadcast with action: " + intent.getAction());
                
                if ("com.evercare.REFRESH_CARETAKER_SETTINGS".equals(intent.getAction())) {
                    Log.i(TAG, "=== Processing caretaker settings refresh broadcast ===");
                    
                    // Get caretaker phone from broadcast extras
                    String newCaretakerPhone = intent.getStringExtra("caretakerPhone");
                    String caretakerName = intent.getStringExtra("caretakerName");
                    
                    Log.i(TAG, "Extracted from broadcast - Phone: " + (newCaretakerPhone != null ? newCaretakerPhone : "null"));
                    Log.i(TAG, "Extracted from broadcast - Name: " + (caretakerName != null ? caretakerName : "null"));
                    
                    // Update the caretaker phone directly
                    String oldPhone = caretakerPhone;
                    caretakerPhone = (newCaretakerPhone != null && !newCaretakerPhone.trim().isEmpty()) ? newCaretakerPhone.trim() : null;
                    
                    Log.i(TAG, "Phone updated: '" + (oldPhone != null ? oldPhone : "null") + "' -> '" + (caretakerPhone != null ? caretakerPhone : "null") + "'");
                    Log.i(TAG, "Will use " + (caretakerPhone != null ? ("caretaker: " + caretakerPhone) : "emergency services (101)") + " for fall notifications");
                } else {
                    Log.d(TAG, "Ignoring broadcast with unrecognized action: " + intent.getAction());
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.evercare.REFRESH_CARETAKER_SETTINGS");
        
        // Use RECEIVER_NOT_EXPORTED for internal app broadcasts
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(settingsReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            Log.i(TAG, "Registered broadcast receiver with RECEIVER_NOT_EXPORTED (API 33+)");
        } else {
            registerReceiver(settingsReceiver, filter);
            Log.i(TAG, "Registered broadcast receiver (API < 33)");
        }
        
        Log.d(TAG, "Settings broadcast receiver registered");
    }
    
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
        
        // Unregister settings receiver
        if (settingsReceiver != null) {
            try {
                unregisterReceiver(settingsReceiver);
                Log.d(TAG, "Settings broadcast receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering settings receiver: " + e.getMessage());
            }
        }
        
        // Unregister notification interaction receiver
        if (notificationInteractionReceiver != null) {
            try {
                unregisterReceiver(notificationInteractionReceiver);
                Log.d(TAG, "Notification interaction receiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering notification interaction receiver: " + e.getMessage());
            }
        }
        
        // Cancel auto-call timer
        cancelAutoCallTimer();
        
        Log.d(TAG, "Service destroyed");
    }
    
    private void startAutoCallTimer() {
        // Cancel any existing timer
        cancelAutoCallTimer();
        
        Log.i(TAG, "Starting 2-minute auto-call timer with countdown");
        autoCallStartTime = System.currentTimeMillis();
        
        // Main auto-call timer
        autoCallRunnable = new Runnable() {
            @Override
            public void run() {
                Log.w(TAG, "Auto-call timer expired - making emergency call");
                makeEmergencyCall();
            }
        };
        
        // Countdown update timer (updates every second)
        countdownUpdateRunnable = new Runnable() {
            @Override
            public void run() {
                updateCountdownNotification();
                if (autoCallRunnable != null) {
                    // Schedule next update in 1 second
                    autoCallHandler.postDelayed(countdownUpdateRunnable, 1000);
                }
            }
        };
        
        autoCallHandler.postDelayed(autoCallRunnable, AUTO_CALL_DELAY);
        autoCallHandler.post(countdownUpdateRunnable); // Start countdown updates immediately
    }
    
    private void cancelAutoCallTimer() {
        if (autoCallHandler != null) {
            if (autoCallRunnable != null) {
                autoCallHandler.removeCallbacks(autoCallRunnable);
                autoCallRunnable = null;
            }
            if (countdownUpdateRunnable != null) {
                autoCallHandler.removeCallbacks(countdownUpdateRunnable);
                countdownUpdateRunnable = null;
            }
            Log.i(TAG, "Auto-call timer and countdown cancelled");
        }
    }
    
    private void makeEmergencyCall() {
        Log.w(TAG, "Making automatic emergency call");
        
        // Determine which phone number to call
        String phoneNumber = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? caretakerPhone : "101";
        String contactType = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? "caretaker" : "emergency services (101)";
        
        Log.i(TAG, "Auto-calling: " + phoneNumber + " (" + contactType + ")");
        
        try {
            Intent callIntent = new Intent(Intent.ACTION_CALL);
            callIntent.setData(android.net.Uri.parse("tel:" + phoneNumber));
            callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(callIntent);
            
            // Clear the notification after making the call
            notificationManager.cancel(NOTIFICATION_ID);
            
            Log.i(TAG, "Emergency call initiated successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error making emergency call: " + e.getMessage());
        }
    }
    
    private void updateCountdownNotification() {
        long currentTime = System.currentTimeMillis();
        long elapsed = currentTime - autoCallStartTime;
        long remaining = AUTO_CALL_DELAY - elapsed;
        
        if (remaining <= 0) {
            return; // Timer has expired
        }
        
        int minutes = (int) (remaining / 60000);
        int seconds = (int) ((remaining % 60000) / 1000);
        String countdownText = String.format("%d:%02d", minutes, seconds);
        
        // Determine which phone number to call for display
        String phoneNumber = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? caretakerPhone : "101";
        String contactType = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? "your caretaker" : "emergency services (101)";
        
        // Create the same intents as before
        Intent callIntent = new Intent(Intent.ACTION_CALL);
        callIntent.setData(android.net.Uri.parse("tel:" + phoneNumber));
        callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent callPendingIntent = PendingIntent.getActivity(this, 0, callIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Intent okIntent = new Intent("com.evercare.FALL_NOTIFICATION_OK");
        okIntent.setPackage(getPackageName());
        PendingIntent okPendingIntent = PendingIntent.getBroadcast(this, 0, okIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Intent dismissIntent = new Intent("com.evercare.FALL_NOTIFICATION_DISMISSED");
        dismissIntent.setPackage(getPackageName());
        PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(this, 1, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Build updated notification with countdown (silent updates)
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("Fall Detected")
                .setContentText("Emergency call in " + countdownText + ". Tap 'I'm OK' if you're fine.")
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("Fall detected! Emergency call to " + contactType + " in " + countdownText + " unless you tap 'I'm OK'."))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(false)
                .setContentIntent(callPendingIntent)
                .setDeleteIntent(dismissPendingIntent)
                .addAction(android.R.drawable.ic_menu_call, "Call Help", callPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm OK", okPendingIntent)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setShowWhen(false)
                .setColor(android.graphics.Color.RED)
                .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL);
        
        try {
            notificationManager.notify(NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Error updating countdown notification: " + e.getMessage());
        }
    }
    
    private void registerNotificationInteractionReceiver() {
        notificationInteractionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                Log.i(TAG, "Notification interaction received: " + action);
                
                if ("com.evercare.FALL_NOTIFICATION_OK".equals(action)) {
                    Log.i(TAG, "User indicated they are OK - cancelling auto-call timer");
                    cancelAutoCallTimer();
                    // Clear the notification
                    notificationManager.cancel(NOTIFICATION_ID);
                } else if ("com.evercare.FALL_NOTIFICATION_DISMISSED".equals(action)) {
                    Log.i(TAG, "Fall notification was dismissed - cancelling auto-call timer");
                    cancelAutoCallTimer();
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction("com.evercare.FALL_NOTIFICATION_OK");
        filter.addAction("com.evercare.FALL_NOTIFICATION_DISMISSED");
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(notificationInteractionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(notificationInteractionReceiver, filter);
        }
        
        Log.d(TAG, "Notification interaction receiver registered");
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
        
        // Determine which phone number to call
        Log.i(TAG, "Creating fall notification - caretakerPhone value: " + (caretakerPhone != null ? caretakerPhone : "null"));
        String phoneNumber = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? caretakerPhone : "101";
        String contactType = (caretakerPhone != null && !caretakerPhone.trim().isEmpty()) ? "your caretaker" : "emergency services (101)";
        Log.i(TAG, "Will call: " + phoneNumber + " (" + contactType + ")");
        
        // Create intent to call the appropriate number
        Intent callIntent = new Intent(Intent.ACTION_CALL);
        callIntent.setData(android.net.Uri.parse("tel:" + phoneNumber));
        callIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent callPendingIntent = PendingIntent.getActivity(this, 0, callIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Create intent for "I'm OK" action
        Intent okIntent = new Intent("com.evercare.FALL_NOTIFICATION_OK");
        okIntent.setPackage(getPackageName());
        PendingIntent okPendingIntent = PendingIntent.getBroadcast(this, 0, okIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Create intent for notification dismiss
        Intent dismissIntent = new Intent("com.evercare.FALL_NOTIFICATION_DISMISSED");
        dismissIntent.setPackage(getPackageName());
        PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(this, 1, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Build the notification with help message and action buttons
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("Fall Detected")
                .setContentText("Emergency call in 2 minutes. Tap 'I'm OK' if you're fine.")
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText("Fall detected! Emergency call to " + contactType + " in 2 minutes unless you tap 'I'm OK'."))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(false)
                .setContentIntent(callPendingIntent)
                .setDeleteIntent(dismissPendingIntent)
                .addAction(android.R.drawable.ic_menu_call, "Call Help", callPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "I'm OK", okPendingIntent)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setFullScreenIntent(callPendingIntent, true)
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