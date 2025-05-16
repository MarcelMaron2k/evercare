package com.anonymous.evercare.services;

import android.app.Service;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import com.anonymous.evercare.R;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class FallDetectionService extends Service implements SensorEventListener {
    private static final String CHANNEL_ID   = "fall_detection_channel";
    private static final int    NOTIF_ID     = 1;
    private static final int    FOREGROUND_ID = 1001;

    private SensorManager sensorManager;
    private Sensor accelSensor;

    private Notification createNotification() {
        NotificationChannel channel = new NotificationChannel(
            "fall_detection_channel",
            "Fall Detection",
            NotificationManager.IMPORTANCE_LOW
        );
    
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    
        return new NotificationCompat.Builder(this, "fall_detection_channel")
            .setContentTitle("Fall Detection Running")
            .setContentText("Monitoring for falls...")
            .setSmallIcon(R.mipmap.ic_launcher) // Make sure this icon exists
            .build();
    }

    @Override
    public void onCreate() {
      super.onCreate();
      sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
      accelSensor   = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
  
      createNotificationChannel();
      startForeground(FOREGROUND_ID, buildForegroundNotification());
      sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_NORMAL);
    }
  
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
      // If service is killed, restart it
      Log.d("FallDetectionService", "Service started");

      new Handler(Looper.getMainLooper()).postDelayed(() -> {
        Notification notification = createNotification();
        startForeground(NOTIF_ID, notification);
      }, 1000);
    
      return START_STICKY;
    }
  
    @Override
    public void onDestroy() {
      sensorManager.unregisterListener(this);
      super.onDestroy();
    }
  
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
      return null;
    }
  
    // SensorEventListener callbacks
    private static final float FALL_THRESHOLD = 7.5f;  // m/s² — tweak in testing
    private long lastFallTime = 0;
  
    @Override
    public void onSensorChanged(SensorEvent event) {
      float x = event.values[0];
      float y = event.values[1];
      float z = event.values[2];
      // Compute magnitude of acceleration vector
      double magnitude = Math.sqrt(x*x + y*y + z*z);
  
      long now = System.currentTimeMillis();
      // simple threshold + debounce
      if (magnitude < FALL_THRESHOLD && now - lastFallTime > 5000) {
        lastFallTime = now;
        postFallNotification();
      }
    }
  
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }
  
    // Create your foreground “ongoing” notification (so Android keeps your service alive)
    private Notification buildForegroundNotification() {
      return new NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Fall Detection Active")
        .setContentText("Monitoring for falls…")
        .setSmallIcon(R.mipmap.ic_launcher)    // your own icon
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_SERVICE)
        .build();
    }
  
    // NotificationChannel (Android 8.0+)
    private void createNotificationChannel() {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationChannel chan = new NotificationChannel(
          CHANNEL_ID,
          "Fall Detection",
          NotificationManager.IMPORTANCE_HIGH
        );
        chan.setDescription("Alerts when a fall is detected");
        NotificationManager mgr = getSystemService(NotificationManager.class);
        mgr.createNotificationChannel(chan);
      }
    }
  
    // Post the “Fall detected” alert
    private void postFallNotification() {
      Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Fall Detected!")
        .setContentText("A fall was just detected. Are you okay?")
        .setSmallIcon(R.mipmap.ic_launcher)         // your own icon
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .build();
  
      NotificationManager mgr = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
      mgr.notify(NOTIF_ID, notif);
    }
  }