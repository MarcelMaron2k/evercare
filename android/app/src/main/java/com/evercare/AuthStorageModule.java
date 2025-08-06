package com.evercare;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class AuthStorageModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AuthStorage";
    private static final String PREFS_NAME = "EverCareAuth";
    private BroadcastReceiver fallDetectionReceiver;
    private static final String TAG = "BackgroundService";

    public AuthStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        android.util.Log.d(TAG, "AUTHSTORAGE: AuthStorageModule created");
        
        // Register broadcast receiver for fall detection
        fallDetectionReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                android.util.Log.d(TAG, "AUTHSTORAGE: Broadcast received with action: " + intent.getAction());
                
                if ("com.evercare.FREE_FALL_DETECTED".equals(intent.getAction())) {
                    android.util.Log.d(TAG, "AUTHSTORAGE: Processing fall detection broadcast");
                    
                    WritableMap params = Arguments.createMap();
                    params.putDouble("acceleration", intent.getFloatExtra("acceleration", 0));
                    params.putDouble("duration", intent.getLongExtra("duration", 0));
                    params.putDouble("timestamp", intent.getLongExtra("timestamp", 0));
                    
                    android.util.Log.d(TAG, "AUTHSTORAGE: Fall data - acceleration: " + intent.getFloatExtra("acceleration", 0) + ", duration: " + intent.getLongExtra("duration", 0));
                    
                    // Add location data if available
                    if (intent.hasExtra("latitude")) {
                        params.putDouble("latitude", intent.getDoubleExtra("latitude", 0));
                        params.putDouble("longitude", intent.getDoubleExtra("longitude", 0));
                        params.putDouble("accuracy", intent.getFloatExtra("accuracy", 0));
                        params.putString("provider", intent.getStringExtra("provider"));
                        params.putDouble("locationTimestamp", intent.getLongExtra("locationTimestamp", 0));
                        android.util.Log.d(TAG, "AUTHSTORAGE: Location data included");
                    }
                    
                    android.util.Log.d(TAG, "AUTHSTORAGE: Sending event to React Native");
                    sendEvent("FREE_FALL_DETECTED", params);
                } else {
                    android.util.Log.d(TAG, "AUTHSTORAGE: Ignoring broadcast with action: " + intent.getAction());
                }
            }
        };
        
        IntentFilter filter = new IntentFilter("com.evercare.FREE_FALL_DETECTED");
        
        // Register receiver with appropriate flags for Android 14+
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                reactContext.registerReceiver(fallDetectionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                reactContext.registerReceiver(fallDetectionReceiver, filter);
            }
            android.util.Log.d(TAG, "AUTHSTORAGE: Regular broadcast receiver registered");
        } catch (Exception e) {
            android.util.Log.e(TAG, "AUTHSTORAGE: Error registering regular receiver: " + e.getMessage());
        }
        
        // Also register with LocalBroadcastManager
        try {
            LocalBroadcastManager.getInstance(reactContext).registerReceiver(fallDetectionReceiver, filter);
            android.util.Log.d(TAG, "AUTHSTORAGE: Local broadcast receiver registered");
        } catch (Exception e) {
            android.util.Log.e(TAG, "AUTHSTORAGE: Error registering local receiver: " + e.getMessage());
        }
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void storeUserId(String userId, Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("userId", userId);
            editor.apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void clearUserId(Promise promise) {
        try {
            SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.remove("userId");
            editor.apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage());
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}