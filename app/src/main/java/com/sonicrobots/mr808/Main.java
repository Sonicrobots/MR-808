package com.sonicrobots.mr808;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.widget.Toast;
import android.view.KeyEvent;

public class Main extends Activity
{
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        WebView wView = new WebView(this);

        wView.getSettings().setJavaScriptEnabled(true);

        wView.setWebChromeClient(new WebChromeClient() {
          public void onProgressChanged(WebView view, int progress) {
          }
        });

        wView.setWebViewClient(new WebViewClient() {
          public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
          }
        });
        
        setContentView(wView);
        wView.loadUrl("http://192.168.23.40:3000");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        return false;
    }
}
