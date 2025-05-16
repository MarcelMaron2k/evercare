package com.anonymous.evercare.services;
import com.anonymous.evercare.R;  
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
      if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
        Intent svc = new Intent(context, FallDetectionService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(svc);
        } else {
          context.startService(svc);
        }
      }
    }
}
