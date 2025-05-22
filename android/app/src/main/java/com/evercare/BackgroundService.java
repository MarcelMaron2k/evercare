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

public class BackgroundService extends Service implements SensorEventListener{

    private static final String TAG = "BackgroundService";
    private static final String CHANNEL_ID = "FREE_FALL_CHANNEL";
    private static final int NOTIFICATION_ID = 1234;

    private SensorManager sensorManager;
    private Sensor accelerometer;
    private NotificationManager notificationManager;

    private static final float FREE_FALL_THRESHOLD = 2.0f; // m/s²
    private static final long FREE_FALL_TIME_THRESHOLD = 50; // milliseconds

    
    private long freeFallStartTime = 0;
    private boolean inFreeFall = false;

    
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
                
                // Check if free fall has lasted long enough
                long freeFallDuration = System.currentTimeMillis() - freeFallStartTime;
                if (freeFallDuration >= FREE_FALL_TIME_THRESHOLD) {
                    onFreeFallDetected(acceleration, freeFallDuration);
                }
            } else {
                // Reset free fall detection
                if (inFreeFall) {
                    Log.d(TAG, "Free fall ended, acceleration returned to: " + acceleration);
                }
                inFreeFall = false;
                freeFallStartTime = 0;
            }
        }
    }

    private void onFreeFallDetected(float acceleration, long duration) {
        Log.w(TAG, "FREE FALL DETECTED! Duration: " + duration + "ms, Acceleration: " + acceleration);


        // Show notification immediately
        showFreeFallNotification(acceleration, duration);
        
        // Vibrate device to alert user
        vibrateDevice();

        // Add your free fall response logic here
        // Examples:
        // - Send notification
        // - Save to database
        // - Send to server
        // - Trigger emergency response
        
        handleFreeFallEvent(acceleration, duration);
    }
    
    private void handleFreeFallEvent(float acceleration, long duration) {
        // Your custom free fall handling logic
        Log.i(TAG, "Handling free fall event - implement your response here");
        
        // Example: You could send a broadcast to notify other parts of your app
        Intent freeFallIntent = new Intent("com.evercare.FREE_FALL_DETECTED");
        freeFallIntent.putExtra("acceleration", acceleration);
        freeFallIntent.putExtra("duration", duration);
        sendBroadcast(freeFallIntent);
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
        
        Log.d(TAG, "Service destroyed");
        
        // Restart service if killed
        Intent restartIntent = new Intent(getApplicationContext(), BackgroundService.class);
        startService(restartIntent);
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
        
        // Create intent to open app when notification is tapped
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Build the notification with maximum visibility settings
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.stat_sys_warning) // Different system icon
                .setContentTitle("🚨 CRITICAL: FREE FALL DETECTED!")
                .setContentText(String.format("EMERGENCY - Duration: %dms | G-Force: %.2f", duration, acceleration))
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(String.format("🚨 EMERGENCY ALERT 🚨\n\nFree fall event detected!\n\nDuration: %d milliseconds\nAcceleration: %.2f m/s²\n\nDevice may have been dropped or fallen!\n\nTap to open app immediately.", duration, acceleration)))
                .setPriority(NotificationCompat.PRIORITY_MAX) // Changed to MAX
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setDefaults(NotificationCompat.DEFAULT_ALL) // All defaults
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(false)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setFullScreenIntent(pendingIntent, true) // Show as full screen on lock screen
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
    
    private void vibrateDevice() {
        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    // New vibration pattern for newer devices
                    long[] pattern = {0, 500, 200, 500, 200, 1000};
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(pattern, -1));
                } else {
                    // Legacy vibration for older devices
                    long[] pattern = {0, 500, 200, 500, 200, 1000};
                    vibrator.vibrate(pattern, -1);
                }
                Log.d(TAG, "Device vibration triggered");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error triggering vibration: " + e.getMessage());
        }
    }
} 